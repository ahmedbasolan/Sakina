const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { renderDevice } = require('../_device');
const SCREENS = require('../_screens');

// iPhone 6.9" — the master set. 6.7" and 6.5" are written from it below.
const CANVAS_W = 1290;
const CANVAS_H = 2796;

// Lowest the phone can sit and still have the shortest capture (1946 px of
// content at this scale) reach the canvas bottom. Any higher and the screen
// runs out of app before the canvas does.
const DEVICE_Y = 680;

const DERIVED = [
  ['6.7-inch-1284x2778', 1284, 2778],
  ['6.5-inch-1242x2688', 1242, 2688],
];

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

(async () => {
  const base = __dirname;
  // A missing capture must stop the run, not skip it. Skipping is how 04 and 05
  // quietly kept an old frame while the other six were regenerated around them.
  const missing = SCREENS.filter((s) => !fs.existsSync(path.join(base, 'real-screenshots', s.src)));
  if (missing.length) throw new Error(`missing captures: ${missing.map((s) => s.src).join(', ')}`);

  for (const job of SCREENS) {
    const [bg, device] = await Promise.all([
      buildBackground(job.verb, job.desc),
      renderDevice({
        canvasW: CANVAS_W,
        canvasH: CANVAS_H,
        y: DEVICE_Y,
        screen: { src: path.join(base, 'real-screenshots', job.src), crop: job.crop },
      }),
    ]);
    const master = await sharp(bg).composite([{ input: device }]).png().toBuffer();
    await sharp(master).toFile(path.join(base, `${job.id}.png`));
    for (const [dir, w, h] of DERIVED) {
      await sharp(master).resize(w, h, { fit: 'fill' }).png().toFile(path.join(base, dir, `${job.id}.png`));
    }
    console.log('wrote', job.id);
  }
})().catch((e) => { console.error(e); process.exit(1); });
