import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import Player from "@vimeo/player";
import { motion, AnimatePresence } from "framer-motion";
import "@/App.css";
import { CATS, ITEMS, SOCIALS, vimeoSrc } from "@/data/portfolio";
import { MattBot, MattBotStage } from "@/MattBot";
import { RizzClawCase } from "@/RizzClawCase";
import { BrandCase, BRAND_CASES } from "@/BrandCase";
import { VideoCase, VIDEO_CASES } from "@/VideoCase";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const PORTRAIT = "https://customer-assets.emergentagent.com/job_vibe-director/artifacts/is67ktjd_Matty_Portrait_BW.webp";
const HERO_REEL = "1209197622"; // WENDOLLS — homescreen hero reel
// Reel display order: these 5 lead (first 3 render full-span), the rest follow in their original order.
const REEL_ORDER = ["wendolls-ridicule", "hear360-listen", "nescafe-pour-away", "brooks-martin-do", "karin-rybar-tarde-o-temprano"];
const reelRank = (id) => { const i = REEL_ORDER.indexOf(id); return i === -1 ? REEL_ORDER.length + ITEMS.findIndex((x) => x.id === id) : i; };
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const PlayGlyph = () => (<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z" /></svg>);

export default function App() {
  const [view, setView] = useState(() => {
    const path = window.location.pathname.slice(1);
    const validViews = ["reel", "about", "mattybot", "contact", "projects"];
    if (validViews.includes(path)) return path;
    return null;
  });
  const [navIn, setNavIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filters, setFilters] = useState(new Set());

  // landing hero reel player (real Vimeo video)
  const [playing, setPlaying] = useState(false);  // play mode active (video layer shown)
  const [paused, setPaused] = useState(false);     // video paused
  const [prog, setProg] = useState(0);
  const [dur, setDur] = useState(0);
  const [muted, setMuted] = useState(true);
  const [controlsShow, setControlsShow] = useState(false);

  // full player (reel View Mode) — mirrors the homepage custom player
  const [fullOpen, setFullOpen] = useState(false);
  const [fullIdx, setFullIdx] = useState(0);
  const [fullPaused, setFullPaused] = useState(false);
  const [fullMuted, setFullMuted] = useState(false);
  const [fullProg, setFullProg] = useState(0);
  const [fullDur, setFullDur] = useState(0);
  const [fullShow, setFullShow] = useState(true);

  // case study
  const [caseProj, setCaseProj] = useState(null);

  // Mattbot interactive avatar overlay
  const [mattbotOpen, setMattbotOpen] = useState(false);

  // RizzClaw case study overlay
  const [rizzOpen, setRizzOpen] = useState(false);

  // Brand case studies (Edgehog, Cortex)
  const [brandCase, setBrandCase] = useState(null);

  // Multi-video case studies (HEAR360, TWIX)
  const [videoCase, setVideoCase] = useState(null);

  // real titles + thumbnails fetched live from Vimeo (via backend oEmbed proxy)
  const [meta, setMeta] = useState({});
  
  // URL sync/deep-linking
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.slice(1);
      const validViews = ["reel", "about", "mattybot", "contact", "projects"];
      setView(validViews.includes(path) ? path : null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Fetch vimeo metadata
  useEffect(() => {
    axios
      .post(`${API}/reel-meta`, ITEMS.map((it) => ({ vimeoId: it.vimeoId, vimeoHash: it.vimeoHash || null })))
      .then((r) => setMeta(r.data || {}))
      .catch(() => {});
  }, []);
  const titleOf = (it) => (it && meta[it.vimeoId] && meta[it.vimeoId].title) || "";
  const thumbOf = (it) => (it && meta[it.vimeoId] && meta[it.vimeoId].thumbnail) || "";

  const hoverRef = useRef(false);
  const idleRef = useRef(null);
  const idleNavRef = useRef(null);
  const fullIdleRef = useRef(null);
  const playingRef = useRef(false);
  const fullOpenRef = useRef(false);
  const heroFrameRef = useRef(null);
  const playerRef = useRef(null);
  const fullFrameRef = useRef(null);
  const fullPlayerRef = useRef(null);
  const fullRootRef = useRef(null);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { fullOpenRef.current = fullOpen; }, [fullOpen]);

  const filtered = ITEMS
    .filter((it) => filters.size === 0 || filters.has(it.cat))
    .slice()
    .sort((a, b) => reelRank(a.id) - reelRank(b.id));

  // nav visibility: always shown when a panel/menu is open, else on hover
  useEffect(() => { if (view || menuOpen) setNavIn(true); }, [view, menuOpen]);

  // forgiving hover corridor on the landing: keep the nav revealed anywhere in the vertical strip
  // between the top nav and the logo, so the cursor can slide from the logo up to the nav without a mouse-off.
  useEffect(() => {
    const onMove = (e) => {
      if (view || menuOpen || playing) return; // only manage plain landing hover here
      const morph = document.querySelector(".matty .morph");
      const navEl = document.querySelector(".matty nav");
      let keep = false;
      if (morph) {
        const r = morph.getBoundingClientRect();
        const padX = 140;
        if (e.clientY <= r.bottom + 24 && e.clientX >= r.left - padX && e.clientX <= r.right + padX) keep = true;
      }
      if (navEl) {
        const nr = navEl.getBoundingClientRect();
        if (e.clientY <= nr.bottom + 40) keep = true; // near/over the whole nav bar
      }
      if (keep) { clearTimeout(idleNavRef.current); setNavIn(true); }
      else { clearTimeout(idleNavRef.current); idleNavRef.current = setTimeout(() => { if (!hoverRef.current) setNavIn(false); }, 260); }
    };
    const onLeaveWindow = () => { if (!view && !menuOpen && !playing && !hoverRef.current) setNavIn(false); };
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeaveWindow);
    return () => { window.removeEventListener("mousemove", onMove); document.removeEventListener("mouseleave", onLeaveWindow); };
  }, [view, menuOpen, playing]);

  // real Vimeo hero-reel player — attach to a direct-embed <iframe> (bypasses the oEmbed lookup that
  // broke playback). Cleanup only removes listeners + pauses; NEVER destroy() (that would remove the
  // React-owned iframe). Kept ready so we can unmute + play inside the click gesture (audio allowed).
  useEffect(() => {
    if (!heroFrameRef.current) return;
    const p = new Player(heroFrameRef.current);
    playerRef.current = p;
    const onTime = (data) => setProg(data.seconds);
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    const onError = () => {}; // swallow Vimeo playback/privacy errors (e.g. embed not whitelisted)
    p.on("timeupdate", onTime);
    p.on("play", onPlay);
    p.on("pause", onPause);
    p.on("error", onError);
    p.ready().then(() => p.getDuration()).then((d) => setDur(d)).catch(() => {});
    return () => {
      try { p.off("timeupdate", onTime); p.off("play", onPlay); p.off("pause", onPause); p.off("error", onError); p.pause().catch(() => {}); } catch (e) {}
      if (playerRef.current === p) playerRef.current = null;
    };
  }, []);

  // swallow Vimeo SDK privacy/embed rejections so they don't surface as an unhandled rejection overlay
  useEffect(() => {
    const swallow = (e) => {
      const r = e.reason || {};
      if (r.name === "PrivacyError" || /vimeo|privacy|little trouble|not.*found/i.test(String(r.message || ""))) {
        e.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", swallow);
    return () => window.removeEventListener("unhandledrejection", swallow);
  }, []);

  // reveal the control bar; auto-hide only while actually playing
  const armIdle = useCallback(() => {
    setControlsShow(true);
    if (playingRef.current) setNavIn(true);
    clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => {
      if (playingRef.current && !fullOpen) { setControlsShow(false); setNavIn(false); }
    }, 2600);
  }, [fullOpen]);

  // while playing: moving the mouse re-reveals the controls + nav; rolling the mouse OFF the screen
  // hides them immediately so the video is seen full-screen (holding still hides via the idle timer)
  useEffect(() => {
    const onMove = () => { if (playingRef.current) armIdle(); };
    const onLeave = () => { if (playingRef.current) { clearTimeout(idleRef.current); setControlsShow(false); setNavIn(false); } };
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => { window.removeEventListener("mousemove", onMove); document.removeEventListener("mouseleave", onLeave); };
  }, [armIdle]);

  // while playing, scrolling UP reveals the nav drawer as an overlay; scrolling down hides it
  useEffect(() => {
    const onWheel = (e) => {
      if (!playingRef.current) return;
      if (e.deltaY < 0) setNavIn(true);
      else if (e.deltaY > 0 && !hoverRef.current) { setNavIn(false); setMenuOpen(false); }
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  const toggleFilter = (c) => {
    setFilters((prev) => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; });
  };

  const go = (v) => {
    setMenuOpen(false);
    setView((cur) => (cur === v ? cur : v));
    window.history.pushState({}, "", `/${v}`);
    if (["reel", "projects", "about", "contact", "mattybot"].includes(v)) {
      closeFull();
      // exit the hero video play mode before switching sections (stops video + hides controls/X)
      setPlaying(false); setControlsShow(false);
      if (playerRef.current) playerRef.current.pause().catch(() => {});
    }
  };
  const goHome = () => {
    setView(null); setMenuOpen(false); closeFull(); setPlaying(false); setControlsShow(false);
    window.history.pushState({}, "", "/");
    if (playerRef.current) playerRef.current.pause().catch(() => {});
  };

  // landing hero player — unmute + play happen HERE, inside the user gesture, so audio is allowed
  const enterPlay = () => {
    setPlaying(true); setPaused(false); setMuted(false); setControlsShow(true);
    const p = playerRef.current;
    if (p) {
      p.setMuted(false).catch(() => {});
      p.setVolume(1).catch(() => {});
      p.play().catch(() => {});
    }
    armIdle();
  };
  const togglePP = () => {
    const p = playerRef.current;
    if (p) { paused ? p.play().catch(() => {}) : p.pause().catch(() => {}); }
    setPaused((v) => !v);
    armIdle();
  };
  const toggleMute = () => {
    const nm = !muted;
    setMuted(nm);
    if (playerRef.current) playerRef.current.setMuted(nm).catch(() => {});
    armIdle();
  };
  const seek = (val) => {
    const t = (val / 1000) * (dur || 1);
    setProg(t);
    if (playerRef.current && dur) playerRef.current.setCurrentTime(t).catch(() => {});
    armIdle();
  };
  const toggleFullscreen = async () => {
    const p = playerRef.current;
    try {
      if (p && p.requestFullscreen) {
        const fs = await p.getFullscreen();
        fs ? await p.exitFullscreen() : await p.requestFullscreen();
      }
    } catch (e) {}
    armIdle();
  };

  // full player (reel View Mode)
  const armFullIdle = useCallback(() => {
    setFullShow(true);
    clearTimeout(fullIdleRef.current);
    fullIdleRef.current = setTimeout(() => { if (fullOpenRef.current) setFullShow(false); }, 2600);
  }, []);
  const openFull = (idx) => { setFullIdx(idx % (filtered.length || 1)); setFullMuted(false); setFullPaused(false); setFullShow(true); setFullOpen(true); armFullIdle(); };
  const closeFull = () => { setFullOpen(false); if (fullPlayerRef.current) fullPlayerRef.current.pause().catch(() => {}); };

  // open MattBot; pause whatever video is playing first (hero or reel full-player)
  const openMattbot = () => {
    if (playing && playerRef.current) { playerRef.current.pause().catch(() => {}); setPaused(true); }
    if (fullOpen && fullPlayerRef.current) { fullPlayerRef.current.pause().catch(() => {}); setFullPaused(true); }
    setMattbotOpen(true);
  };
  const step = (d) => { setFullIdx((i) => (i + d + filtered.length) % filtered.length); setFullPaused(false); setFullShow(true); armFullIdle(); };

  // full-mode Vimeo player — created per open/idx; user clicked the tile, so play WITH SOUND
  useEffect(() => {
    if (!fullOpen || !fullFrameRef.current) return;
    const p = new Player(fullFrameRef.current);
    fullPlayerRef.current = p;
    const onTime = (data) => setFullProg(data.seconds);
    const onPlay = () => setFullPaused(false);
    const onPause = () => setFullPaused(true);
    const onError = () => {};
    // playlist: when a reel finishes, advance to the next one and auto-play (with sound)
    const onEnded = () => { setFullPaused(false); setFullShow(true); setFullIdx((i) => (i + 1) % (filtered.length || 1)); armFullIdle(); };
    p.on("timeupdate", onTime); p.on("play", onPlay); p.on("pause", onPause); p.on("error", onError); p.on("ended", onEnded);
    p.ready().then(() => { p.setMuted(false).catch(() => {}); p.setVolume(1).catch(() => {}); p.play().catch(() => {}); return p.getDuration(); }).then((d) => setFullDur(d)).catch(() => {});
    return () => {
      try { p.off("timeupdate", onTime); p.off("play", onPlay); p.off("pause", onPause); p.off("error", onError); p.off("ended", onEnded); p.pause().catch(() => {}); } catch (e) {}
      if (fullPlayerRef.current === p) fullPlayerRef.current = null;
    };
  }, [fullOpen, fullIdx]);

  // full mode: mousemove re-reveals meta+controls; roll-off/idle hides them (like the homepage)
  useEffect(() => {
    const onMove = () => { if (fullOpenRef.current) armFullIdle(); };
    const onLeave = () => { if (fullOpenRef.current) { clearTimeout(fullIdleRef.current); setFullShow(false); } };
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => { window.removeEventListener("mousemove", onMove); document.removeEventListener("mouseleave", onLeave); };
  }, [armFullIdle]);

  const fullTogglePP = () => {
    const p = fullPlayerRef.current;
    if (p) { fullPaused ? p.play().catch(() => {}) : p.pause().catch(() => {}); }
    setFullPaused((v) => !v);
    armFullIdle();
  };
  const fullToggleMute = () => {
    const nm = !fullMuted;
    setFullMuted(nm);
    if (fullPlayerRef.current) fullPlayerRef.current.setMuted(nm).catch(() => {});
    armFullIdle();
  };
  const fullSeek = (val) => {
    const t = (val / 1000) * (fullDur || 1);
    setFullProg(t);
    if (fullPlayerRef.current && fullDur) fullPlayerRef.current.setCurrentTime(t).catch(() => {});
    armFullIdle();
  };
  const fullToggleFullscreen = async () => {
    const el = fullRootRef.current;
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (el?.requestFullscreen) await el.requestFullscreen();
        else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } catch (e) {}
    armFullIdle();
  };

  useEffect(() => {
    const onKey = (e) => {
      if (caseProj && e.key === "Escape") { setCaseProj(null); return; }
      if (!fullOpen) return;
      if (e.key === "Escape") closeFull();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullOpen, caseProj, filtered.length]);

  const cur = fullOpen ? filtered[fullIdx] : null;
  const gridItems = filtered;

  // keep the hero logo hidden + play button in place while the nav is revealed on the landing screen,
  // so moving the cursor up toward the nav doesn't pop the big logo back (avoids two logos on screen).
  // NOT while playing — during playback the hero stays in its "playing" state and controls handle the UI.
  const heroLift = navIn && !view && !playing;

  return (
    <div className={`matty${playing ? " playing" : ""}${heroLift ? " hero-lift" : ""}`} data-testid="matty-app">
      {/* ---------------- NAV ---------------- */}
      <nav
        className={navIn ? "in" : ""}
        onMouseEnter={() => { hoverRef.current = true; setNavIn(true); }}
        onMouseLeave={() => { hoverRef.current = false; }}
        data-testid="main-nav"
      >
        <div className="util-row">
          <div className="socials">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="me noopener noreferrer" aria-label={s.label} data-testid={`social-${s.label.toLowerCase()}`}>
                <svg viewBox="0 0 24 24"><path d={s.path} /></svg>
              </a>
            ))}
          </div>
          <a className={`contact-pill${view === "contact" ? " active" : ""}`} onClick={() => go("contact")} data-testid="nav-contact-pill">Contact</a>
        </div>
        <div className="main-row">
          <img className="nav-logo" src="/matty-logo.png" alt="MATTY" onClick={goHome} data-testid="nav-logo" />
          <div className="nav-right">
            <div className={`nav-links${menuOpen ? " open" : ""}`} data-testid="nav-links">
              <a className={view === "reel" ? "active" : ""} onClick={() => go("reel")} data-testid="nav-reel">Reel</a>
              <a className={view === "projects" ? "active" : ""} onClick={() => go("projects")} data-testid="nav-projects">Projects</a>
              <a onClick={() => go("mattybot")} className={view === "mattybot" ? "active" : ""} data-testid="nav-mattbot">Mattybot</a>
              <a className={view === "about" ? "active" : ""} onClick={() => go("about")} data-testid="nav-about">About</a>
            </div>
          </div>
          <button className={`burger${menuOpen ? " x" : ""}`} onClick={() => setMenuOpen((m) => !m)} aria-label="Menu" data-testid="nav-burger">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* ---------------- LANDING ---------------- */}
      <section className="view" id="landing">
        <div className="bgreel">
          <div className="ph-reel" /><div className="ph-cut" />
          <div className="grain" /><div className="vig" />
        </div>
        {/* full-bleed hero reel video (cover-fit, no distortion) — click to pause/play.
            Direct-embed iframe (React-owned) so playback works without an oEmbed lookup; the Vimeo
            Player attaches to it and we unmute+play inside the click gesture (audio allowed). */}
        <div className={`reel-video${playing ? " on" : ""}`} data-testid="hero-reel-video"
          onClick={() => { if (playing) togglePP(); }}>
          <iframe ref={heroFrameRef} title="MATTY reel"
            src={`https://player.vimeo.com/video/${HERO_REEL}?loop=1&controls=0&title=0&byline=0&portrait=0&muted=1&dnt=1`}
            allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        </div>
        <div className="hero-center">
          <div className="morph"
            onMouseEnter={() => setNavIn(true)}>
            <img className="logo-img" src="/matty-logo.png" alt="MATTY" data-testid="hero-logo" />
            <button className="playbtn" aria-label="Play reel" onClick={enterPlay} data-testid="hero-play-btn"><PlayGlyph /></button>
          </div>
          <div className="eyebrow">AI BY</div>
        </div>
      </section>

      {/* ---------------- CONTROL BAR (hero reel player) ---------------- */}
      <div className={`controls${controlsShow ? " show" : ""}`} data-testid="player-controls">
        <button className={muted ? "muted" : ""} onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} data-testid="ctrl-mute">
          <svg className="icon" viewBox="0 0 24 24">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            {muted ? <path d="M17 9l4 6M21 9l-4 6" /> : <><path d="M15.5 8.5a5 5 0 010 7" /><path d="M18.5 5.5a9 9 0 010 13" /></>}
          </svg>
        </button>
        <button onClick={togglePP} aria-label="Play/pause" data-testid="ctrl-playpause">
          <svg className="icon" viewBox="0 0 24 24">
            {!paused ? <path d="M7 4h4v16H7zM13 4h4v16h-4z" fill="currentColor" stroke="none" /> : <path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none" />}
          </svg>
        </button>
        <span className="time">{fmt(prog)} / {fmt(dur)}</span>
        <input className="scrub" type="range" min="0" max="1000" value={dur ? (prog / dur) * 1000 : 0}
          style={{ "--p": `${dur ? (prog / dur) * 100 : 0}%` }}
          onChange={(e) => seek(Number(e.target.value))} aria-label="Seek" data-testid="ctrl-scrub" />
        <button onClick={toggleFullscreen} aria-label="Fullscreen" data-testid="ctrl-fullscreen">
          <svg className="icon" viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
        </button>
      </div>

      {/* upper-right close X — shows/hides with the same rules as the control bar */}
      {playing && (
        <button className={`reel-close${controlsShow ? " show" : ""}`} onClick={goHome} aria-label="Close video" data-testid="reel-close">
          <svg className="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      )}

      {/* ---------------- REEL ---------------- */}
      <section className={`view${view === "reel" ? " in" : ""}`} id="reel" data-testid="reel-section">
        <div className="subnav">
          {CATS.map((c) => (
            <button key={c} className={`pill${filters.has(c) ? " on" : ""}`} data-cat={c} onClick={() => toggleFilter(c)} data-testid={`filter-${c.replace(/\s+/g, "-").toLowerCase()}`}>{c}</button>
          ))}
        </div>
        <div className="grid" data-testid="reel-grid">
          <AnimatePresence mode="popLayout">
            {gridItems.map((it, i) => (
              <motion.div key={`${it.id}-${i}`} layout
                initial={{ opacity: 0, scale: 0.8, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.55, y: 60, rotate: -6, filter: "blur(4px)" }}
                transition={{ layout: { type: "spring", stiffness: 420, damping: 34 }, duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
                className={`cardwrap${i < 3 ? " span" : ""}`}>
                <div className="card" data-cat={it.cat} tabIndex={0} role="button"
                  aria-label={titleOf(it) || it.cat} onClick={() => openFull(i % filtered.length)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFull(i % filtered.length); } }}
                  data-testid={`reel-card-${it.id}`}>
                  <div className="key" style={{ backgroundImage: thumbOf(it) ? `url("${thumbOf(it)}")` : it.key }} />
                  <div className="tint" /><div className="edge" />
                  <div className="meta"><div className="title">{titleOf(it)}</div></div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* ---------------- MATTYBOT (page view) ---------------- */}
      <section className={`view${view === "mattybot" ? " in" : ""}`} id="mattybot" data-testid="mattybot-section">
        <div className="mb-page">
          {view === "mattybot" && <MattBotStage />}
        </div>
      </section>

      {/* ---------------- ABOUT ---------------- */}
      <section className={`view${view === "about" ? " in" : ""}`} id="about" data-testid="about-section">
        <div className="ab">
          <div className="ab-hero">
            <img className="ab-portrait" src={PORTRAIT} alt="Matty" />
            <p className="lede">MATTY directs commercials, music videos, and narrative work. Mostly with generative AI tools. He believes in the power of story: characters, tension, the comedy in an awkward silence, whatever keeps you glued to the screen.</p>
          </div>
          <p>He loves an unhinged idea and worlds that open up when live action, VFX, and animation collide. He seeks the simple, the clear, the most direct, then makes it beautiful, whimsical, horrifying, startling, and magnificent.</p>
          <div className="ab-rule" />
          <p>No one knows this, but he wrote the scene in <em className="match">Meet the Parents</em> where Robert De Niro's cat flushes the toilet. Bruno Mars once sang a song about him. He built Lenny Kravitz's website when he was 23 years old. His happy place is far off the grid, north of the northernmost tip of Lake Superior, but he always finds his way home to LA.</p>
          <div className="ab-rule" />
          <div className="ab-reps">
            <div className="rep"><div className="n">Since</div><div className="v">1999</div></div>
            <div className="rep"><div className="n">Studio</div><div className="v">Hearts &amp; Minds LA</div></div>
            <div className="rep"><div className="n">Honors</div><div className="v">Cannes Lions · Clio · One Show · W3 · Webby · Effie · FWA · London International Advertising · Hollywood Key Art</div></div>
            <div className="rep"><div className="n">Training</div><div className="v">MFA, ArtCenter Pasadena<br />BFA, SMFA Boston</div></div>
          </div>
          <div className="ab-ctas">
            <a className="ab-cta" onClick={() => go("reel")} data-testid="about-watch-reel">Watch the reel</a>
            <a className="ab-cta" onClick={() => go("contact")} data-testid="about-contact">Contact</a>
          </div>
        </div>
      </section>

      {/* ---------------- PROJECTS (case studies) ---------------- */}
      <section className={`view${view === "projects" ? " in" : ""}`} id="projects" data-testid="projects-section">
        <div className="grid grid-1col" data-testid="projects-grid">
          <div className="card pcard rizz" tabIndex={0} role="button"
            aria-label="RizzClaw case study" onClick={() => setRizzOpen(true)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setRizzOpen(true); } }}
            data-testid="project-card-rizzclaw">
            <div className="badge">Product</div>
            <div className="key" style={{ backgroundImage: `url("https://customer-assets.emergentagent.com/job_vibe-director/artifacts/z5gzlz72_RIZZCLAW_MASCOT.webp")`, backgroundColor: "#0d0a18", backgroundSize: "100% auto", backgroundPosition: "center top", backgroundRepeat: "no-repeat" }} />
            <div className="meta">
              <div className="camp">RIZZCLAW</div>
              <div className="title">Get to know your agent's personality →</div>
            </div>
          </div>

          <div className="card pcard rizz" tabIndex={0} role="button"
            aria-label="Edgehog case study" onClick={() => setBrandCase("edgehog")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setBrandCase("edgehog"); } }}
            data-testid="project-card-edgehog">
            <div className="badge">Product</div>
            <div className="key" style={{ backgroundColor: "#081421", backgroundImage: `url("/edgehog-mark.png"), radial-gradient(120% 120% at 72% 15%, #0E2233, #081421 68%)`, backgroundSize: "auto 62%, auto", backgroundPosition: "center, center", backgroundRepeat: "no-repeat, no-repeat" }} />
            <div className="meta">
              <div className="camp">EDGEHOG</div>
              <div className="title">Automated arbitrage for prediction markets →</div>
            </div>
          </div>

          <div className="card pcard rizz" tabIndex={0} role="button"
            aria-label="Cortex case study" onClick={() => setBrandCase("cortex")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setBrandCase("cortex"); } }}
            data-testid="project-card-cortex">
            <div className="badge">Product</div>
            <div className="key" style={{ backgroundColor: "#FCFCFA", backgroundImage: `radial-gradient(circle at 20% 78%, rgba(0,229,168,.16), transparent 46%), radial-gradient(circle at 72% 25%, rgba(255,143,230,.18), transparent 46%), radial-gradient(circle at 58% 78%, rgba(124,92,255,.14), transparent 52%), url("/cortex-logo.svg")`, backgroundSize: "auto, auto, auto, auto 30%", backgroundPosition: "center, center, center, center", backgroundRepeat: "no-repeat, no-repeat, no-repeat, no-repeat" }} />
            <div className="meta">
              <div className="camp">CORTEX</div>
              <div className="title">The agentic OS for every business →</div>
            </div>
          </div>
          {[
            { id: "hear360-listen", name: "HEAR360", sub: "Listen — Brand Anthem", cat: "COMMERCIAL", video: "hear360" },
            { id: "twix-zombie-claus-williamsburg", name: "TWIX", sub: "Behind the scenes with Zombie Claus", cat: "COMMERCIAL", video: "twix" },
            { id: "wendolls-ridicule", name: "WENDOLLS", sub: "Grannies on a mall run", cat: "MUSIC VIDEO", soon: true },
          ].map((cfg) => {
            const it = ITEMS.find((x) => x.id === cfg.id);
            if (!it) return null;
            const openCase = () => { if (cfg.soon) return; cfg.video ? setVideoCase(cfg.video) : setCaseProj(it); };
            return (
            <div key={cfg.id} className="card pcard" tabIndex={cfg.soon ? -1 : 0} role="button"
              aria-label={`${cfg.name} case study`} onClick={openCase}
              onKeyDown={(e) => { if (!cfg.soon && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openCase(); } }}
              data-testid={`project-card-${cfg.id}`}>
              <div className="badge vid">{cfg.soon ? "Coming soon" : cfg.cat}</div>
              <div className="key" style={{ backgroundImage: thumbOf(it) ? `url("${thumbOf(it)}")` : it.key }} />
              <div className="meta">
                <div className="camp">{cfg.name}</div>
                <div className="title">{cfg.sub}{cfg.soon ? "" : " →"}</div>
              </div>
            </div>
            );
          })}
        </div>
      </section>

      {/* ---------------- CONTACT ---------------- */}
      <section className={`view${view === "contact" ? " in" : ""}`} id="contact" data-testid="contact-section">
        <ContactChat active={view === "contact"} />
      </section>

      {/* ---------------- FULL PLAYER (reel View Mode) ---------------- */}
      <div className={`${fullOpen ? "open" : ""}`} id="full" ref={fullRootRef} data-testid="full-player">
        {/* full-bleed video — click to pause/play */}
        <div className="full-video" onClick={() => { if (fullOpen) fullTogglePP(); }}>
          {cur && fullOpen && (
            <iframe key={fullIdx} ref={fullFrameRef} title={titleOf(cur)}
              src={vimeoSrc(cur, "autoplay=1&controls=0&title=0&byline=0&portrait=0&dnt=1")}
              allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
          )}
        </div>

        <button className={`reel-close${fullShow ? " show" : ""}`} onClick={closeFull} aria-label="Close" data-testid="full-close">
          <svg className="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <button className={`arrow prev${fullShow ? " show" : ""}`} onClick={() => step(-1)} aria-label="Previous" data-testid="full-prev">
          <svg className="icon" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <button className={`arrow next${fullShow ? " show" : ""}`} onClick={() => step(1)} aria-label="Next" data-testid="full-next">
          <svg className="icon" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
        </button>

        {/* bottom-left meta with a smaller View Case Study pill stacked beneath */}
        {cur && (
          <div className={`full-meta${fullShow ? " show" : ""}`} data-cat={cur.cat} data-testid="full-meta">
            <div className="title">{titleOf(cur)}</div>
            <button className="cs-btn-sm" onClick={() => setCaseProj(cur)} data-testid="full-case-study">View Case Study</button>
          </div>
        )}

        {/* same custom control bar as the homepage */}
        <div className={`controls${fullShow ? " show" : ""}`} data-testid="full-controls">
          <button className={fullMuted ? "muted" : ""} onClick={fullToggleMute} aria-label={fullMuted ? "Unmute" : "Mute"} data-testid="full-ctrl-mute">
            <svg className="icon" viewBox="0 0 24 24">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              {fullMuted ? <path d="M17 9l4 6M21 9l-4 6" /> : <><path d="M15.5 8.5a5 5 0 010 7" /><path d="M18.5 5.5a9 9 0 010 13" /></>}
            </svg>
          </button>
          <button onClick={fullTogglePP} aria-label="Play/pause" data-testid="full-ctrl-playpause">
            <svg className="icon" viewBox="0 0 24 24">
              {!fullPaused ? <path d="M7 4h4v16H7zM13 4h4v16h-4z" fill="currentColor" stroke="none" /> : <path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none" />}
            </svg>
          </button>
          <span className="time">{fmt(fullProg)} / {fmt(fullDur)}</span>
          <input className="scrub" type="range" min="0" max="1000" value={fullDur ? (fullProg / fullDur) * 1000 : 0}
            style={{ "--p": `${fullDur ? (fullProg / fullDur) * 100 : 0}%` }}
            onChange={(e) => fullSeek(Number(e.target.value))} aria-label="Seek" data-testid="full-ctrl-scrub" />
          <button onClick={fullToggleFullscreen} aria-label="Fullscreen" data-testid="full-ctrl-fullscreen">
            <svg className="icon" viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          </button>
        </div>
      </div>

      {/* ---------------- CASE STUDY ---------------- */}
      <div className={`${caseProj ? "open" : ""}`} id="case" data-testid="case-overlay">
        {caseProj && (
          <>
            <button className="close" onClick={() => setCaseProj(null)} aria-label="Close" data-testid="case-close">
              <svg className="icon" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            <div className="cs-wrap">
              <div className="cs-cat" data-cat={caseProj.cat}>{caseProj.cat}</div>
              <h1 className="cs-title">{titleOf(caseProj)}</h1>
              <div className="cs-hero">
                <iframe title={`case-${caseProj.id}`}
                  src={vimeoSrc(caseProj, "title=0&byline=0&portrait=0&dnt=1")}
                  allow="fullscreen; picture-in-picture" allowFullScreen />
              </div>
              <div className="cs-block"><div className="cs-label">The Problem</div><p className="cs-body">{caseProj.problem}</p></div>
              <div className="cs-block"><div className="cs-label">The Solution</div><p className="cs-body">{caseProj.solution}</p></div>
            </div>
          </>
        )}
      </div>

      {/* ---------------- MATTBOT (interactive avatar) ---------------- */}
      <MattBot open={mattbotOpen} onOpenChange={setMattbotOpen} onLaunch={openMattbot} raised={playing || fullOpen} hidden={view === "mattybot" || (playing && !controlsShow) || (fullOpen && !fullShow)} />

      {/* ---------------- RIZZCLAW CASE STUDY ---------------- */}
      <RizzClawCase open={rizzOpen} onClose={() => setRizzOpen(false)} />

      {/* ---------------- BRAND CASE STUDIES (Edgehog, Cortex) ---------------- */}
      <BrandCase data={brandCase ? BRAND_CASES[brandCase] : null} onClose={() => setBrandCase(null)} />

      {/* ---------------- VIDEO CASE STUDIES (HEAR360, TWIX) ---------------- */}
      <VideoCase data={videoCase ? VIDEO_CASES[videoCase] : null} onClose={() => setVideoCase(null)} />
    </div>
  );
}

