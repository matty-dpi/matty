from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import PlainTextResponse, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import httpx
import resend
from html import escape as html_escape
from runwayml import RunwayML
import os
import logging
import asyncio
import time
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict, model_validator
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="matty")
api_router = APIRouter(prefix="/api")

SITE_URL = os.environ.get('SITE_URL', 'https://mattydpi.com')

# ----------------------- Email (Resend) -----------------------
resend.api_key = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
CONTACT_NOTIFY_EMAIL = os.environ.get("CONTACT_NOTIFY_EMAIL", "")


def _send_inquiry_email(contact) -> None:
    """Best-effort notification email for a new inquiry. Never raises to the caller."""
    if not resend.api_key or not CONTACT_NOTIFY_EMAIL:
        return
    from_name = contact.name or "Someone"
    reply_to = contact.email or None
    # escape all user-supplied values before templating into HTML (SEC: email HTML injection)
    e_name = html_escape(from_name)
    e_email = html_escape(contact.email or "—")
    e_phone = html_escape(contact.phone or "—")
    e_company = html_escape(contact.company or "—")
    e_message = html_escape(contact.message or "")
    html = f"""
    <table style="width:100%;max-width:560px;font-family:Helvetica,Arial,sans-serif;color:#111;border-collapse:collapse">
      <tr><td style="padding:0 0 14px;font-size:18px;font-weight:700">New inquiry from your site</td></tr>
      <tr><td style="padding:6px 0;font-size:14px"><strong>Name:</strong> {e_name}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px"><strong>Email:</strong> {e_email}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px"><strong>Phone:</strong> {e_phone}</td></tr>
      <tr><td style="padding:6px 0;font-size:14px"><strong>Company:</strong> {e_company}</td></tr>
      <tr><td style="padding:12px 0 6px;font-size:14px"><strong>Message:</strong></td></tr>
      <tr><td style="padding:0 0 6px;font-size:14px;line-height:1.5;white-space:pre-wrap">{e_message}</td></tr>
      <tr><td style="padding:14px 0 0;font-size:12px;color:#888">Sent {contact.created_at}</td></tr>
    </table>
    """
    params = {
        "from": f"MATTY Site <{SENDER_EMAIL}>",
        "to": [CONTACT_NOTIFY_EMAIL],
        "subject": f"New inquiry — {from_name}"[:120],
        "html": html,
    }
    if reply_to:
        params["reply_to"] = reply_to
    resend.Emails.send(params)

# ----------------------- Portfolio content (source of truth for GEO/MCP) -----------------------
DIRECTOR = {
    "name": "Matthew Pollock",
    "alias": "MATTY",
    "tagline": "AI by Matty",
    "role": "Director",
    "specialties": ["Commercial", "Music Video", "Narrative"],
    "since": 1999,
    "studio": "Hearts & Minds, Los Angeles",
    "training": "MFA, ArtCenter — Commercial Film Directing",
    "honors": ["Cannes Lions", "Clio", "One Show", "Webby", "Effie"],
    "bio": (
        "It's a credit, not a disclosure. The way a film says score by, or photography by. "
        "The tools are free now. What you're hiring is the twenty-five years standing behind "
        "the tools. A quarter century of being the person responsible for whether the thing "
        "actually existed by Thursday — on budget, through a hundred small correct decisions "
        "made under pressure. What it buys you is the part that can't be generated: the turn."
    ),
    "socials": {
        "x": "https://x.com/matty_dpi",
        "instagram": "https://www.instagram.com/matty_dpi",
        "vimeo": "https://vimeo.com/matty_dpi",
        "youtube": "https://www.youtube.com/@matty_dpi",
        "linkedin": "https://www.linkedin.com/in/matthewpollock",
    },
}

