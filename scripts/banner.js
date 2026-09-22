// Generates assets/header.svg: an animated (SMIL, no JS) profile banner.
// A guitar neck that doubles as a data pipeline: strings get strummed, packets
// ride them, and a guardrail at the 9th fret blocks the dangerous ones.
// Deterministic: same SEED -> same SVG. Run: node scripts/banner.js
const fs = require("fs");
const path = require("path");

const W = 1000, H = 280, SEED = 21;

let s = SEED;
const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
const r = (a, b) => a + rand() * (b - a);
const f = (n) => n.toFixed(1);

const NUT = 300, END = W + 10, SCALE = 1200;
const fretX = (n) => NUT + SCALE * (1 - 2 ** (-n / 12));
const GATE = fretX(9);
const STRINGS = [72, 100, 128, 156, 184, 212];
const midY = (STRINGS[0] + STRINGS[5]) / 2;
const STRUM = 7; // seconds between strums

const MONO = "ui-monospace,'SF Mono',Menlo,Consolas,monospace";
const SANS = "'Inter','Helvetica Neue','Segoe UI',Arial,sans-serif";

function grain() {
  const out = [];
  for (let i = 0; i < 26; i++) {
    let y = r(30, 250);
    const pts = [];
    for (let x = NUT; x <= END; x += 40) pts.push(`${x} ${f((y += r(-1.5, 1.5)))}`);
    out.push(`M${pts.join(" L")}`);
  }
  return `<path d="${out.join(" ")}" stroke="#d9a877" stroke-width=".6" fill="none" opacity=".07"/>`;
}

function frets() {
  const bars = [], dots = [];
  for (let n = 1; fretX(n) < W; n++) {
    const x = fretX(n);
    bars.push(`<rect x="${f(x - 1.5)}" y="52" width="3" height="180" fill="url(#brass)"/>`);
    const mid = (fretX(n - 1) + x) / 2;
    if ([3, 5, 7, 9, 15].includes(n)) dots.push(`<circle cx="${f(mid)}" cy="${midY}" r="6" fill="url(#pearl)"/>`);
    if (n === 12)
      dots.push(`<circle cx="${f(mid)}" cy="${midY - 28}" r="6" fill="url(#pearl)"/><circle cx="${f(mid)}" cy="${midY + 28}" r="6" fill="url(#pearl)"/>`);
  }
  return [...dots, ...bars].join("\n  ");
}

// strum: each string plucked a beat after the previous, decaying wobble
function strings() {
  const cx = (NUT + END) / 2;
  return STRINGS.map((y, i) => {
    const a = 3.2 - i * 0.25;
    const d = (k) => `M${NUT} ${y} Q${cx} ${f(y + k * a)} ${END} ${y}`;
    const vals = [0, 1, -0.8, 0.6, -0.45, 0.3, -0.15, 0, 0].map(d).join(";");
    const kt = "0;.02;.04;.06;.08;.10;.12;.14;1";
    const sw = 0.9 + i * 0.35;
    return `<path d="${d(0)}" stroke="url(#steel)" stroke-width="${f(sw)}" fill="none"><animate attributeName="d" values="${vals}" keyTimes="${kt}" dur="${STRUM}s" begin="${(i * 0.06).toFixed(2)}s" repeatCount="indefinite"/></path>`;
  }).join("\n  ");
}

// packets: cyan until the guardrail; safe ones turn green, blocked ones burst
function packets() {
  const out = [];
  const split = ((GATE - NUT) / (END - NUT)).toFixed(3);
  for (let i = 0; i < 16; i++) {
    const y = STRINGS[Math.floor(rand() * 6)];
    const dur = f(r(4, 8)), begin = f(-r(0, 8));
    const common = `dur="${dur}s" begin="${begin}s" repeatCount="indefinite"`;
    if (rand() < 0.3) {
      out.push(`<g>
    <circle cy="${y}" r="3.2" fill="#ff4d4d"><animate attributeName="cx" values="${NUT};${f(GATE - 4)};${f(GATE - 4)}" keyTimes="0;${split};1" ${common}/><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;${split};${(+split + 0.03).toFixed(3)};1" ${common}/></circle>
    <circle cx="${f(GATE)}" cy="${y}" fill="none" stroke="#ff4d4d" stroke-width="1.4"><animate attributeName="r" values="0;0;14;14" keyTimes="0;${split};${(+split + 0.08).toFixed(3)};1" ${common}/><animate attributeName="opacity" values="0;.9;0;0" keyTimes="0;${split};${(+split + 0.08).toFixed(3)};1" ${common}/></circle>
  </g>`);
    } else {
      out.push(`<circle cy="${y}" r="2.6" fill="#5ee7ff" filter="url(#glow)"><animate attributeName="cx" from="${NUT}" to="${END}" ${common}/><animate attributeName="fill" values="#5ee7ff;#7dff9b" keyTimes="0;${split}" calcMode="discrete" ${common}/></circle>`);
    }
  }
  return out.join("\n  ");
}

