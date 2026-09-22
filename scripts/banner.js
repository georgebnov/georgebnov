// Generates assets/header.svg: an animated (SMIL, no JS) profile banner.
// Deterministic: same SEED -> same SVG. Run: node scripts/banner.js
const fs = require("fs");
const path = require("path");

const W = 1000, H = 280, SEED = 7;

let s = SEED;
const rand = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
const r = (a, b) => a + rand() * (b - a);
const f = (n) => n.toFixed(1);

// cheap smooth 2D noise for the flow field
const noise = (x, y) =>
  Math.sin(x * 0.011 + Math.cos(y * 0.017) * 1.7) +
  Math.cos(y * 0.013 - Math.sin(x * 0.007) * 2.1) * 0.8;

const PAINT = "M-10 42 C130 36 250 50 390 41 C530 33 650 47 790 39 C890 33 950 45 1010 39 L1010 236 C900 244 780 229 640 240 C500 250 360 231 220 242 C120 248 40 233 -10 239 Z";
const SUN = { x: 800, y: 104 };
const TOWER = 786;
const HORIZON = 206;

// ── flow-field streaks ("flow state") in the sky
function streaks() {
  const out = [];
  for (let i = 0; i < 120; i++) {
    let x = r(-20, W), y = r(40, 190);
    const pts = [];
    for (let k = 0; k < 22 && y < HORIZON - 8; k++) {
      pts.push(`${f(x)} ${f(y)}`);
      const a = noise(x, y) * 1.2 - 0.25;
      x += Math.cos(a) * 6;
      y += Math.sin(a) * 3.2;
    }
    if (pts.length < 6) continue;
    const warm = rand() < 0.14;
    const hue = warm ? r(22, 38) : r(172, 214);
    const sw = r(0.6, 1.4), op = warm ? r(0.35, 0.6) : r(0.18, 0.45);
    out.push(
      `<path d="M${pts.join(" L")}" fill="none" stroke="hsl(${f(hue)} ${warm ? 90 : 60}% ${warm ? 62 : 55}%)" stroke-width="${f(sw)}" stroke-linecap="round" opacity="${op.toFixed(2)}" stroke-dasharray="14 120"><animate attributeName="stroke-dashoffset" from="0" to="-134" dur="${f(r(5, 12))}s" repeatCount="indefinite"/></path>`
    );
  }
  return out.join("\n    ");
}

// ── sun with rotating rays (a nod to the Kazakh sky + sun)
function sun() {
  const rays = [];
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const r1 = 24, r2 = i % 2 ? 36 : 44;
    rays.push(`M${f(SUN.x + Math.cos(a) * r1)} ${f(SUN.y + Math.sin(a) * r1)} L${f(SUN.x + Math.cos(a) * r2)} ${f(SUN.y + Math.sin(a) * r2)}`);
  }
  return `<circle cx="${SUN.x}" cy="${SUN.y}" r="80" fill="url(#sunG)"><animate attributeName="r" values="80;90;80" dur="9s" repeatCount="indefinite"/></circle>
    <g stroke="#f4c75a" stroke-width="1.6" stroke-linecap="round" opacity=".75"><path d="${rays.join(" ")}"/><animateTransform attributeName="transform" type="rotate" from="0 ${SUN.x} ${SUN.y}" to="360 ${SUN.x} ${SUN.y}" dur="90s" repeatCount="indefinite"/></g>
    <circle cx="${SUN.x}" cy="${SUN.y}" r="20" fill="#ffe7a3"/>
    <circle cx="${SUN.x}" cy="${SUN.y}" r="15" fill="#fff8e6"/>`;
}

// ── Toronto skyline: blocks + CN Tower, with a few twinkling windows
function skyline() {
  const blocks = [], windows = [];
  let x = 520;
  while (x < W + 10) {
    const w = r(12, 30);
    const near = Math.abs(x - TOWER) < 110;
    const h = r(14, near ? 62 : 38) * Math.min(1, (x - 500) / 160);
    blocks.push(`M${f(x)} ${HORIZON} V${f(HORIZON - h)} H${f(x + w)} V${HORIZON}`);
    for (let wy = HORIZON - h + 5; wy < HORIZON - 3; wy += 5)
      for (let wx = x + 3; wx < x + w - 3; wx += 5)
        if (rand() < 0.11) {
          const tw = rand() < 0.3
            ? `<animate attributeName="opacity" values="1;.15;1" dur="${f(r(3, 9))}s" begin="-${f(r(0, 9))}s" repeatCount="indefinite"/>`
            : "";
          windows.push(`<rect x="${f(wx)}" y="${f(wy)}" width="1.8" height="1.8" fill="#ffd98a" opacity=".85">${tw}</rect>`);
        }
    x += w + r(0, 3);
  }
  const t = TOWER;
  const tower = `M${t - 7} ${HORIZON} L${t - 2.6} 100 L${t + 2.6} 100 L${t + 7} ${HORIZON} Z
    M${t - 9} 104 h18 v-7 h-18 Z M${t - 11} 97 q11 -9 22 0 Z M${t - 1.6} 88 h3.2 v-10 h-3.2 Z M${t - 3} 78 h6 v-4 h-6 Z M${t - 0.7} 74 V36 h1.4 V74 Z`;
  return `<path d="${blocks.join(" ")} Z" fill="#060a14"/>
    <path d="${tower}" fill="#060a14"/>
    <circle cx="${t}" cy="36" r="1.8" fill="#ff4b3e"><animate attributeName="opacity" values="1;1;0;0" dur="1.6s" calcMode="discrete" repeatCount="indefinite"/></circle>
    ${windows.join("\n    ")}`;
}

