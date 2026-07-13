// Portfolio content. Real Vimeo IDs wired in; unlisted videos include a privacy hash (h=).
// Titles + thumbnails are fetched live from Vimeo (oEmbed) via the backend /api/reel-meta proxy.
// The `key` gradient is used as a placeholder background until the real thumbnail loads.
export const CATS = ["COMMERCIAL", "MUSIC VIDEO", "NARRATIVE"];

function ph(kind, a, b, c) {
  if (kind === "diag") return `linear-gradient(135deg,${a},${b})`;
  if (kind === "radial") return `radial-gradient(circle at 30% 30%,${a},${b} 70%)`;
  if (kind === "conic") return `conic-gradient(from 210deg at 60% 40%,${a},${b},${c || a})`;
  if (kind === "dawn") return `linear-gradient(0deg,${b},${a})`;
  if (kind === "split") return `linear-gradient(105deg,${a} 45%,${b} 45%)`;
  if (kind === "beam") return `repeating-linear-gradient(60deg,${a} 0 40px,${b} 40px 80px)`;
  if (kind === "spot") return `radial-gradient(120% 80% at 70% 20%,${a},${b} 60%,#050506)`;
  return `linear-gradient(135deg,${a},${b})`;
}

// Build a Vimeo player embed URL (adds the privacy hash for unlisted videos)
export function vimeoSrc(item, params = "") {
  const h = item.vimeoHash ? `&h=${item.vimeoHash}` : "";
  return `https://player.vimeo.com/video/${item.vimeoId}?${params}${h}`;
}

export const ITEMS = [
  { id: "hear360-listen", cat: "COMMERCIAL", vimeoId: "1158204680", vimeoHash: "4d46d86982", key: ph("spot", "#ffd3a3", "#7a2a10"),
    problem: "The brand needed a launch film that felt like sport, not an ad — energy without a single obvious logo beat.",
    solution: "We built the cut around breath and impact: shot at 120fps, graded warm, and let the product live in the motion rather than the frame center." },
  { id: "wendolls-ridicule", cat: "MUSIC VIDEO", vimeoId: "1209197622", key: ph("radial", "#8fd7ff", "#0a1a3a"),
    problem: "A ballad with no clear narrative hook and a budget that ruled out a location shoot.",
    solution: "One room, one performer, and a rotating light rig — the edit turns repetition into a spiral so the third chorus lands like a reveal." },
  { id: "siren-teaser", cat: "NARRATIVE", vimeoId: "1157839937", vimeoHash: "8aec37d0c9", key: ph("conic", "#3a1250", "#12040f", "#5a2a70"),
    problem: "The studio wanted proof a coastal thriller could feel expensive on a short-film budget.",
    solution: "We leaned into fog, sound design, and negative space — implying scale rather than buying it." },
  { id: "nescafe-pour-away", cat: "COMMERCIAL", vimeoId: "1209195414", key: ph("beam", "#2a1408", "#ff8a3d"),
    problem: "Every spot in the category looks the same. This one needed to own its own mood.",
    solution: "Practical light, tactile texture, and a single continuous move — the product is never explained, only felt." },
  { id: "brooks-martin-do", cat: "MUSIC VIDEO", vimeoId: "1209196388", key: ph("dawn", "#3ea6ff", "#08122a"),
    problem: "A high-energy track that needed to translate without a stadium.",
    solution: "Strobe, handheld, and a warehouse — cut on the transients so the room feels like it's about to combust." },
  { id: "siren-dialogue-test", cat: "NARRATIVE", vimeoId: "1208958604", key: ph("diag", "#1a2b4a", "#04070f"),
    problem: "A quiet character moment at risk of feeling static.",
    solution: "We let the performance carry the tempo and kept the camera patient — the turn arrives in a single held look." },
  { id: "clue-teaser", cat: "COMMERCIAL", vimeoId: "1157453060", vimeoHash: "cf4f0a6a77", key: ph("split", "#ffb066", "#241206"),
    problem: "A teaser that needed intrigue without giving the game away.",
    solution: "Withhold the wide. We stayed in fragments and let the sound design imply the scale of what's coming." },
  { id: "karin-rybar-tarde-o-temprano", cat: "MUSIC VIDEO", vimeoId: "1209196186", key: ph("spot", "#bfe3ff", "#0b1e3f"),
    problem: "A visualizer that had to hold attention without a big production.",
    solution: "Generative texture tied to the low end — it breathes with the track so no two moments read the same." },
  { id: "karin-rybar-atraccion", cat: "MUSIC VIDEO", vimeoId: "1209197814", key: ph("radial", "#ff9ad2", "#180820"),
    problem: "An intimate track that needed motion without a big production.",
    solution: "Long lenses, haze, and one slow push — the color does the choreography." },
  { id: "brooks-martin-maybe", cat: "MUSIC VIDEO", vimeoId: "1209196440", key: ph("dawn", "#4be3ff", "#06121f"),
    problem: "An anthem that had to feel drenched and electric.",
    solution: "Wet streets, practical light, and cuts locked to the beat grid." },
  { id: "hip-hop-chicks", cat: "NARRATIVE", vimeoId: "1158213828", vimeoHash: "2e098eebef", key: ph("radial", "#6a3aa0", "#0c0518"),
    problem: "A piece that had to sell a world in under a minute.",
    solution: "Withhold the wide. We stayed in fragments and let the energy imply the scale of what's coming." },
  { id: "twix-zombie-claus-williamsburg", cat: "COMMERCIAL", vimeoId: "1208953553", key: ph("conic", "#ff8a3d", "#2a1000", "#ffd3a3"),
    problem: "Short runtime, one product, zero dialogue.",
    solution: "A single hero gesture, backlit — the whole spot is one perfect beat." },
  { id: "twix-zombie-claus-hallowmas", cat: "COMMERCIAL", vimeoId: "1208953468", key: ph("dawn", "#ffd3a3", "#1a1206"),
    problem: "A companion spot that had to feel familiar but fresh.",
    solution: "We stayed with light and texture and let the tone carry the joke — a feeling, not a checklist." },
];

