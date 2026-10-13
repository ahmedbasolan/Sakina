// App Store creative assets (iOS 27): the product page header and the search
// results asset. Specs, from Apple's "Creative assets specifications" page
// (read 2026-10-13):
//   header          21:9  3840 x 1646  .png/.jpg   no alpha channel
//   search results  3:2   1920x1280 – 3840x2560    no alpha channel
// Apple's guidance: one clear idea per header; the search asset should make the
// app's purpose obvious and show the real experience; keep the focal point in
// the centre, because both are cropped differently across devices and
// orientations. No prices, URLs, awards — and no "inaccurate and misleading
// quotations of religious texts", so neither asset carries any Quran text, and
// the phones on the search asset show screens with no verse on them (a phone
// that bleeds off the canvas would otherwise cut an ayah mid-sentence).
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { renderDevice } = require('../_device');
const SCREENS = require('../_screens');
const { iconLantern, RING_TOP, ASPECT } = require('../../scripts/lib/iconLantern');

const OUT = path.join(__dirname, 'creative');
const CAPTURES = path.join(__dirname, 'real-screenshots');

const GOLD = '#D4AF37';
const CREAM = '#F5EDE3';

// Deterministic, so a re-run reproduces the same sky.
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const background = (w, h) => `
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#07111E"/>
      <stop offset="0.55" stop-color="#0C1A2E"/>
      <stop offset="1" stop-color="#0F1F30"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bgGrad)"/>`;

// Small dots plus a few four-point sparkles, the icon's sky. `keepOut` is a list
// of ellipses the field stays clear of, so nothing twinkles through the lantern
// or the headline.
function starField(w, h, { count, sparkles, seed, scale = 1, keepOut = [] }) {
  const r = rng(seed);
  const clear = (x, y) => keepOut.every((k) => ((x - k.cx) / k.rx) ** 2 + ((y - k.cy) / k.ry) ** 2 > 1);
  let out = '';
  for (let i = 0, placed = 0; placed < count && i < count * 20; i++) {
    const x = r() * w, y = r() * h;
    if (!clear(x, y)) continue;
    // Brightness follows size, as it does in a real sky: most dots are faint
    // pinpricks, a few are bright, and only the brightest carry a halo. Random
    // opacity at random size gave large dim olive blobs.
    const m = r() ** 3; // magnitude: heavily skewed toward faint
    const rad = (1.2 + m * 3.8) * scale;
    const fill = r() < 0.65 ? '#E8C259' : CREAM;
    if (m > 0.55) out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rad * 3.2).toFixed(2)}" fill="url(#dotHalo)"/>`;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(2)}" fill="${fill}" fill-opacity="${(0.3 + m * 0.7).toFixed(2)}"/>`;
    placed++;
  }
  // Sparkles are glints, not stickers: a white-hot core, slim gold arms that
  // brighten toward the centre, a warm halo and faint long rays. They used to
  // be flat #F4D88A shapes at 55–90% opacity, which read as clip-art; now every
  // one is fully lit and the variety comes from size — most small, a few large.
  const glints = [];
  for (let i = 0, placed = 0; placed < sparkles && i < sparkles * 50; i++) {
    const x = r() * w, y = r() * h;
    if (!clear(x, y)) continue;
    // Keep glints apart: two that land together read as a rendering glitch.
    if (glints.some(([gx, gy]) => Math.hypot(gx - x, gy - y) < 320 * scale)) continue;
    glints.push([x, y]);
    const s = (r() < 0.25 ? 26 + r() * 14 : 12 + r() * 12) * scale;
    const t = s * 0.11;
    const ray = s * (2.2 + r() * 0.8);
    out += `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
      <circle r="${(s * 2.4).toFixed(1)}" fill="url(#sparkHalo)"/>
      <rect x="${-ray}" y="${-s * 0.035}" width="${ray * 2}" height="${s * 0.07}" fill="url(#sparkRayH)"/>
      <rect x="${-s * 0.035}" y="${-ray}" width="${s * 0.07}" height="${ray * 2}" fill="url(#sparkRayV)"/>
      <path d="M0,${-s} Q${t},${-t} ${s},0 Q${t},${t} 0,${s} Q${-t},${t} ${-s},0 Q${-t},${-t} 0,${-s} Z" fill="url(#sparkArm)"/>
      <circle r="${(s * 0.16).toFixed(1)}" fill="#FFFDF4"/>
    </g>`;
    placed++;
  }
  return `<defs>
    <radialGradient id="dotHalo"><stop offset="0" stop-color="#FFE9A6" stop-opacity="0.35"/><stop offset="1" stop-color="#FFE9A6" stop-opacity="0"/></radialGradient>
    <radialGradient id="sparkHalo"><stop offset="0" stop-color="#FFE9A6" stop-opacity="0.5"/><stop offset="0.25" stop-color="${GOLD}" stop-opacity="0.18"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>
    <radialGradient id="sparkArm"><stop offset="0" stop-color="#FFFDF4"/><stop offset="0.35" stop-color="#FFF0BF"/><stop offset="1" stop-color="#E8C259"/></radialGradient>
    <linearGradient id="sparkRayH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF0BF" stop-opacity="0"/><stop offset="0.5" stop-color="#FFF0BF" stop-opacity="0.85"/><stop offset="1" stop-color="#FFF0BF" stop-opacity="0"/></linearGradient>
    <linearGradient id="sparkRayV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF0BF" stop-opacity="0"/><stop offset="0.5" stop-color="#FFF0BF" stop-opacity="0.85"/><stop offset="1" stop-color="#FFF0BF" stop-opacity="0"/></linearGradient>
  </defs>${out}`;
}