// ── Lake Ontario: shimmer lines + sun/tower reflection
function lake() {
  const lines = [];
  for (let y = HORIZON + 5; y < 238; y += 4.5) {
    const x0 = r(-10, 400), len = r(80, 600);
    lines.push(`<path d="M${f(x0)} ${f(y)} h${f(len)}" stroke="#8fc3d9" stroke-width=".8" opacity="${r(0.08, 0.22).toFixed(2)}"><animate attributeName="opacity" values=".08;.35;.08" dur="${f(r(4, 9))}s" begin="-${f(r(0, 9))}s" repeatCount="indefinite"/></path>`);
  }
  const refl = [];
  for (let y = HORIZON + 4; y < 236; y += 3.2) {
    const w = r(10, 34) * (1 - (y - HORIZON) / 50);
    refl.push(`<path d="M${f(SUN.x - w)} ${f(y)} h${f(w * 2)}" stroke="#ffd98a" stroke-width="1.1" opacity="${r(0.2, 0.5).toFixed(2)}"><animateTransform attributeName="transform" type="translate" values="0 0;${f(r(-4, 4))} 0;0 0" dur="${f(r(3, 6))}s" repeatCount="indefinite"/></path>`);
  }
  return `<rect x="-10" y="${HORIZON}" width="1020" height="40" fill="#08111e"/>
    ${lines.join("\n    ")}
    ${refl.join("\n    ")}`;
}

const MONO = "ui-monospace,'SF Mono',Menlo,Consolas,monospace";
const SANS = "'Inter','Helvetica Neue','Segoe UI',Arial,sans-serif";
const SERIF = "'Bodoni 72','Didot','Playfair Display',Georgia,serif";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="George: building to understand, to the bone">
  <title>George — Toronto, flow state</title>
  <defs>
    <clipPath id="paint"><path d="${PAINT}"/></clipPath>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#050914"/><stop offset="70%" stop-color="#0d1c30"/><stop offset="100%" stop-color="#1a2b3c"/></linearGradient>
    <radialGradient id="sunG"><stop offset="0%" stop-color="#fff4d0"/>
      <stop offset="30%" stop-color="#ffcf6e" stop-opacity=".5"/><stop offset="100%" stop-color="#ff9f43" stop-opacity="0"/></radialGradient>
    <pattern id="weave" width="4" height="4" patternUnits="userSpaceOnUse">
      <path d="M0 .5H4M0 2.5H4" stroke="#000" opacity=".09"/><path d="M.5 0V4M2.5 0V4" stroke="#fff" opacity=".045"/></pattern>
    <pattern id="rawWeave" width="4" height="4" patternUnits="userSpaceOnUse">
      <path d="M0 .5H4M0 2.5H4" stroke="#5f6a70" opacity=".3"/><path d="M.5 0V4M2.5 0V4" stroke="#eef0ea" opacity=".35"/></pattern>
    <filter id="brush" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="${SEED}" result="t"/>
      <feDisplacementMap in="SourceGraphic" in2="t" scale="4.5" xChannelSelector="R" yChannelSelector="G"/></filter>
  </defs>

  <!-- raw canvas -->
  <rect width="${W}" height="${H}" fill="#b9bdb4"/>
  <rect width="${W}" height="${H}" fill="url(#rawWeave)"/>

  <!-- painted scene, brush-distorted, clipped to a hand-drawn edge -->
  <g filter="url(#brush)">
    <g clip-path="url(#paint)">
    <path d="${PAINT}" fill="url(#sky)"/>
    ${sun()}
    ${streaks()}
    ${skyline()}
    ${lake()}
    <rect x="-20" y="20" width="1040" height="240" fill="url(#weave)"/>
    </g>
  </g>

  <!-- clean type layer -->
  <rect x="36" y="98" width="508" height="222" fill="none" stroke="#F2A800" stroke-width="5"/>
  <rect x="52" y="64" width="186" height="60" fill="#D90012"/>
  <text x="145" y="108" font-family="${SANS}" font-size="38" font-weight="900" fill="#fff" text-anchor="middle" letter-spacing="3">GEORGE</text>
  <g font-family="${MONO}">
    <text x="56" y="154" font-size="12.5" fill="#f3dca8" letter-spacing="3">BUILDING TO UNDERSTAND, TO THE BONE</text>
    <text x="56" y="178" font-size="12.5" fill="#e2e6e8">$ agents · guardrails · flow · fingerstyle</text>
    <rect x="56" y="188" width="9" height="2.5" fill="#f3dca8">
      <animate attributeName="opacity" values="1;1;0;0" dur="1.05s" calcMode="discrete" repeatCount="indefinite"/></rect>
  </g>
  <text x="956" y="26" font-family="${MONO}" font-size="11.5" font-weight="700" fill="#b3261e" text-anchor="end" letter-spacing="2.6">GUARDRAILS: ON</text>
  <text x="956" y="268" font-family="${SERIF}" font-size="13" fill="#3a4044" text-anchor="end" letter-spacing="1">Toronto · 43.65°N</text>
</svg>
`;

const out = path.join(__dirname, "..", "assets", "header.svg");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, svg);
console.log(`wrote ${out} (${(svg.length / 1024).toFixed(1)} KB)`);
