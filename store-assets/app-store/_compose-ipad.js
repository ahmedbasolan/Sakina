const sharp = require('sharp');
const path = require('path');

// iPad 13" Display — one of Apple's accepted pairs for this upload slot
const CANVAS_W = 2064;
const CANVAS_H = 2752;

// region of the source iPhone-canvas PNG that contains the fully-rendered
// phone mockup (bezel + status bar + real content), already verified correct
const SRC_DEVICE_X = 130, SRC_DEVICE_Y = 700, SRC_DEVICE_W = 1030;
const SRC_DEVICE_H = 2796 - SRC_DEVICE_Y; // 2096, everything below the device top within the iPhone canvas

const DEVICE_X = Math.round((CANVAS_W - SRC_DEVICE_W) / 2);
const DEVICE_Y = 580;

const bgDefs = `
  <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#07111E"/>
    <stop offset="0.55" stop-color="#0C1A2E"/>
    <stop offset="1" stop-color="#0F1F30"/>
  </linearGradient>`;

const CX = CANVAS_W / 2;

function mandala() {
  // halo centered behind the headline block (matches iPhone template's approach)
  const tx = CX - 240, ty = 100;
  return `<g transform="translate(${tx},${ty}) scale(4.8)" opacity="0.16" fill="none" stroke="#D4AF37" stroke-linejoin="round" stroke-linecap="round"><circle cx="50" cy="50" r="48" stroke-width="0.5" opacity="0.6"/><path d="M 50.00,2.00 L 98.00,50.00 M 74.00,8.43 L 91.57,74.00 M 91.57,26.00 L 74.00,91.57 M 98.00,50.00 L 50.00,98.00 M 91.57,74.00 L 26.00,91.57 M 74.00,91.57 L 8.43,74.00 M 50.00,98.00 L 2.00,50.00 M 26.00,91.57 L 8.43,26.00 M 8.43,74.00 L 26.00,8.43 M 2.00,50.00 L 50.00,2.00 M 8.43,26.00 L 74.00,8.43 M 26.00,8.43 L 91.57,26.00" stroke-width="0.27" opacity="0.1"/><path d="M 50.00,2.00 L 91.57,74.00 M 74.00,8.43 L 74.00,91.57 M 91.57,26.00 L 50.00,98.00 M 98.00,50.00 L 26.00,91.57 M 91.57,74.00 L 8.43,74.00 M 74.00,91.57 L 2.00,50.00 M 50.00,98.00 L 8.43,26.00 M 26.00,91.57 L 26.00,8.43 M 8.43,74.00 L 50.00,2.00 M 2.00,50.00 L 74.00,8.43 M 8.43,26.00 L 91.57,26.00 M 26.00,8.43 L 98.00,50.00" stroke-width="0.27" opacity="0.1"/><path d="M 50.00,2.00 L 74.00,91.57 M 74.00,8.43 L 50.00,98.00 M 91.57,26.00 L 26.00,91.57 M 98.00,50.00 L 8.43,74.00 M 91.57,74.00 L 2.00,50.00 M 74.00,91.57 L 8.43,26.00 M 50.00,98.00 L 26.00,8.43 M 26.00,91.57 L 50.00,2.00 M 8.43,74.00 L 74.00,8.43 M 2.00,50.00 L 91.57,26.00 M 8.43,26.00 L 98.00,50.00 M 26.00,8.43 L 91.57,74.00" stroke-width="0.27" opacity="0.15"/><circle cx="50" cy="50" r="24" stroke-width="0.24" opacity="0.3"/><circle cx="50" cy="50" r="8.64" stroke-width="0.5" opacity="0.6"/></g>`;
}

function stars() {
  const pts = [
    [CX - 900, 90, 4, 0.8], [CX + 900, 130, 3, 0.6], [CX - 800, 210, 3.5, 0.7],
    [CX + 800, 60, 3, 0.55], [CX - 60, 50, 3, 0.6], [CX - 960, 330, 3, 0.5],
    [CX + 970, 340, 3.5, 0.6], [CX + 630, 220, 2.5, 0.5], [CX - 630, 440, 2.5, 0.45],
  ];
  return `<g fill="#D4AF37">${pts.map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill-opacity="${o}"/>`).join('')}</g>`;
}

function headline(verb, desc) {
  return `
  <text x="${CX}" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="152" font-weight="bold" letter-spacing="2" fill="#F5EDE3">${verb}</text>
  <text x="${CX}" y="392" text-anchor="middle" font-family="Georgia, serif" font-size="54" letter-spacing="1" fill="#F5EDE3" fill-opacity="0.85">${desc}</text>`;
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
    .png()
    .toBuffer();

  // soft drop shadow for the floating-mockup look
  const shadowSvg = `<svg width="${SRC_DEVICE_W + 120}" height="${SRC_DEVICE_H + 60}">
    <defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="30"/></filter></defs>
    <rect x="60" y="30" width="${SRC_DEVICE_W}" height="${SRC_DEVICE_H - 200}" rx="72" fill="#000000" opacity="0.45" filter="url(#b)"/>
  </svg>`;
  const shadow = await sharp(Buffer.from(shadowSvg)).png().toBuffer();

  const layer = sharp({ create: { width: CANVAS_W, height: CANVAS_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
  return layer.composite([
    { input: shadow, left: DEVICE_X - 60, top: DEVICE_Y - 10 },
    { input: cropped, left: DEVICE_X, top: DEVICE_Y },
  ]).png().toBuffer();
}

const JOBS = [
  { out: '01-find-verse.png', verb: 'FIND', desc: 'A VERSE FOR HOW YOU FEEL' },
  { out: '02-ease-overwhelm.png', verb: 'EASE', desc: 'OVERWHELM, ONE VERSE AT A TIME' },
  { out: '03-build-habit.png', verb: 'BUILD', desc: 'A DAILY HABIT THAT STICKS' },
  { out: '04-keep-private.png', verb: 'KEEP', desc: 'YOUR REFLECTIONS COMPLETELY PRIVATE' },
  { out: '05-begin-journey.png', verb: 'BEGIN', desc: 'YOUR JOURNEY TO SAKINA' },
  { out: '06-grow-journeys.png', verb: 'GROW', desc: 'THROUGH GUIDED SPIRITUAL JOURNEYS' },
  { out: '07-read-quran.png', verb: 'READ', desc: 'THE COMPLETE QURAN, BEAUTIFULLY' },
  { out: '08-save-verses.png', verb: 'SAVE', desc: 'EVERY VERSE THAT SPEAKS TO YOU' },
];

(async () => {
  const base = __dirname;
  const outDir = path.join(base, 'ipad-13-inch-2064x2752');
  require('fs').mkdirSync(outDir, { recursive: true });
  for (const job of JOBS) {
    const srcPath = path.join(base, job.out);
    const [bg, device] = await Promise.all([
      buildBackground(job.verb, job.desc),
      buildDeviceLayer(srcPath),
    ]);
    await sharp(bg).composite([{ input: device }]).png().toFile(path.join(outDir, job.out));
    console.log('wrote', job.out);
  }
})().catch((e) => { console.error(e); process.exit(1); });
