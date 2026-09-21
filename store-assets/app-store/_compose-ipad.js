const sharp = require('sharp');
const path = require('path');
const { renderDevice } = require('../_device');
const SCREENS = require('../_screens');

// iPad 13" Display — one of Apple's accepted pairs for this upload slot
const CANVAS_W = 2064;
const CANVAS_H = 2752;

// Same rule as the iPhone set: the lowest the phone can sit and still have the
// shortest capture reach the canvas bottom. The old crop-and-paste version
// stopped the phone 76 px above the bottom edge.
const DEVICE_Y = 640;

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

(async () => {
  const base = __dirname;
  const outDir = path.join(base, 'ipad-13-inch-2064x2752');
  require('fs').mkdirSync(outDir, { recursive: true });
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
    await sharp(bg).composite([{ input: device }]).png().toFile(path.join(outDir, `${job.id}.png`));
    console.log('wrote', job.id);
  }
})().catch((e) => { console.error(e); process.exit(1); });