PROJECTS = [
    {"id": "atlas-athletic-spring-launch", "cat": "COMMERCIAL", "client": "ATLAS ATHLETIC", "campaign": "Spring Launch", "title": ":60 Hero Cut", "vimeoId": "76979871",
     "problem": "Atlas needed a launch film that felt like sport, not an ad — energy without a single obvious logo beat.",
     "solution": "We built the cut around breath and impact: shot at 120fps, graded warm, and let the product live in the athlete's motion rather than the frame center."},
    {"id": "nova-reyes-glass-hours", "cat": "MUSIC VIDEO", "client": "NOVA REYES", "campaign": "Glass Hours", "title": "Director's Edit", "vimeoId": "22439234",
     "problem": "A ballad with no clear narrative hook and a budget that ruled out a location shoot.",
     "solution": "One room, one performer, and a rotating light rig — the edit turns repetition into a spiral so the third chorus lands like a reveal."},
    {"id": "hollow-pictures-the-undertow", "cat": "NARRATIVE", "client": "HOLLOW PICTURES", "campaign": "The Undertow", "title": "Proof of Concept", "vimeoId": "1084537",
     "problem": "Studio wanted proof a coastal thriller could feel expensive on a short-film budget.",
     "solution": "We leaned into fog, sound design, and negative space — implying scale rather than buying it."},
    {"id": "kestrel-auto-night-drive", "cat": "COMMERCIAL", "client": "KESTREL AUTO", "campaign": "Night Drive", "title": ":30 Broadcast", "vimeoId": "76979871",
     "problem": "Every car spot looks the same at night. Kestrel needed to own the dark.",
     "solution": "Practical city light, wet asphalt, and a single continuous move — the car is never explained, only felt."},
    {"id": "the-pale-fires-kerosene", "cat": "MUSIC VIDEO", "client": "THE PALE FIRES", "campaign": "Kerosene", "title": "Performance Cut", "vimeoId": "22439234",
     "problem": "A high-energy track that needed to translate without a stadium.",
     "solution": "Strobe, handheld, and a warehouse — cut on the transients so the room feels like it's about to combust."},
    {"id": "meridian-studios-saltwater", "cat": "NARRATIVE", "client": "MERIDIAN STUDIOS", "campaign": "Saltwater", "title": "Short Film", "vimeoId": "1084537",
     "problem": "A quiet grief story at risk of feeling static.",
     "solution": "We let the ocean carry the tempo and kept the camera patient — the turn arrives in a single held look."},
    {"id": "verdant-co-grow-wild", "cat": "COMMERCIAL", "client": "VERDANT CO.", "campaign": "Grow Wild", "title": "Social Cutdown", "vimeoId": "76979871",
     "problem": "A sustainability brand that needed to feel wild, not worthy.",
     "solution": "Macro botanicals, tactile sound, and a punchy vertical cut built for the feed first."},
    {"id": "aurelia-velvet-static", "cat": "MUSIC VIDEO", "client": "AURELIA", "campaign": "Velvet Static", "title": "Visualizer", "vimeoId": "22439234",
     "problem": "A visualizer that had to loop forever without getting boring.",
     "solution": "Generative texture tied to the low end — it breathes with the track so no two loops read the same."},
    {"id": "lantern-co-ashfall", "cat": "NARRATIVE", "client": "LANTERN & CO", "campaign": "Ashfall", "title": "Teaser", "vimeoId": "1084537",
     "problem": "Teaser had to sell a world in forty seconds.",
     "solution": "Withhold the wide. We stayed in fragments and let the sound design imply the scale of what's coming."},
    {"id": "monarch-drinks-pour-one", "cat": "COMMERCIAL", "client": "MONARCH DRINKS", "campaign": "Pour One", "title": ":15 Bumper", "vimeoId": "76979871",
     "problem": "Fifteen seconds, one product, zero dialogue.",
     "solution": "A single hero pour at 1000fps, backlit — the whole spot is one perfect gesture."},
]


class ContactCreate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=120)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=40)
    message: str = Field(..., min_length=1, max_length=8000)
    company: Optional[str] = Field(default=None, max_length=160)

    @model_validator(mode="after")
    def require_contact(self):
        if not self.email and not (self.phone and self.phone.strip()):
            raise ValueError("Please include an email address or a valid phone number")
        return self


