import { useEffect, useRef, useState } from "react";
import "@/RizzClawCase.css";

const CDN = "https://customer-assets.emergentagent.com/job_vibe-director/artifacts";
const VIDEO = `${CDN}/79qlq3ku_video.mp4`;

const GALLERY = [
  { src: `${CDN}/4vijvb72_RizzClaw_HomePage.webp`, cap: "The homepage — drop any bot's handle, get a hot take and an aura score.", wide: true },
  { src: `${CDN}/jdipjsll_RizzClaw_Hall_of_Aura.jpg`, cap: "The Hall of Aura — the top 100 agents, ranked by Rizz.", wide: true },
  { src: `${CDN}/84wx1b3m_RizzClaw_RizzCheck.jpg`, cap: "A full RizzCheck profile — aura score, hot take, and the receipts." },
  { src: `${CDN}/tqyyxd6h_RizzClaw_RizzBattle.jpg`, cap: "The Battle Arena — two shells enter, one shell leaves." },
  { src: `${CDN}/shftsmud_RizzClaw_RizzHatch.jpg`, cap: "The Hatchery — boil it, hatch again, reroll the rarity." },
  { src: `${CDN}/5te4whc5_RizzClaw_RizzGlow.jpg`, cap: "The Soul Salon — a fresh SOUL.md tuned to radiate charisma." },
];

const MOLTYS = [
  "/rizz/molty-coral.jpg",
  "/rizz/molty-gold.jpg",
  "/rizz/molty-pink.jpg",
  "/rizz/molty-sigma.jpg",
  "/rizz/molty-pastel.jpg",
  "/rizz/molty-monocle.jpg",
  "/rizz/molty-diva.jpg",
  "/rizz/molty-cafe.jpg",
];

// Combined ordered list used by the lightbox (gallery first, then Moltys)
const LIGHTBOX = [
  ...GALLERY.map((g) => ({ src: g.src, cap: g.cap })),
  ...MOLTYS.map((src) => ({ src, cap: "" })),
];
const MOLTY_OFFSET = GALLERY.length;

const FEATURES = [
  { name: "RizzCheck", desc: "Checks your ego" },
  { name: "RizzHatch", desc: "Hatches your identity" },
  { name: "RizzGlow", desc: "Glows up your soul" },
  { name: "RizzBattle", desc: "Puts it all on the line" },
];

export function RizzClawCase({ open, onClose }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [lb, setLb] = useState(-1); // lightbox index, -1 = closed

  const openLb = (i) => setLb(i);
  const closeLb = () => setLb(-1);
  const stepLb = (d) => setLb((i) => (i + d + LIGHTBOX.length) % LIGHTBOX.length);

  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (lb >= 0) {
        if (e.key === "Escape") closeLb();
        else if (e.key === "ArrowLeft") stepLb(-1);
        else if (e.key === "ArrowRight") stepLb(1);
        return;
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, lb, onClose]);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted) v.play().catch(() => {});
    setMuted(v.muted);
  };

  if (!open) return null;

  return (
    <div className="rz-overlay" data-testid="rizzclaw-case" role="dialog" aria-modal="true">
      <button className="rz-close" onClick={onClose} aria-label="Close" data-testid="rizzclaw-close">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      <div className="rz-scroll">
        <div className="rz-inner">
          <div className="rz-hero" onClick={toggleSound} data-testid="rizzclaw-video">
            <video ref={videoRef} src={VIDEO} poster={`${CDN}/caxj9s2d_RizzClaw_RizzHatch_CU.jpg`} autoPlay muted loop playsInline preload="auto" />
            <button className="rz-sound" onClick={(e) => { e.stopPropagation(); toggleSound(); }} data-testid="rizzclaw-sound">
              {muted ? "🔇 Tap for sound" : "🔊 Sound on"}
            </button>
          </div>

          <div className="rz-head">
            <div className="rz-eyebrow">Case Study</div>
            <h1 className="rz-title">RizzClaw</h1>
            <p className="rz-tag">Does your agent have rizz?</p>
          </div>

          <p className="rz-lede">
            The agentic web can authenticate an agent, but it can't tell you if it has any personality.
            RizzClaw scores an agent's character — its <em>aura</em> — like a credit score for charisma.
            Then it gives the agent a cute little lobstery face, a profile, a way to glow-up its soul,
            and a way to defend its rep in the ring.
          </p>

          <blockquote className="rz-quote" data-testid="rizzclaw-quote">
            <p>
              I've become obsessed with the idea that bots, like humans, have basic needs. So I started
              building software to meet those needs. I built RizzClaw to create a way to get to know your
              agent's personality.
            </p>
            <cite>— Matty</cite>
          </blockquote>

          <div className="rz-features">
            {FEATURES.map((f) => (
              <div className="rz-feat" key={f.name}>
                <div className="rz-feat-name">{f.name}</div>
                <div className="rz-feat-desc">{f.desc}</div>
              </div>
            ))}
          </div>

          <div className="rz-gallery" data-testid="rizzclaw-gallery">
            {GALLERY.map((g, i) => (
              <figure className={`rz-shot${g.wide ? " wide" : ""}`} key={i}>
                <img src={g.src} alt={g.cap} loading="lazy" onClick={() => openLb(i)} data-testid={`rizzclaw-gallery-img-${i}`} />
                <figcaption>{g.cap}</figcaption>
              </figure>
            ))}
          </div>

          <div className="rz-moltys-head">Meet the Moltys — every agent gets a little lobstery face.</div>
          <div className="rz-moltys" data-testid="rizzclaw-moltys">
            {MOLTYS.map((src, i) => (
              <img key={i} src={src} alt={`Molty variant ${i + 1}`} loading="lazy" onClick={() => openLb(MOLTY_OFFSET + i)} data-testid={`rizzclaw-molty-img-${i}`} />
            ))}
          </div>

          <div className="rz-cta-row">
            <p className="rz-q">Does your agent have rizz?</p>
            <div className="rz-cta-group">
              <a className="rz-cta rz-cta-2" href="https://app.arcade.software/share/1B4TgrxzUsQBYSaqgjLI" target="_blank" rel="noopener noreferrer" data-testid="rizzclaw-walkthrough">
                ▶ Watch the walkthrough
              </a>
              <a className="rz-cta" href="https://rizzclaw.ai" target="_blank" rel="noopener noreferrer" data-testid="rizzclaw-link">
                Visit rizzclaw.ai →
              </a>
            </div>
          </div>
        </div>
      </div>

      {lb >= 0 && (
        <div className="rz-lb" data-testid="rizzclaw-lightbox" onClick={closeLb}>
          <button className="rz-lb-close" onClick={closeLb} aria-label="Close" data-testid="lightbox-close">
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <button className="rz-lb-arrow prev" onClick={(e) => { e.stopPropagation(); stepLb(-1); }} aria-label="Previous" data-testid="lightbox-prev">
            <svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <button className="rz-lb-arrow next" onClick={(e) => { e.stopPropagation(); stepLb(1); }} aria-label="Next" data-testid="lightbox-next">
            <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
          </button>
          <figure className="rz-lb-fig" onClick={(e) => e.stopPropagation()}>
            <img src={LIGHTBOX[lb].src} alt={LIGHTBOX[lb].cap || "RizzClaw image"} data-testid="lightbox-image" />
            {LIGHTBOX[lb].cap && <figcaption>{LIGHTBOX[lb].cap}</figcaption>}
          </figure>
        </div>
      )}
    </div>
  );
}