// The screenshot set's mandala, drawn at any centre and diameter.
function mandala(cx, cy, diameter, opacity) {
  const k = diameter / 100;
  return `<g transform="translate(${cx - 50 * k},${cy - 50 * k}) scale(${k})" opacity="${opacity}" fill="none" stroke="${GOLD}" stroke-linejoin="round" stroke-linecap="round"><circle cx="50" cy="50" r="48" stroke-width="0.5" opacity="0.6"/><path d="M 50.00,2.00 L 98.00,50.00 M 74.00,8.43 L 91.57,74.00 M 91.57,26.00 L 74.00,91.57 M 98.00,50.00 L 50.00,98.00 M 91.57,74.00 L 26.00,91.57 M 74.00,91.57 L 8.43,74.00 M 50.00,98.00 L 2.00,50.00 M 26.00,91.57 L 8.43,26.00 M 8.43,74.00 L 26.00,8.43 M 2.00,50.00 L 50.00,2.00 M 8.43,26.00 L 74.00,8.43 M 26.00,8.43 L 91.57,26.00" stroke-width="0.27" opacity="0.1"/><path d="M 50.00,2.00 L 91.57,74.00 M 74.00,8.43 L 74.00,91.57 M 91.57,26.00 L 50.00,98.00 M 98.00,50.00 L 26.00,91.57 M 91.57,74.00 L 8.43,74.00 M 74.00,91.57 L 2.00,50.00 M 50.00,98.00 L 8.43,26.00 M 26.00,91.57 L 26.00,8.43 M 8.43,74.00 L 50.00,2.00 M 2.00,50.00 L 74.00,8.43 M 8.43,26.00 L 91.57,26.00 M 26.00,8.43 L 98.00,50.00" stroke-width="0.27" opacity="0.1"/><path d="M 50.00,2.00 L 74.00,91.57 M 74.00,8.43 L 50.00,98.00 M 91.57,26.00 L 26.00,91.57 M 98.00,50.00 L 8.43,74.00 M 91.57,74.00 L 2.00,50.00 M 74.00,91.57 L 8.43,26.00 M 50.00,98.00 L 26.00,8.43 M 26.00,91.57 L 50.00,2.00 M 8.43,74.00 L 74.00,8.43 M 2.00,50.00 L 91.57,26.00 M 8.43,26.00 L 98.00,50.00 M 26.00,8.43 L 91.57,74.00" stroke-width="0.27" opacity="0.15"/><circle cx="50" cy="50" r="24" stroke-width="0.24" opacity="0.3"/><circle cx="50" cy="50" r="8.64" stroke-width="0.5" opacity="0.6"/></g>`;
}

// The app icon's own lantern (see ../_icon-lantern.js), placed with its
// centre line at `cx` and top edge at `top`, `height` px tall. Returns the
// sharp composite layer plus the SVG for what sits behind it: a warm halo on
// the windows and, optionally, a chain from `chainTo` down to the ring.
async function lanternLayer(cx, top, height, { chainTo = null } = {}) {
  const png = await iconLantern();
  const width = Math.round(height * ASPECT);
  const input = await sharp(png).resize(width, Math.round(height)).png().toBuffer();
  const k = height / 1124;
  const glowCy = top + 650 * k; // centre of the window band
  const under = `
  <defs>
    <radialGradient id="halo${Math.round(cx)}">
      <stop offset="0" stop-color="#FFE9A6" stop-opacity="0.30"/><stop offset="0.3" stop-color="#E8B53C" stop-opacity="0.1"/>
      <stop offset="0.65" stop-color="#E8B53C" stop-opacity="0.025"/><stop offset="1" stop-color="#E8B53C" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="${cx}" cy="${glowCy}" rx="${880 * k}" ry="${880 * k}" fill="url(#halo${Math.round(cx)})"/>${chainTo === null ? '' : `
  <line x1="${cx}" y1="${chainTo}" x2="${cx}" y2="${top + RING_TOP * height + 2}" stroke="${GOLD}" stroke-opacity="0.7" stroke-width="${Math.max(3, 9 * k)}"/>`}`;
  return { under, glowCy, layer: { input, left: Math.round(cx - width / 2), top: Math.round(top) } };
}