// the guardrail + rotating log of what it just blocked
function gate() {
  const blocked = ["rm -rf ~", "git push --force main", "DROP TABLE users;", "cat ~/.ssh/id_rsa"];
  const n = blocked.length, slot = 2.5;
  const logs = blocked.map((cmd, i) => {
    const kt = `0;${(i / n).toFixed(3)};${((i + 1) / n).toFixed(3)};1`;
    const vals = i === 0 ? "1;1;0;0" : "0;1;0;0";
    return `<text x="${f(GATE + 10)}" y="249" opacity="${i === 0 ? 1 : 0}">blocked: ${cmd.replace(/&/g, "&amp;")}<animate attributeName="opacity" values="${vals}" keyTimes="${kt}" calcMode="discrete" dur="${n * slot}s" repeatCount="indefinite"/></text>`;
  });
  return `<rect x="${f(GATE - 2)}" y="50" width="4" height="184" fill="#ff4d4d" opacity=".85" filter="url(#glow)"><animate attributeName="opacity" values=".55;.95;.55" dur="2.4s" repeatCount="indefinite"/></rect>
  <text x="${f(GATE)}" y="40" font-family="${MONO}" font-size="10" fill="#ff7a6b" text-anchor="middle" letter-spacing="3">GUARDRAIL</text>
  <g font-family="${MONO}" font-size="10.5" fill="#ff9c8f">
  ${logs.join("\n  ")}
  </g>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="George: a guitar neck that doubles as a data pipeline, with a guardrail blocking dangerous commands">
  <title>George — fingerstyle, agents, guardrails</title>
  <defs>
    <clipPath id="card"><rect width="${W}" height="${H}" rx="16"/></clipPath>
    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1f140d"/><stop offset="50%" stop-color="#2a1b11"/><stop offset="100%" stop-color="#1a110b"/></linearGradient>
    <linearGradient id="head" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0c0a09"/><stop offset="100%" stop-color="#15110e"/></linearGradient>
    <linearGradient id="brass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#8a6a3a"/><stop offset="50%" stop-color="#e9cf95"/><stop offset="100%" stop-color="#7a5c30"/></linearGradient>
    <linearGradient id="steel" gradientUnits="userSpaceOnUse" x1="${NUT}" y1="0" x2="${W}" y2="0">
      <stop offset="0%" stop-color="#f4f1ea"/><stop offset="60%" stop-color="#b9b6ae"/><stop offset="100%" stop-color="#8d8a84"/></linearGradient>
    <linearGradient id="bone" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#cfc6b0"/><stop offset="50%" stop-color="#f3ecdb"/><stop offset="100%" stop-color="#bfb59d"/></linearGradient>
    <radialGradient id="pearl" cx="35%" cy="35%">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="45%" stop-color="#dfe9ee"/><stop offset="80%" stop-color="#e7d9f0"/><stop offset="100%" stop-color="#a9b8c2"/></radialGradient>
    <filter id="glow" x="-200%" y="-200%" width="500%" height="500%">
      <feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>

  <g clip-path="url(#card)">
  <!-- headstock: the name lives here -->
  <rect width="${W}" height="${H}" fill="url(#head)"/>
  <text x="44" y="118" font-family="${SANS}" font-size="64" font-weight="800" fill="#f3ecdb" letter-spacing="-2">george</text>
  <text x="46" y="148" font-family="${MONO}" font-size="11.5" fill="#c9b99a">builds things to understand them</text>
  <g font-family="${MONO}" font-size="11" fill="#8f836f">
    <text x="46" y="196">fingerstyle · agents</text>
    <text x="46" y="214">guardrails · flow</text>
    <text x="46" y="246" fill="#6b6255">toronto · 43.65°N</text>
  </g>

  <!-- fretboard -->
  <rect x="${NUT}" y="50" width="${W - NUT}" height="184" fill="url(#wood)"/>
  ${grain()}
  ${frets()}
  <rect x="${NUT - 8}" y="46" width="10" height="192" rx="2" fill="url(#bone)"/>
  ${strings()}
  ${gate()}
  ${packets()}
  </g>
</svg>
`;

const out = path.join(__dirname, "..", "assets", "header.svg");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, svg);
console.log(`wrote ${out} (${(svg.length / 1024).toFixed(1)} KB)`);
