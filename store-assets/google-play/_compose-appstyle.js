const sharp = require('sharp');
const path = require('path');

// Play Store phone screenshot canvas
const CANVAS_W = 1080;
const CANVAS_H = 1920;

// region of the source App Store iPhone-canvas PNG holding the fully-rendered
// phone mockup (bezel + dynamic island + status bar + real content)
const SRC_DEVICE_X = 130, SRC_DEVICE_Y = 700, SRC_DEVICE_W = 1030;
const SRC_DEVICE_H = 2796 - SRC_DEVICE_Y; // 2096

const SCALE = 0.8;
const DEV_W = Math.round(SRC_DEVICE_W * SCALE);
const DEV_H = Math.round(SRC_DEVICE_H * SCALE);
const DEVICE_X = Math.round((CANVAS_W - DEV_W) / 2);
const DEVICE_Y = 300;

const CX = CANVAS_W / 2;

const bgDefs = `
  <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#07111E"/>
    <stop offset="0.55" stop-color="#0C1A2E"/>
    <stop offset="1" stop-color="#0F1F30"/>
  </linearGradient>`;

function mandala() {
  const tx = CX - 240, ty = 60;
  return `<g transform="translate(${tx},${ty}) scale(4.8)" opacity="0.16" fill="none" stroke="#D4AF37" stroke-linejoin="round" stroke-linecap="round"><circle cx="50" cy="50" r="48" stroke-width="0.5" opacity="0.6"/><path d="M 50.00,2.00 L 98.00,50.00 M 74.00,8.43 L 91.57,74.00 M 91.57,26.00 L 74.00,91.57 M 98.00,50.00 L 50.00,98.00 M 91.57,74.00 L 26.00,91.57 M 74.00,91.57 L 8.43,74.00 M 50.00,98.00 L 2.00,50.00 M 26.00,91.57 L 8.43,26.00 M 8.43,74.00 L 26.00,8.43 M 2.00,50.00 L 50.00,2.00 M 8.43,26.00 L 74.00,8.43 M 26.00,8.43 L 91.57,26.00" stroke-width="0.27" opacity="0.1"/><path d="M 50.00,2.00 L 91.57,74.00 M 74.00,8.43 L 74.00,91.57 M 91.57,26.00 L 50.00,98.00 M 98.00,50.00 L 26.00,91.57 M 91.57,74.00 L 8.43,74.00 M 74.00,91.57 L 2.00,50.00 M 50.00,98.00 L 8.43,26.00 M 26.00,91.57 L 26.00,8.43 M 8.43,74.00 L 50.00,2.00 M 2.00,50.00 L 74.00,8.43 M 8.43,26.00 L 91.57,26.00 M 26.00,8.43 L 98.00,50.00" stroke-width="0.27" opacity="0.1"/><path d="M 50.00,2.00 L 74.00,91.57 M 74.00,8.43 L 50.00,98.00 M 91.57,26.00 L 26.00,91.57 M 98.00,50.00 L 8.43,74.00 M 91.57,74.00 L 2.00,50.00 M 74.00,91.57 L 8.43,26.00 M 50.00,98.00 L 26.00,8.43 M 26.00,91.57 L 50.00,2.00 M 8.43,74.00 L 74.00,8.43 M 2.00,50.00 L 91.57,26.00 M 8.43,26.00 L 98.00,50.00 M 26.00,8.43 L 91.57,74.00" stroke-width="0.27" opacity="0.15"/><circle cx="50" cy="50" r="24" stroke-width="0.24" opacity="0.3"/><circle cx="50" cy="50" r="8.64" stroke-width="0.5" opacity="0.6"/></g>`;
}

function stars() {
  const pts = [
    [110, 60, 3.5, 0.8], [960, 90, 3, 0.6], [190, 150, 3, 0.7],
    [900, 45, 2.5, 0.55], [540, 35, 2.5, 0.6], [55, 230, 2.5, 0.5], [1010, 240, 3, 0.6],
  ];
  return `<g fill="#D4AF37">${pts.map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill-opacity="${o}"/>`).join('')}</g>`;
}

function headline(verb, desc) {
  return `
  <text x="${CX}" y="140" text-anchor="middle" font-family="Georgia, serif" font-size="104" font-weight="bold" letter-spacing="1" fill="#F5EDE3">${verb}</text>
  <text x="${CX}" y="205" text-anchor="middle" font-family="Georgia, serif" font-size="35" letter-spacing="0.5" fill="#F5EDE3" fill-opacity="0.85">${desc}</text>`;
}

async function buildBackground(verb, desc) {
  const svg = `<svg width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
    <defs>${bgDefs}</defs>
    <rect x="0" y="0" width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#bgGrad)"/>
    ${mandala()}
    ${stars()}
    ${headline(verb, desc)}
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function buildDeviceLayer(srcPngPath) {
  const cropped = await sharp(srcPngPath)
    .extract({ left: SRC_DEVICE_X, top: SRC_DEVICE_Y, width: SRC_DEVICE_W, height: SRC_DEVICE_H })
    .resize(DEV_W, DEV_H)
    .png()
    .toBuffer();

  const layer = sharp({ create: { width: CANVAS_W, height: CANVAS_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
  return layer.composite([{ input: cropped, left: DEVICE_X, top: DEVICE_Y }]).png().toBuffer();
}

const JOBS = [
  { out: '01-hook-mood-grid.png', verb: 'FIND', desc: 'A VERSE FOR HOW YOU FEEL', src: '../app-store/01-find-verse.png' },
  { out: '02-relief-verse-match.png', verb: 'EASE', desc: 'OVERWHELM, ONE VERSE AT A TIME', src: '../app-store/02-ease-overwhelm.png' },
  { out: '03-growth-streak-journeys.png', verb: 'BUILD', desc: 'A DAILY HABIT THAT STICKS', src: '../app-store/03-build-habit.png' },
  { out: '04-trust-private-journal.png', verb: 'KEEP', desc: 'YOUR REFLECTIONS COMPLETELY PRIVATE', src: '../app-store/04-keep-private.png' },
  { out: '05-brand-welcome.png', verb: 'BEGIN', desc: 'YOUR JOURNEY TO SAKINA', src: '../app-store/05-begin-journey.png' },
  { out: '06-read-quran.png', verb: 'READ', desc: 'THE COMPLETE QURAN, BEAUTIFULLY', src: '../app-store/07-read-quran.png' },
  { out: '07-grow-journeys.png', verb: 'GROW', desc: 'THROUGH GUIDED SPIRITUAL JOURNEYS', src: '../app-store/06-grow-journeys.png' },
  { out: '08-save-verses.png', verb: 'SAVE', desc: 'EVERY VERSE THAT SPEAKS TO YOU', src: '../app-store/08-save-verses.png' },
];

(async () => {
  const base = __dirname;
  for (const job of JOBS) {
    const [bg, device] = await Promise.all([
      buildBackground(job.verb, job.desc),
      buildDeviceLayer(path.join(base, job.src)),
    ]);
    await sharp(bg).composite([{ input: device }]).png().toFile(path.join(base, job.out));
    console.log('wrote', job.out);
  }
})().catch((e) => { console.error(e); process.exit(1); });