// A low gold haze along the bottom edge: the lantern's light reaching the ground.
const groundGlow = (w, h, cy, rx, ry, opacity) => `
  <defs><radialGradient id="ground"><stop offset="0" stop-color="${GOLD}" stop-opacity="${opacity}"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient></defs>
  <ellipse cx="${w / 2}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#ground)"/>`;

// ---------------------------------------------------------------- header 21:9
// One idea: the lantern under a starlit sky. Centred and text-free — the
// product page already prints the icon and name over/under the header, and
// any wordmark here would collide with it on some device.
async function header() {
  const W = 3840, H = 1646;
  // The icon cut-out at its native 1124 px: no upscaling.
  const LH = 1124, top = (H - LH) / 2 + 40;
  const L = await lanternLayer(W / 2, top, LH, { chainTo: -10 });
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    ${background(W, H)}
    ${groundGlow(W, H, H + 120, 1500, 420, 0.16)}
    ${mandala(W / 2, L.glowCy, 1560, 0.2)}
    ${starField(W, H, { count: 420, sparkles: 16, seed: 27, scale: 1.35, keepOut: [{ cx: W / 2, cy: H / 2, rx: 700, ry: 820 }] })}
    ${L.under}
  </svg>`;
  const bg = await sharp(Buffer.from(svg)).png().toBuffer();
  return sharp(bg).composite([L.layer]).flatten({ background: '#07111E' }).removeAlpha().png();
}

// ------------------------------------------------------------ search 3:2
// "State the obvious": what Sakina is, in the words people search with
// ("quran verse"), above the three screens that show it working.
const SEARCH_PHONES = [
  { id: '06-grow-journeys', cx: 840, y: 1020, scale: 0.86 },
  { id: '03-build-habit', cx: 3000, y: 1020, scale: 0.86 },
  { id: '01-find-verse', cx: 1920, y: 860, scale: 0.98 }, // last = drawn on top
];

async function search() {
  const W = 3840, H = 2560;
  const L = await lanternLayer(W / 2, 60, 270);
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    ${background(W, H)}
    ${mandala(W / 2, 400, 980, 0.16)}
    ${starField(W, 800, { count: 160, sparkles: 8, seed: 11, scale: 1.3, keepOut: [{ cx: W / 2, cy: 430, rx: 1500, ry: 330 }] })}
    ${L.under}
    <text x="${W / 2}" y="540" text-anchor="middle" font-family="Georgia, serif" font-size="196" font-weight="bold" letter-spacing="4" fill="${CREAM}">A QURAN VERSE</text>
    <text x="${W / 2}" y="700" text-anchor="middle" font-family="Georgia, serif" font-size="104" letter-spacing="6" fill="${CREAM}" fill-opacity="0.85">FOR HOW YOU FEEL</text>
  </svg>`;
  const bg = await sharp(Buffer.from(svg)).png().toBuffer();

  const byId = Object.fromEntries(SCREENS.map((s) => [s.id, s]));
  const layers = [L.layer];
  for (const p of SEARCH_PHONES) {
    const job = byId[p.id];
    const src = path.join(CAPTURES, job.src);
    if (!fs.existsSync(src)) throw new Error(`missing capture: ${job.src}`);
    layers.push({
      input: await renderDevice({ canvasW: W, canvasH: H, cx: p.cx, y: p.y, scale: p.scale, screen: { src, crop: job.crop } }),
    });
  }
  return sharp(bg).composite(layers).flatten({ background: '#07111E' }).removeAlpha().png();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const jobs = [
    ['header-21x9-3840x1646.png', header, 3840, 1646],
    ['search-3x2-3840x2560.png', search, 3840, 2560],
  ];
  for (const [name, build, w, h] of jobs) {
    const file = path.join(OUT, name);
    await (await build()).toFile(file);
    // Apple rejects an alpha channel and any size off spec; check, don't assume.
    const m = await sharp(file).metadata();
    if (m.width !== w || m.height !== h) throw new Error(`${name}: ${m.width}x${m.height}, want ${w}x${h}`);
    if (m.hasAlpha || m.channels !== 3) throw new Error(`${name}: has alpha (channels=${m.channels})`);
    console.log('wrote', name, `${m.width}x${m.height}`, `${Math.round(fs.statSync(file).size / 1024)} KB`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
