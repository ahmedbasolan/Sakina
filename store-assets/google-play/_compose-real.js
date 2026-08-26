const sharp = require('sharp');
const path = require('path');

const CANVAS_W = 1080;
const CANVAS_H = 1920;

const SCREEN_X = 164, SCREEN_Y = 466, SCREEN_W = 752, SCREEN_H = 1310, SCREEN_RX = 46;
const PHONE_X = 140, PHONE_Y = 446, PHONE_W = 800, PHONE_H = 1340, PHONE_RX = 64;
const STATUS_STRIP = 54;

const MANDALA = `<g transform="translate(300,60) scale(4.8)" opacity="0.16" fill="none" stroke="#D4AF37" stroke-linejoin="round" stroke-linecap="round"><circle cx="50" cy="50" r="48" stroke-width="0.5" opacity="0.6"/><path d="M 50.00,2.00 L 98.00,50.00 M 74.00,8.43 L 91.57,74.00 M 91.57,26.00 L 74.00,91.57 M 98.00,50.00 L 50.00,98.00 M 91.57,74.00 L 26.00,91.57 M 74.00,91.57 L 8.43,74.00 M 50.00,98.00 L 2.00,50.00 M 26.00,91.57 L 8.43,26.00 M 8.43,74.00 L 26.00,8.43 M 2.00,50.00 L 50.00,2.00 M 8.43,26.00 L 74.00,8.43 M 26.00,8.43 L 91.57,26.00" stroke-width="0.27" opacity="0.1"/><path d="M 50.00,2.00 L 91.57,74.00 M 74.00,8.43 L 74.00,91.57 M 91.57,26.00 L 50.00,98.00 M 98.00,50.00 L 26.00,91.57 M 91.57,74.00 L 8.43,74.00 M 74.00,91.57 L 2.00,50.00 M 50.00,98.00 L 8.43,26.00 M 26.00,91.57 L 26.00,8.43 M 8.43,74.00 L 50.00,2.00 M 2.00,50.00 L 74.00,8.43 M 8.43,26.00 L 91.57,26.00 M 26.00,8.43 L 98.00,50.00" stroke-width="0.27" opacity="0.1"/><path d="M 50.00,2.00 L 74.00,91.57 M 74.00,8.43 L 50.00,98.00 M 91.57,26.00 L 26.00,91.57 M 98.00,50.00 L 8.43,74.00 M 91.57,74.00 L 2.00,50.00 M 74.00,91.57 L 8.43,26.00 M 50.00,98.00 L 26.00,8.43 M 26.00,91.57 L 50.00,2.00 M 8.43,74.00 L 74.00,8.43 M 2.00,50.00 L 91.57,26.00 M 8.43,26.00 L 98.00,50.00 M 26.00,8.43 L 91.57,74.00" stroke-width="0.27" opacity="0.15"/><circle cx="50" cy="50" r="24" stroke-width="0.24" opacity="0.3"/><circle cx="50" cy="50" r="8.64" stroke-width="0.5" opacity="0.6"/></g>`;

