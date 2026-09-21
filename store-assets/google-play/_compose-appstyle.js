const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { renderDevice } = require('../_device');
const SCREENS = require('../_screens');

// Play Store phone screenshot canvas
const CANVAS_W = 1080;
const CANVAS_H = 1920;

// Rendered as vector at this scale, rather than cropped out of the App Store
// PNG and downsampled — the old crop started at the device's left edge and so
// cut both side-button columns off every Play screenshot.
const SCALE = 0.8;
const DEVICE_Y = 300;

// Tablet slots. 7" was a byte-identical copy of the phone set and 10" a 2x
// resize of it, both made by hand; written here so they cannot drift.
const APP_STORE_CAPTURES = path.join(__dirname, '../app-store/real-screenshots');
const TABLETS = [
  ['7-inch-tablet-1080x1920', 1080, 1920],
  ['10-inch-tablet-2160x3840', 2160, 3840],
];

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

(async () => {
  const base = __dirname;
  for (const job of SCREENS) {
    const [bg, device] = await Promise.all([
      buildBackground(job.verb, job.desc),
      renderDevice({
        canvasW: CANVAS_W,
        canvasH: CANVAS_H,
        y: DEVICE_Y,
        scale: SCALE,
        screen: { src: path.join(APP_STORE_CAPTURES, job.src), crop: job.crop },
      }),
    ]);
    const phone = await sharp(bg).composite([{ input: device }]).png().toBuffer();
    await sharp(phone).toFile(path.join(base, `${job.play}.png`));
    for (const [dir, w, h] of TABLETS) {
      fs.mkdirSync(path.join(base, dir), { recursive: true });
      await sharp(phone).resize(w, h, { fit: 'fill' }).png().toFile(path.join(base, dir, `${job.play}.png`));
    }
    console.log('wrote', job.play);
  }
})().catch((e) => { console.error(e); process.exit(1); });