export const SOCIALS = [
  { label: "X", href: "https://x.com/Matty_dpi", path: "M18.9 2H22l-7.3 8.3L23 22h-6.8l-5-6.7L5.5 22H2.4l7.8-9L1 2h6.9l4.5 6.1L18.9 2zm-2.4 18h1.9L7.6 4H5.6l10.9 16z" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/matthewpollock/", path: "M6.94 5a2 2 0 11-4 0 2 2 0 014 0zM3.2 8.5h3.5V21H3.2V8.5zm5.5 0h3.35v1.7h.05c.47-.9 1.6-1.85 3.3-1.85 3.5 0 4.15 2.3 4.15 5.3V21h-3.5v-5.4c0-1.3 0-2.95-1.8-2.95s-2.05 1.4-2.05 2.85V21H8.7V8.5z" },
  { label: "Vimeo", href: "https://vimeo.com/heartsminds", path: "M22 7.4c-.1 2.1-1.6 5-4.4 8.6-2.9 3.8-5.4 5.7-7.4 5.7-1.2 0-2.3-1.2-3.1-3.5-.6-2.1-1.1-4.2-1.7-6.3-.6-2.3-1.3-3.5-2-3.5-.2 0-.7.3-1.6.9L1 8.1c1-.9 2-1.8 3-2.7 1.3-1.2 2.3-1.8 3-1.9 1.6-.2 2.5.9 2.9 3.3.4 2.6.7 4.2.8 4.8.5 2.1 1 3.1 1.5 3.1.4 0 1.1-.7 2-2 .9-1.3 1.3-2.3 1.4-3 .1-1.2-.4-1.8-1.4-1.8-.5 0-1 .1-1.5.3 1-3.2 2.8-4.7 5.5-4.6 2 .05 2.9 1.4 2.8 3.5z" },
  { label: "GitHub", href: "https://github.com/matty-dpi", path: "M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-1.8c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2a11.4 11.4 0 016 0C17.7 5 18.7 5.3 18.7 5.3c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.6.8.5A11.5 11.5 0 0023.5 12C23.5 5.7 18.3.5 12 .5z" },
];
