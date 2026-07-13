import { useEffect, useRef, useState } from "react";
import { AvatarCall } from "@runwayml/avatars-react";
import "@runwayml/avatars-react/styles.css";
import "@/MattBot.css";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const CHARACTER_ID = "cb17cc4c-9725-4df7-94d5-780e4912c6aa";
const MAX_SECONDS = 300; // 5 min cap

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// Shared avatar experience (gate -> live call). Rendered in both the modal and the page view.
export function MattBotStage({ onEnd }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [err, setErr] = useState("");
  const [remaining, setRemaining] = useState(MAX_SECONDS);
  const timerRef = useRef(null);

  const startCall = async () => {
    setErr("");
    setConnecting(true);
    try {
      // check the per-IP session quota first, so we can show a clear "come back later" message
      try {
        const q = await fetch(`${API}/avatar/quota`).then((r) => r.json());
        if (q && q.allowed === false) {
          setErr(q.message || "You've reached your MattyBot session limit. Please try again a bit later.");
          setConnecting(false);
          return;
        }
      } catch (_) { /* quota check is best-effort; continue */ }

      let s;
      try {
        s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch {
        // camera optional — fall back to mic only so the call still works
        s = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      s.getTracks().forEach((t) => t.stop()); // release probe stream; AvatarCall opens its own
      setConnected(true);
    } catch (e) {
      setErr("Microphone access is required to talk with Mattybot.");
    } finally {
      setConnecting(false);
    }
  };

  // countdown + hard auto-end at the cap
  useEffect(() => {
    if (!connected) return;
    setRemaining(MAX_SECONDS);
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) { clearInterval(timerRef.current); setConnected(false); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [connected]);

  const endCall = () => {
    setConnected(false); setErr(""); setRemaining(MAX_SECONDS);
    if (onEnd) onEnd();
  };

  return (
    <div className="mb-stage">
      {!connected ? (
        <div className="mb-gate" data-testid="mattbot-gate">
          <div className="mb-gate-avatar">
            <img src="/mattbot-face.png" className="mb-gate-face" alt="Mattybot" />
            <span className="mb-cta-pulse mb-gate-pulse" />
          </div>
          <div className="mb-eyebrow">AI BY MATTY</div>
          <h2 className="mb-title">MATTYBOT</h2>
          <p className="mb-sub">Ask about the work, the process — anything. What are you looking to do? Live conversation, just talk.</p>
          <button className="mb-connect" onClick={startCall} disabled={connecting} data-testid="mattbot-connect">
            <span className="mb-cta-label">{connecting ? "Connecting…" : "Tap to talk to me"}</span>
          </button>
          <div className="mb-hint">Requires microphone · camera optional · up to 5 minutes</div>
          {err && <div className="mb-err" data-testid="mattbot-error">{err}</div>}
        </div>
      ) : (
        <div className="mb-call" data-testid="mattbot-call">
          <div className="mb-timer" data-testid="mattbot-timer">{fmt(remaining)}</div>
          <div className="mb-video">
            <AvatarCall
              avatarId={CHARACTER_ID}
              connectUrl={`${API}/avatar/connect`}
              audio
              video
              onError={(e) => setErr((e && e.message) || "Connection error")}
            />
          </div>
          <button className="mb-end" onClick={endCall} data-testid="mattbot-end">End conversation</button>
          {err && <div className="mb-err" data-testid="mattbot-error">{err}</div>}
        </div>
      )}
    </div>
  );
}

// Floating launcher + modal overlay (unchanged behavior: opens the same content in a modal)
export function MattBot({ open, onOpenChange, onLaunch, raised = false, hidden = false }) {
  const close = () => onOpenChange(false);
  const [revealed, setRevealed] = useState(false);

  // reveal the floating launcher after a short delay on site (any entry point)
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 7000);
    return () => clearTimeout(t);
  }, []);

  // Esc closes the overlay
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && open) close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      {!open && revealed && !hidden && (
        <button className={`mb-cta mb-cta-reveal${raised ? " mb-cta-raised" : ""}`}
          onClick={() => (onLaunch ? onLaunch() : onOpenChange(true))}
          data-testid="mattbot-cta" aria-label="Talk to Mattybot">
          <span className="mb-cta-avatar">
            <img src="/mattbot-face.png" alt="" className="mb-cta-face" />
            <span className="mb-cta-pulse" />
          </span>
          <span className="mb-cta-label">Tap to talk to me</span>
        </button>
      )}

      {open && (
        <div className="mb-overlay" data-testid="mattbot-overlay" role="dialog" aria-modal="true">
          <button className="mb-close" onClick={close} aria-label="Close" data-testid="mattbot-close">
            <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <MattBotStage onEnd={close} />
        </div>
      )}
    </>
  );
}