function stars() {
  const pts = [
    [120, 90, 4, 0.8], [960, 130, 3, 0.6], [220, 210, 3.5, 0.7],
    [860, 60, 3, 0.55], [500, 50, 3, 0.6], [70, 330, 3, 0.5], [1000, 340, 3.5, 0.6],
  ];
  return `<g fill="#D4AF37">${pts.map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill-opacity="${o}"/>`).join('')}</g>`;
}

function headerBlock(badge, line1, line2) {
  return `
  <rect x="90" y="150" width="470" height="66" rx="33" fill="none" stroke="#D4AF37" stroke-opacity="0.6" stroke-width="2"/>
  <text x="325" y="192" text-anchor="middle" font-family="Georgia, serif" font-size="23" letter-spacing="1.5" fill="#D4AF37" font-weight="bold">${badge}</text>
  <text x="90" y="300" font-family="Georgia, serif" font-size="62" font-weight="bold" fill="#F5EDE3">${line1}</text>
  <text x="90" y="378" font-family="Georgia, serif" font-size="62" font-weight="bold" fill="#F5EDE3">${line2}</text>`;
}

async function buildBackground(badge, line1, line2) {
  const svg = `<svg width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#07111E"/><stop offset="0.55" stop-color="#0C1A2E"/><stop offset="1" stop-color="#0F1F30"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${CANVAS_W}" height="${CANVAS_H}" fill="url(#bgGrad)"/>
    ${MANDALA}
    ${stars()}
    ${headerBlock(badge, line1, line2)}
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function buildFrameChrome() {
  const svg = `<svg width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="screenGlow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#D4AF37" stop-opacity="0.10"/><stop offset="1" stop-color="#D4AF37" stop-opacity="0"/>
      </linearGradient>
      <clipPath id="screenClip"><rect x="${SCREEN_X}" y="${SCREEN_Y}" width="${SCREEN_W}" height="${SCREEN_H}" rx="${SCREEN_RX}"/></clipPath>
    </defs>
    <path fill-rule="evenodd" fill="#0C1A2E" stroke="#D4AF37" stroke-opacity="0.35" stroke-width="3" d="
      M${PHONE_X + PHONE_RX},${PHONE_Y}
      h${PHONE_W - 2 * PHONE_RX} a${PHONE_RX},${PHONE_RX} 0 0 1 ${PHONE_RX},${PHONE_RX}
      v${PHONE_H - 2 * PHONE_RX} a${PHONE_RX},${PHONE_RX} 0 0 1 -${PHONE_RX},${PHONE_RX}
      h-${PHONE_W - 2 * PHONE_RX} a${PHONE_RX},${PHONE_RX} 0 0 1 -${PHONE_RX},-${PHONE_RX}
      v-${PHONE_H - 2 * PHONE_RX} a${PHONE_RX},${PHONE_RX} 0 0 1 ${PHONE_RX},-${PHONE_RX} Z
      M${SCREEN_X + SCREEN_RX},${SCREEN_Y}
      h${SCREEN_W - 2 * SCREEN_RX} a${SCREEN_RX},${SCREEN_RX} 0 0 1 ${SCREEN_RX},${SCREEN_RX}
      v${SCREEN_H - 2 * SCREEN_RX} a${SCREEN_RX},${SCREEN_RX} 0 0 1 -${SCREEN_RX},${SCREEN_RX}
      h-${SCREEN_W - 2 * SCREEN_RX} a${SCREEN_RX},${SCREEN_RX} 0 0 1 -${SCREEN_RX},-${SCREEN_RX}
      v-${SCREEN_H - 2 * SCREEN_RX} a${SCREEN_RX},${SCREEN_RX} 0 0 1 ${SCREEN_RX},-${SCREEN_RX} Z"/>
    <g clip-path="url(#screenClip)">
      <rect x="${SCREEN_X}" y="${SCREEN_Y}" width="${SCREEN_W}" height="${SCREEN_H}" fill="url(#screenGlow)"/>
      <text x="${SCREEN_X + 36}" y="${SCREEN_Y + 34}" font-family="Arial, sans-serif" font-size="20" fill="#F5EDE3" fill-opacity="0.85">9:41</text>
      <rect x="${SCREEN_X + SCREEN_W - 60}" y="${SCREEN_Y + 16}" width="26" height="13" rx="3" fill="none" stroke="#F5EDE3" stroke-opacity="0.75" stroke-width="1.5"/>
    </g>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function buildScreenshotLayer(srcPath, crop) {
  let img = sharp(srcPath);
  const meta = await img.metadata();
  const extractRegion = { left: 0, top: crop.top, width: meta.width, height: crop.bottom - crop.top };
  img = img.extract(extractRegion);

  const scale = SCREEN_W / meta.width;
  const resizedH = Math.round(extractRegion.height * scale);
  const finalH = Math.min(resizedH, SCREEN_H - STATUS_STRIP);

  const resized = await img.resize(SCREEN_W, resizedH).extract({ left: 0, top: 0, width: SCREEN_W, height: finalH }).png().toBuffer();

  const maskSvg = `<svg width="${SCREEN_W}" height="${finalH}"><rect x="0" y="0" width="${SCREEN_W}" height="${finalH}" rx="${SCREEN_RX}" fill="#fff"/></svg>`;
  const mask = await sharp(Buffer.from(maskSvg)).png().toBuffer();
  const masked = await sharp(resized).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();

  const stripSvg = `<svg width="${SCREEN_W}" height="${STATUS_STRIP}"><path d="M0,${STATUS_STRIP} V${SCREEN_RX} a${SCREEN_RX},${SCREEN_RX} 0 0 1 ${SCREEN_RX},-${SCREEN_RX} H${SCREEN_W - SCREEN_RX} a${SCREEN_RX},${SCREEN_RX} 0 0 1 ${SCREEN_RX},${SCREEN_RX} V${STATUS_STRIP} Z" fill="#07111E"/></svg>`;
  const strip = await sharp(Buffer.from(stripSvg)).png().toBuffer();

  const layer = sharp({ create: { width: CANVAS_W, height: CANVAS_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } });
  return layer.composite([
    { input: strip, left: SCREEN_X, top: SCREEN_Y },
    { input: masked, left: SCREEN_X, top: SCREEN_Y + STATUS_STRIP },
  ]).png().toBuffer();
}

const STANDARD_CROP = { top: 120, bottom: 2940 };

const JOBS = [
  { out: '01-hook-mood-grid.png', badge: 'A VERSE FOR HOW YOU FEEL', line1: 'Tap your mood.', line2: 'Meet a verse for it.', src: '../app-store/real-screenshots/FIND-v2.jpg', crop: STANDARD_CROP },
  { out: '02-relief-verse-match.png', badge: 'MEET YOU WHERE YOU ARE', line1: 'Overwhelmed? Anxious?', line2: 'There’s a verse for that.', src: '../app-store/real-screenshots/EASE-v2.jpg', crop: STANDARD_CROP },
  { out: '03-growth-streak-journeys.png', badge: 'GROW CLOSER, DAY BY DAY', line1: 'Build the habit', line2: 'that brings you closer', src: '../app-store/real-screenshots/BUILD-v2.jpg', crop: STANDARD_CROP },
  { out: '06-read-quran.png', badge: 'THE WORD, BEAUTIFULLY RENDERED', line1: 'Read every surah,', line2: 'beautifully.', src: '../app-store/real-screenshots/READ-v2.jpg', crop: STANDARD_CROP },
];

(async () => {
  const base = __dirname;
  for (const job of JOBS) {
    const [bg, shot, frame] = await Promise.all([
      buildBackground(job.badge, job.line1, job.line2),
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
