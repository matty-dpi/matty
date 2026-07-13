import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import Player from "@vimeo/player";
import "@/VideoCase.css";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export const VIDEO_CASES = {
  hear360: {
    key: "hear360",
    name: "HEAR360",
    pill: "Commercial",
    sub: "Crafting an AI brand anthem",
    accent: "#f09073",
    videos: [
      { label: "Case Study", id: "1162444865" },
      { label: "Alternate Game Scene", id: "1209507401" },
    ],
  },
  twix: {
    key: "twix",
    name: "TWIX",
    pill: "Commercial",
    sub: "Behind the scenes with Zombie Claus",
    accent: "#ff8a3d",
    videos: [
      { label: "Case Study", id: "1198588449" },
      { label: "Out Takes", id: "1179761621" },
      { label: "Screen Tests", id: "1208955026" },
      { label: "Zombie Claus Answers DMs", id: "1208953292" },
    ],
  },
};

export function VideoCase({ data, onClose }) {
  const [active, setActive] = useState(0);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [prog, setProg] = useState(0);
  const [dur, setDur] = useState(0);
  const [show, setShow] = useState(true);
  const [posters, setPosters] = useState({});

  const frameRef = useRef(null);
  const stageRef = useRef(null);
  const playerRef = useRef(null);
  const idleRef = useRef(null);

  const armIdle = useCallback(() => {
    setShow(true);
    clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => setShow(false), 2600);
  }, []);

  // fetch poster thumbnails (server-side oEmbed proxy avoids CORS)
  useEffect(() => {
    if (!data) return;
    axios
      .post(`${API}/reel-meta`, data.videos.map((v) => ({ vimeoId: v.id, vimeoHash: null })))
      .then((r) => setPosters(r.data || {}))
      .catch(() => {});
  }, [data]);

  // reset when a new case study opens
  useEffect(() => {
    setActive(0);
    setStarted(false);
    setPaused(false);
    setMuted(false);
    setProg(0);
    setDur(0);
    setShow(true);
  }, [data]);

  // reset to poster when switching clips
  useEffect(() => {
    setStarted(false);
    setPaused(false);
    setProg(0);
    setDur(0);
  }, [active]);

  // close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && data) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, onClose]);

  // Vimeo player — created per clip; native UI hidden, our brand controls drive it
  useEffect(() => {
    if (!data || !frameRef.current) return;
    const p = new Player(frameRef.current);
    playerRef.current = p;
    const onTime = (d) => setProg(d.seconds);
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    p.on("timeupdate", onTime);
    p.on("play", onPlay);
    p.on("pause", onPause);
    p.ready().then(() => p.getDuration()).then((d) => setDur(d)).catch(() => {});
    return () => {
      try {
        p.off("timeupdate", onTime); p.off("play", onPlay); p.off("pause", onPause);
        p.pause().catch(() => {});
      } catch (e) {}
      if (playerRef.current === p) playerRef.current = null;
    };
  }, [data, active]);

  const start = () => {
    setStarted(true);
    const p = playerRef.current;
    if (p) { p.setMuted(false).catch(() => {}); p.setVolume(1).catch(() => {}); p.play().catch(() => {}); }
    armIdle();
  };
  const togglePP = () => {
    if (!started) { start(); return; }
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
    const el = stageRef.current;
    try {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (el?.requestFullscreen) await el.requestFullscreen();
        else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen();
      } else if (document.exitFullscreen) { await document.exitFullscreen(); }
      else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
    } catch (e) {}
    armIdle();
  };

  if (!data) return null;
  const cur = data.videos[active];
  const poster = posters[cur.id] && posters[cur.id].thumbnail;

  return (
    <div className="vc-overlay" style={{ "--vc-accent": data.accent }} data-testid={`videocase-${data.key}`} role="dialog" aria-modal="true">
      <button className="vc-close" onClick={onClose} aria-label="Close" data-testid="videocase-close">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      <div className="vc-stage" ref={stageRef} onMouseMove={() => started && armIdle()}>
        <div className={`vc-frame${started ? " playing" : ""}${show ? " show-ctrl" : ""}`}>
          <iframe
            ref={frameRef}
            key={cur.id}
            title={`${data.name} — ${cur.label}`}
            src={`https://player.vimeo.com/video/${cur.id}?controls=0&title=0&byline=0&portrait=0&dnt=1&autoplay=0`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            data-testid="videocase-player"
          />

          {!started && (
            <button className="vc-poster" onClick={start} aria-label={`Play ${cur.label}`} data-testid="videocase-play">
              {poster && <img className="vc-poster-img" src={poster} alt="" />}
              <span className="vc-poster-scrim" />
              <span className="vc-playbtn"><svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z" /></svg></span>
            </button>
          )}

          <div className="vc-controls" data-testid="videocase-controls">
            <button className={muted ? "muted" : ""} onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"} data-testid="vc-ctrl-mute">
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                {muted ? <path d="M17 9l4 6M21 9l-4 6" /> : <><path d="M15.5 8.5a5 5 0 010 7" /><path d="M18.5 5.5a9 9 0 010 13" /></>}
              </svg>
            </button>
            <button onClick={togglePP} aria-label="Play/pause" data-testid="vc-ctrl-playpause">
              <svg className="icon" viewBox="0 0 24 24">
                {!paused ? <path d="M7 4h4v16H7zM13 4h4v16h-4z" fill="currentColor" stroke="none" /> : <path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none" />}
              </svg>
            </button>
            <span className="vc-time">{fmt(prog)} / {fmt(dur)}</span>
            <input className="vc-scrub" type="range" min="0" max="1000" value={dur ? (prog / dur) * 1000 : 0}
              style={{ "--p": `${dur ? (prog / dur) * 100 : 0}%` }}
              onChange={(e) => seek(Number(e.target.value))} aria-label="Seek" data-testid="vc-ctrl-scrub" />
            <button onClick={toggleFullscreen} aria-label="Fullscreen" data-testid="vc-ctrl-fullscreen">
              <svg className="icon" viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="vc-footer">
        <div className="vc-footer-copy">
          <span className="vc-pill">{data.pill}</span>
          <h1 className="vc-title">{data.name}</h1>
          <p className="vc-sub">{data.sub}</p>
        </div>
        {data.videos.length > 1 && (
          <div className="vc-clips" data-testid="videocase-clips">
            {data.videos.map((v, i) => (
              <button
                key={v.id}
                className={`vc-clip${i === active ? " on" : ""}`}
                onClick={() => setActive(i)}
                data-testid={`videocase-clip-${i}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