function extractContact(text) {
  const email = (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/) || [])[0] || "";
  // grab candidate phone-like sequences, keep one with 10–15 digits
  let phone = "";
  const candidates = text.match(/\+?[\d][\d\s().-]{8,}\d/g) || [];
  for (const c of candidates) {
    const digits = c.replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 15) { phone = c.trim(); break; }
  }
  return { email, phone };
}

let cid = 0;
const nextId = () => ++cid;

function ContactChat({ active }) {
  const [messages, setMessages] = useState([
    { id: nextId(), from: "matty", text: "Hey — Matty here 👋 What are you making? Commercial, music video, or narrative — and roughly when does it need to exist?" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [done, setDone] = useState(false);
  const [brief, setBrief] = useState("");
  const askedRef = useRef(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, typing]);
  useEffect(() => { if (active && inputRef.current && !done) inputRef.current.focus(); }, [active, done]);

  const pushMatty = (text, delay = 700) => {
    setTyping(true);
    setTimeout(() => { setTyping(false); setMessages((m) => [...m, { id: nextId(), from: "matty", text }]); }, delay);
  };

  const submitInquiry = async (message, email, phone) => {
    try {
      await axios.post(`${API}/contact`, { message, email: email || undefined, phone: phone || undefined });
      pushMatty("Got it — locked in. I'll reach out shortly. Talk soon. 🎬", 800);
      setDone(true);
    } catch (e) {
      pushMatty("Hmm, that didn't send. Mind trying once more?", 600);
    }
  };

  const send = () => {
    const text = input.trim();
    if (!text || typing) return;
    const userMsg = text;
    setMessages((m) => [...m, { id: nextId(), from: "user", text: userMsg }]);
    setInput("");

    const isFirst = !brief;
    if (isFirst) setBrief(userMsg);

    // run the check: did they include an email or a valid phone number?
    const { email, phone } = extractContact(userMsg);

    if (email || phone) {
      const projectMsg = isFirst ? userMsg : brief;
      const transcript = isFirst ? userMsg : `${brief}\n\nContact: ${userMsg}`;
      pushMatty(`Perfect — ${email ? email : phone} it is. One sec…`, 500);
      submitInquiry(transcript || projectMsg, email, phone);
    } else if (isFirst) {
      askedRef.current = true;
      pushMatty("Love it. What's the best way to reach you — drop your email or phone number and I'm set.", 750);
    } else {
      askedRef.current = true;
      pushMatty("I'll just need an email or a valid phone number to get back to you — pop it in here. 📮", 750);
    }
  };

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div className="dm">
      <div className="dm-head">
        <img className="dm-avatar" src="/matty-face.png" alt="Matty" />
        <div>
          <div className="dm-name" data-testid="dm-name">Matty</div>
          <div className="dm-status">Usually replies fast · Direct message</div>
        </div>
      </div>

      <div className="dm-thread" ref={scrollRef} data-testid="contact-chat">
        {messages.map((m) => (
          <div key={m.id} className={`bubble from-${m.from}`} data-testid={`msg-${m.from}`}>
            {m.from === "matty" && <img className="bubble-avatar" src="/matty-face.png" alt="" />}
            <div className="bubble-body">{m.text}</div>
          </div>
        ))}
        {typing && (
          <div className="bubble from-matty" data-testid="dm-typing">
            <img className="bubble-avatar" src="/matty-logo.png" alt="" />
            <div className="bubble-body typing"><span /><span /><span /></div>
          </div>
        )}
      </div>

      <div className="dm-input">
        <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
          placeholder={done ? "Conversation closed" : "Message Matty…"} disabled={done}
          aria-label="Message" data-testid="contact-message" />
        <button className="dm-send" onClick={send} disabled={done || !input.trim() || typing} aria-label="Send" data-testid="contact-submit">
          <svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-3-6-7-2z" fill="currentColor" /></svg>
        </button>
      </div>
    </div>
  );
}
