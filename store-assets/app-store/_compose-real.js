const sharp = require('sharp');
const path = require('path');

const CANVAS_W = 1290;
const CANVAS_H = 2796;

// device frame geometry (matches the illustrated template)
const DEVICE_X = 130, DEVICE_Y = 700, DEVICE_W = 1030, DEVICE_H = 2280, DEVICE_RX = 72;
const BEZEL = 18;
const SCREEN_X = DEVICE_X + BEZEL;
const SCREEN_Y = DEVICE_Y + BEZEL;
const SCREEN_W = DEVICE_W - 2 * BEZEL; // 994
const SCREEN_RX = 54;
const MAX_SCREEN_H = DEVICE_H - 2 * BEZEL; // 2244

const bgDefs = `
  <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#07111E"/>
    <stop offset="0.55" stop-color="#0C1A2E"/>
    <stop offset="1" stop-color="#0F1F30"/>
  </linearGradient>`;

const mandala = `<g transform="translate(405,100) scale(4.8)" opacity="0.16" fill="none" stroke="#D4AF37" stroke-linejoin="round" stroke-linecap="round"><circle cx="50" cy="50" r="48" stroke-width="0.5" opacity="0.6"/><path d="M 50.00,2.00 L 98.00,50.00 M 74.00,8.43 L 91.57,74.00 M 91.57,26.00 L 74.00,91.57 M 98.00,50.00 L 50.00,98.00 M 91.57,74.00 L 26.00,91.57 M 74.00,91.57 L 8.43,74.00 M 50.00,98.00 L 2.00,50.00 M 26.00,91.57 L 8.43,26.00 M 8.43,74.00 L 26.00,8.43 M 2.00,50.00 L 50.00,2.00 M 8.43,26.00 L 74.00,8.43 M 26.00,8.43 L 91.57,26.00" stroke-width="0.27" opacity="0.1"/><path d="M 50.00,2.00 L 91.57,74.00 M 74.00,8.43 L 74.00,91.57 M 91.57,26.00 L 50.00,98.00 M 98.00,50.00 L 26.00,91.57 M 91.57,74.00 L 8.43,74.00 M 74.00,91.57 L 2.00,50.00 M 50.00,98.00 L 8.43,26.00 M 26.00,91.57 L 26.00,8.43 M 8.43,74.00 L 50.00,2.00 M 2.00,50.00 L 74.00,8.43 M 8.43,26.00 L 91.57,26.00 M 26.00,8.43 L 98.00,50.00" stroke-width="0.27" opacity="0.1"/><path d="M 50.00,2.00 L 74.00,91.57 M 74.00,8.43 L 50.00,98.00 M 91.57,26.00 L 26.00,91.57 M 98.00,50.00 L 8.43,74.00 M 91.57,74.00 L 2.00,50.00 M 74.00,91.57 L 8.43,26.00 M 50.00,98.00 L 26.00,8.43 M 26.00,91.57 L 50.00,2.00 M 8.43,74.00 L 74.00,8.43 M 2.00,50.00 L 91.57,26.00 M 8.43,26.00 L 98.00,50.00 M 26.00,8.43 L 91.57,74.00" stroke-width="0.27" opacity="0.15"/><circle cx="50" cy="50" r="24" stroke-width="0.24" opacity="0.3"/><circle cx="50" cy="50" r="8.64" stroke-width="0.5" opacity="0.6"/></g>`;

const stars = `<g fill="#D4AF37">
  <circle cx="120" cy="90" r="4" fill-opacity="0.8"/>
  <circle cx="1150" cy="130" r="3" fill-opacity="0.6"/>
  <circle cx="220" cy="210" r="3.5" fill-opacity="0.7"/>
  <circle cx="1040" cy="60" r="3" fill-opacity="0.55"/>
  <circle cx="600" cy="50" r="3" fill-opacity="0.6"/>
  <circle cx="70" cy="330" r="3" fill-opacity="0.5"/>
  <circle cx="1200" cy="340" r="3.5" fill-opacity="0.6"/>
  <circle cx="900" cy="220" r="2.5" fill-opacity="0.5"/>
</g>`;

function headline(verb, desc) {
  return `
  <text x="645" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="152" font-weight="bold" letter-spacing="2" fill="#F5EDE3">${verb}</text>
  <text x="645" y="392" text-anchor="middle" font-family="Georgia, serif" font-size="54" letter-spacing="1" fill="#F5EDE3" fill-opacity="0.85">${desc}</text>`;
}