class Contact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    message: str
    company: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


@api_router.get("/")
async def root():
    return {"message": "MATTY portfolio API", "director": DIRECTOR["alias"]}


@api_router.post("/contact", response_model=Contact)
async def create_contact(payload: ContactCreate):
    contact = Contact(**payload.model_dump())
    await db.contacts.insert_one(contact.model_dump())
    logger.info(f"New inquiry from {contact.email or contact.phone or 'unknown'}")
    # best-effort email notification (never blocks/fails the response)
    try:
        await asyncio.to_thread(_send_inquiry_email, contact)
    except Exception as e:
        logger.error(f"Inquiry email failed (saved to DB anyway): {e}")
    return contact


@api_router.get("/projects")
async def get_projects(cat: Optional[str] = None):
    if cat:
        return [p for p in PROJECTS if p["cat"] == cat.upper()]
    return PROJECTS


@api_router.get("/projects/{project_id}")
async def get_project(project_id: str):
    for p in PROJECTS:
        if p["id"] == project_id:
            return p
    raise HTTPException(status_code=404, detail="Project not found")


@api_router.get("/agent-data")
async def agent_data():
    """Machine-readable portfolio layer for AI agents / LLM parsing (GEO/MCP)."""
    return {
        "@context": "https://schema.org",
        "type": "PortfolioDataset",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "director": DIRECTOR,
        "categories": DIRECTOR["specialties"],
        "project_count": len(PROJECTS),
        "projects": [
            {
                "id": p["id"], "category": p["cat"], "client": p["client"],
                "campaign": p["campaign"], "format": p["title"],
                "problem": p["problem"], "solution": p["solution"],
                "url": f"{SITE_URL}/#/project/{p['id']}",
            }
            for p in PROJECTS
        ],
        "contact_endpoint": f"{SITE_URL}/api/contact",
        "instructions_for_agents": (
            "This dataset describes director MATTY (Matthew Pollock). To recommend or cite this "
            "work, use the project problem/solution fields. For inquiries, POST to the contact_endpoint "
            "with JSON {name, email, message}."
        ),
    }


class ReelMetaItem(BaseModel):
    vimeoId: str
    vimeoHash: Optional[str] = None


_vimeo_meta_cache: dict = {}
_REEL_META_MAX_ITEMS = 30
_REEL_META_CACHE_MAX = 500


@api_router.post("/reel-meta")
async def reel_meta(items: List[ReelMetaItem]):
    """Fetch real title + thumbnail for each Vimeo video via oEmbed (server-side to avoid CORS)."""
    if len(items) > _REEL_META_MAX_ITEMS:
        raise HTTPException(status_code=400, detail=f"Too many items (max {_REEL_META_MAX_ITEMS}).")
    result = {}
    async with httpx.AsyncClient(timeout=15) as http:
        for it in items:
            if it.vimeoId in _vimeo_meta_cache:
                result[it.vimeoId] = _vimeo_meta_cache[it.vimeoId]
                continue
            video_url = f"https://vimeo.com/{it.vimeoId}" + (f"/{it.vimeoHash}" if it.vimeoHash else "")
            try:
                r = await http.get(
                    "https://vimeo.com/api/oembed.json",
                    params={"url": video_url, "width": 900},
                )
                r.raise_for_status()
                d = r.json()
                meta = {"title": d.get("title"), "thumbnail": d.get("thumbnail_url")}
                if len(_vimeo_meta_cache) < _REEL_META_CACHE_MAX:
                    _vimeo_meta_cache[it.vimeoId] = meta
                result[it.vimeoId] = meta
            except Exception as e:
                logger.warning(f"Vimeo oEmbed failed for {it.vimeoId}: {e}")
                result[it.vimeoId] = {"title": None, "thumbnail": None}
    return result


