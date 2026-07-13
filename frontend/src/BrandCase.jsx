import { useEffect, useState } from "react";
import "@/BrandCase.css";

export const BRAND_CASES = {
  edgehog: {
    key: "edgehog",
    eyebrow: "Case Study",
    name: "Edgehog",
    tagline: "Automated arbitrage for prediction markets.",
    sub: "Livin' on the hedge.",
    logo: "/edgehog-mark.png",
    accent: "#2FE6A6",
    bg: "#081421",
    card: "#0E2233",
    text: "#E9F1F8",
    dim: "#8497AB",
    heroGrad: "radial-gradient(120% 120% at 72% 15%, #0E2233, #081421 68%)",
    paras: [
      "Edgehog is a real-money arbitrage terminal, not a casual betting app — a professional cockpit for hedged execution across CFTC-regulated U.S. prediction markets (Kalshi and Polymarket US).",
      "It continuously scans thousands of markets, matches genuinely equivalent events, and prices the real executable edge at size using VWAP depth — never a deceptive top-of-book quote. Every candidate is confirmed by \u201cBackstreet,\u201d a deterministic rulebook plus LLM verification that rejects phantom arbs and different-event look-alikes.",
      "Confirmed clean hedges surface as qualified opportunities; structurally imperfect pairs become risk-priced \u201cGap Plays.\u201d Run a Play-money simulator or an armed real-money mode with two-venue arm gating, exposure caps, passive leg-in execution, and a reconciled ledger behind every fill.",
    ],
    stats: [
      { n: "Two-leg", l: "hedged execution" },
      { n: "VWAP", l: "true edge at size" },
      { n: "Kalshi + Polymarket", l: "US venues" },
    ],
    link: "https://gap-risk-ev.preview.emergentagent.com",
    linkLabel: "Visit Edgehog \u2192",
    memberOnly: true,
    memberNote: "Edgehog is a private member only service.",
    gallery: [
      "https://customer-assets.emergentagent.com/job_vibe-director/artifacts/1jqnz45l_Screenshot%202026-07-13%20at%204.36.02%E2%80%AFAM.webp",
      "https://customer-assets.emergentagent.com/job_vibe-director/artifacts/hzyzsfl9_Screenshot%202026-07-13%20at%204.36.55%E2%80%AFAM.webp",
    ],
  },
  cortex: {
    key: "cortex",
    eyebrow: "Case Study",
    name: "Cortex",
    tagline: "The agentic OS for every business.",
    sub: "Coordinating intelligence into coherent, accountable, autonomous businesses.",
    logo: "/cortex-logo.svg",
    accent: "#7C5CFF",
    bg: "#FCFCFA",
    card: "#FFFFFF",
    text: "#111216",
    dim: "#747983",
    light: true,
    heroGrad: "radial-gradient(circle at 20% 78%, rgba(0,229,168,.18), transparent 46%), radial-gradient(circle at 72% 25%, rgba(255,143,230,.20), transparent 46%), radial-gradient(circle at 58% 78%, rgba(124,92,255,.16), transparent 52%), radial-gradient(circle at 85% 80%, rgba(255,217,107,.16), transparent 48%), #FCFCFA",
    paras: [
      "Cortex coordinates intelligence into coherent, accountable, autonomous businesses. It\u2019s a calm operating environment with live intelligence underneath — predominantly white and light, where color identifies meaning, ownership, urgency, and motion rather than decorating every surface.",
      "The system organizes a company into six operating elements — Vision, People, Data, Issues, Process, and Traction — so strategy, seats, business truth, obstacles, repeatable work, and execution all live in one attributable place.",
      "Every action is attributable, every result improves the system, and capabilities are described so they make sense to both human and machine operators. Intelligent, not performative. Confident, not inflated. Agent-first, not human-exclusive.",
    ],
    elements: ["Vision", "People", "Data", "Issues", "Process", "Traction"],
    link: "https://rbac-foundation-core.preview.emergentagent.com/docs/brand-guide.html",
    linkLabel: "Explore Cortex \u2192",
  },
};

export function BrandCase({ data, onClose }) {
  const [showTip, setShowTip] = useState(false);
  useEffect(() => { setShowTip(false); }, [data]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && data) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, onClose]);

  useEffect(() => {
    if (!showTip) return;
    const t = setTimeout(() => setShowTip(false), 3200);
    return () => clearTimeout(t);
  }, [showTip]);

  if (!data) return null;

  const style = {
    "--bc-accent": data.accent,
    "--bc-bg": data.bg,
    "--bc-card": data.card,
    "--bc-text": data.text,
    "--bc-dim": data.dim,
  };

  return (
    <div className={`bc-overlay${data.light ? " light" : ""}`} style={style} data-testid={`brandcase-${data.key}`} role="dialog" aria-modal="true">
      <button className="bc-close" onClick={onClose} aria-label="Close" data-testid="brandcase-close">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      <div className="bc-scroll">
        <div className="bc-inner">
          <div className="bc-hero" style={{ background: data.loop ? undefined : data.heroGrad }}>
            {data.loop && <div className="bc-hero-loop" style={{ background: data.loop }} />}
            {data.logo
              ? <img className="bc-hero-logo" src={data.logo} alt={`${data.name} logo`} />
              : <div className="bc-hero-word" style={{ backgroundImage: data.loop }}>{data.name}</div>}
          </div>

          <div className="bc-head">
            <div className="bc-eyebrow">{data.eyebrow}</div>
            <h1 className="bc-title">{data.name}</h1>
            <p className="bc-tag">{data.tagline}</p>
            <p className="bc-sub">{data.sub}</p>
          </div>

          {data.stats && (
            <div className="bc-stats">
              {data.stats.map((s, i) => (
                <div className="bc-stat" key={i}>
                  <div className="bc-stat-n">{s.n}</div>
                  <div className="bc-stat-l">{s.l}</div>
                </div>
              ))}
            </div>
          )}

          {data.paras.map((p, i) => <p className="bc-para" key={i}>{p}</p>)}

          {data.gallery && (
            <div className="bc-gallery" data-testid="brandcase-gallery">
              {data.gallery.map((src, i) => (
                <img className="bc-shot" key={i} src={src} alt={`${data.name} interface ${i + 1}`} loading="lazy" />
              ))}
            </div>
          )}

          {data.elements && (
            <div className="bc-elements">
              {data.elements.map((e, i) => (
                <span className="bc-el" key={i}><span className="bc-el-n">{String(i + 1).padStart(2, "0")}</span>{e}</span>
              ))}
            </div>
          )}

          <div className="bc-cta-row">
            {data.memberOnly ? (
              <div className="bc-cta-wrap">
                <button
                  type="button"
                  className="bc-cta locked"
                  onClick={() => setShowTip(true)}
                  aria-disabled="true"
                  data-testid="brandcase-link"
                >
                  <svg className="bc-lock" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10V8a6 6 0 1112 0v2M5 10h14v10H5z" /></svg>
                  {data.linkLabel}
                </button>
                {showTip && (
                  <span className="bc-tip" role="status" data-testid="brandcase-tooltip">
                    {data.memberNote}
                  </span>
                )}
              </div>
            ) : (
              <a className="bc-cta" href={data.link} target="_blank" rel="noopener noreferrer" data-testid="brandcase-link">
                {data.linkLabel}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