async function buildBackground(verb, desc) {
  const svg = `<svg width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
    <defs>${bgDefs}</defs>
    <rect x="0" y="0" width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#bgGrad)"/>
    ${mandala}
    ${stars}
    ${headline(verb, desc)}
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function buildFrameChrome() {
  // outer bezel with a true transparent hole over the screen (evenodd), drawn via two rects in one path
  const svg = `<svg width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="screenGlow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#D4AF37" stop-opacity="0.10"/>
        <stop offset="1" stop-color="#D4AF37" stop-opacity="0"/>
      </linearGradient>
      <clipPath id="screenClip"><rect x="${SCREEN_X}" y="${SCREEN_Y}" width="${SCREEN_W}" height="${MAX_SCREEN_H}" rx="${SCREEN_RX}"/></clipPath>
    </defs>
    <path fill-rule="evenodd" fill="#0C1A2E" stroke="#D4AF37" stroke-opacity="0.35" stroke-width="3" d="
      M${DEVICE_X + DEVICE_RX},${DEVICE_Y}
      h${DEVICE_W - 2 * DEVICE_RX} a${DEVICE_RX},${DEVICE_RX} 0 0 1 ${DEVICE_RX},${DEVICE_RX}
      v${DEVICE_H - 2 * DEVICE_RX} a${DEVICE_RX},${DEVICE_RX} 0 0 1 -${DEVICE_RX},${DEVICE_RX}
      h-${DEVICE_W - 2 * DEVICE_RX} a${DEVICE_RX},${DEVICE_RX} 0 0 1 -${DEVICE_RX},-${DEVICE_RX}
      v-${DEVICE_H - 2 * DEVICE_RX} a${DEVICE_RX},${DEVICE_RX} 0 0 1 ${DEVICE_RX},-${DEVICE_RX} Z
      M${SCREEN_X + SCREEN_RX},${SCREEN_Y}
      h${SCREEN_W - 2 * SCREEN_RX} a${SCREEN_RX},${SCREEN_RX} 0 0 1 ${SCREEN_RX},${SCREEN_RX}
      v${MAX_SCREEN_H - 2 * SCREEN_RX} a${SCREEN_RX},${SCREEN_RX} 0 0 1 -${SCREEN_RX},${SCREEN_RX}
      h-${SCREEN_W - 2 * SCREEN_RX} a${SCREEN_RX},${SCREEN_RX} 0 0 1 -${SCREEN_RX},-${SCREEN_RX}
      v-${MAX_SCREEN_H - 2 * SCREEN_RX} a${SCREEN_RX},${SCREEN_RX} 0 0 1 ${SCREEN_RX},-${SCREEN_RX} Z"/>
    <g clip-path="url(#screenClip)">
      <rect x="${SCREEN_X}" y="${SCREEN_Y}" width="${SCREEN_W}" height="${MAX_SCREEN_H}" fill="url(#screenGlow)"/>
      <text x="${SCREEN_X + 32}" y="${SCREEN_Y + 44}" font-family="Arial, sans-serif" font-size="22" fill="#F5EDE3" fill-opacity="0.85">9:41</text>
      <rect x="${SCREEN_X + SCREEN_W - 62}" y="${SCREEN_Y + 24}" width="28" height="14" rx="3" fill="none" stroke="#F5EDE3" stroke-opacity="0.75" stroke-width="1.5"/>
    </g>
    <rect x="${DEVICE_X + DEVICE_W / 2 - 65}" y="${DEVICE_Y + 42}" width="130" height="36" rx="18" fill="#040D1A"/>
    <rect x="${DEVICE_X - 6}" y="840" width="6" height="70" rx="3" fill="#0C1A2E" stroke="#D4AF37" stroke-opacity="0.35" stroke-width="1.5"/>
    <rect x="${DEVICE_X - 6}" y="930" width="6" height="110" rx="3" fill="#0C1A2E" stroke="#D4AF37" stroke-opacity="0.35" stroke-width="1.5"/>
    <rect x="${DEVICE_X + DEVICE_W}" y="900" width="6" height="150" rx="3" fill="#0C1A2E" stroke="#D4AF37" stroke-opacity="0.35" stroke-width="1.5"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function buildScreenshotLayer(srcPath, crop) {
  let img = sharp(srcPath);
  const meta = await img.metadata();
  let extractRegion = null;
  if (crop) {
    extractRegion = { left: 0, top: crop.top, width: meta.width, height: crop.bottom - crop.top };
    img = img.extract(extractRegion);
  }
  const srcW = meta.width;
  const srcH = extractRegion ? extractRegion.height : meta.height;
  const scale = SCREEN_W / srcW;
  const resizedH = Math.round(srcH * scale);
  const finalH = Math.min(resizedH, MAX_SCREEN_H);

  const resized = await img.resize(SCREEN_W, resizedH).extract({ left: 0, top: 0, width: SCREEN_W, height: finalH }).png().toBuffer();

  const maskSvg = `<svg width="${SCREEN_W}" height="${finalH}"><rect x="0" y="0" width="${SCREEN_W}" height="${finalH}" rx="${SCREEN_RX}" fill="#fff"/></svg>`;
  const mask = await sharp(Buffer.from(maskSvg)).png().toBuffer();
  const masked = await sharp(resized).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();

  // solid navy strip (rounded top corners) fills the gap left for our own status-bar overlay,
  // so the celestial background can't bleed through a transparent seam
  const STATUS_STRIP = 70;
  const stripSvg = `<svg width="${SCREEN_W}" height="${STATUS_STRIP}"><path d="M0,${STATUS_STRIP} V${SCREEN_RX} a${SCREEN_RX},${SCREEN_RX} 0 0 1 ${SCREEN_RX},-${SCREEN_RX} H${SCREEN_W - SCREEN_RX} a${SCREEN_RX},${SCREEN_RX} 0 0 1 ${SCREEN_RX},${SCREEN_RX} V${STATUS_STRIP} Z" fill="#07111E"/></svg>`;
  const strip = await sharp(Buffer.from(stripSvg)).png().toBuffer();

  const layer = sharp({ create: { width: CANVAS_W, height: CANVAS_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
  return layer.composite([
    { input: strip, left: SCREEN_X, top: SCREEN_Y },
    { input: masked, left: SCREEN_X, top: SCREEN_Y + STATUS_STRIP },
  ]).png().toBuffer();
}

const STANDARD_CROP = { top: 120, bottom: 2940 }; // 1440-wide native device captures
const COMPACT_CROP = { top: 80, bottom: 1905 }; // 932-wide captures (chat-attachment resolution)

const JOBS = [
  { out: '01-find-verse.png', verb: 'FIND', desc: 'A VERSE FOR HOW YOU FEEL', src: 'real-screenshots/FIND-v2.jpg', crop: STANDARD_CROP },
  { out: '02-ease-overwhelm.png', verb: 'EASE', desc: 'OVERWHELM, ONE VERSE AT A TIME', src: 'real-screenshots/EASE-v2.jpg', crop: STANDARD_CROP },
  { out: '03-build-habit.png', verb: 'BUILD', desc: 'A DAILY HABIT THAT STICKS', src: 'real-screenshots/BUILD-v2.jpg', crop: STANDARD_CROP },
  { out: '04-keep-private.png', verb: 'KEEP', desc: 'YOUR REFLECTIONS COMPLETELY PRIVATE', src: 'real-screenshots/REFLECTION.jpg', crop: STANDARD_CROP },
  { out: '05-begin-journey.png', verb: 'BEGIN', desc: 'YOUR JOURNEY TO SAKINA', src: 'real-screenshots/BEGIN.jpg', crop: STANDARD_CROP },
  { out: '06-grow-journeys.png', verb: 'GROW', desc: 'THROUGH GUIDED SPIRITUAL JOURNEYS', src: 'real-screenshots/JOURNEYS.jpg', crop: COMPACT_CROP },
  { out: '07-read-quran.png', verb: 'READ', desc: 'THE COMPLETE QURAN, BEAUTIFULLY', src: 'real-screenshots/READ-v2.jpg', crop: STANDARD_CROP },
  { out: '08-save-verses.png', verb: 'SAVE', desc: 'EVERY VERSE THAT SPEAKS TO YOU', src: 'real-screenshots/SAVE.jpg', crop: COMPACT_CROP },
];

(async () => {
  const base = __dirname;
  const fs = require('fs');
  for (const job of JOBS) {
    if (!fs.existsSync(path.join(base, job.src))) {
      console.log('skip (source missing)', job.out);
      continue;
    }
    const [bg, shot, frame] = await Promise.all([
      buildBackground(job.verb, job.desc),
      buildScreenshotLayer(path.join(base, job.src), job.crop),
      buildFrameChrome(),
    ]);
    await sharp(bg)
      .composite([{ input: shot }, { input: frame }])
      .png()
      .toFile(path.join(base, job.out));
    console.log('wrote', job.out);
  }
})().catch((e) => { console.error(e); process.exit(1); });