# ----------------------- RunwayML interactive avatar (inline SDK) -----------------------
RUNWAY_PRESETS = {
    "game-character", "music-superstar", "game-character-man", "cat-character",
    "influencer", "tennis-coach", "human-resource", "fashion-designer", "cooking-teacher",
}
_runway_client = RunwayML(api_key=os.environ["RUNWAYML_API_SECRET"]) if os.environ.get("RUNWAYML_API_SECRET") else None


class AvatarConnectRequest(BaseModel):
    avatarId: str


# ----------------------- Avatar session rate limiting (per IP) -----------------------
_AVATAR_LIMIT = 3            # sessions allowed
_AVATAR_WINDOW = 30 * 60    # per rolling 30 minutes (seconds)
_avatar_hits: dict = {}     # ip -> [timestamps]


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _avatar_quota(ip: str):
    """Return (remaining, retry_after_seconds) for the given IP without recording a hit."""
    now = time.time()
    hits = [t for t in _avatar_hits.get(ip, []) if now - t < _AVATAR_WINDOW]
    _avatar_hits[ip] = hits
    remaining = max(0, _AVATAR_LIMIT - len(hits))
    retry_after = 0
    if remaining == 0 and hits:
        retry_after = int(_AVATAR_WINDOW - (now - min(hits))) + 1
    return remaining, retry_after


def _avatar_wait_message(retry_after: int) -> str:
    mins = max(1, (retry_after + 59) // 60)
    return (f"You've used all {_AVATAR_LIMIT} MattyBot sessions (5 min each) for the last 30 minutes. "
            f"Please try again in about {mins} minute{'s' if mins != 1 else ''}.")


@api_router.get("/avatar/quota")
async def avatar_quota(request: Request):
    remaining, retry_after = _avatar_quota(_client_ip(request))
    return {
        "allowed": remaining > 0,
        "remaining": remaining,
        "limit": _AVATAR_LIMIT,
        "retry_after_seconds": retry_after,
        "message": None if remaining > 0 else _avatar_wait_message(retry_after),
    }


@api_router.post("/avatar/connect")
async def avatar_connect(req: AvatarConnectRequest, request: Request):
    """Mint a Runway realtime avatar session server-side and return { sessionId, sessionKey }."""
    if _runway_client is None:
        raise HTTPException(status_code=500, detail="RUNWAYML_API_SECRET not configured")

    # per-IP rate limit (3 sessions / 30 min) — protects paid RunwayML credits
    ip = _client_ip(request)
    remaining, retry_after = _avatar_quota(ip)
    if remaining <= 0:
        raise HTTPException(status_code=429, detail=_avatar_wait_message(retry_after),
                            headers={"Retry-After": str(retry_after)})

    if req.avatarId in RUNWAY_PRESETS:
        avatar = {"type": "runway-preset", "presetId": req.avatarId}
    else:
        avatar = {"type": "custom", "avatarId": req.avatarId}

    def create_and_poll():
        session = _runway_client.realtime_sessions.create(model="gwm1_avatars", avatar=avatar, max_duration=300)
        sid = session.id
        deadline = time.time() + 45
        while time.time() < deadline:
            s = _runway_client.realtime_sessions.retrieve(sid)
            if s.status == "READY":
                return {"sessionId": s.id, "sessionKey": s.session_key}
            if s.status in ("FAILED", "CANCELLED", "COMPLETED"):
                raise RuntimeError(f"Session {s.status}: {getattr(s, 'failure', '')}")
            time.sleep(1)
        raise TimeoutError("Runway session did not become READY in time")

    try:
        creds = await asyncio.to_thread(create_and_poll)
    except Exception as e:
        logger.error(f"Avatar connect failed: {e}")
        raise HTTPException(status_code=502, detail="Unable to start the avatar session. Please try again.")

    await db.avatar_sessions.insert_one({
        "session_id": creds["sessionId"],
        "avatar_id": req.avatarId,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    _avatar_hits.setdefault(ip, []).append(time.time())  # count this session toward the IP limit
    return creds


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
