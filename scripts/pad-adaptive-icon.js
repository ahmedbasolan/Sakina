/**
 * Pads the Android adaptive icon foreground so the lantern sits within
 * the safe zone (66dp out of 108dp), preventing it from being clipped
 * by the device launcher's mask (circle, squircle, etc.).
 *
 * Android spec:
 *   - Full icon canvas: 108 × 108 dp (we work at 1024px)
 *   - Safe zone (always visible): 66 × 66 dp → 626 × 626px at 1024
 *   - Content should occupy ~61% of the total canvas, centred
 *
 * Run once:
 *   npm install sharp --save-dev
 *   node scripts/pad-adaptive-icon.js
 */

const path = require('path');
const fs = require('fs');

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('sharp not installed. Run: npm install sharp --save-dev');
  process.exit(1);
}

const SRC = path.join(__dirname, '../assets/adaptive-icon.png');
const TMP = path.join(__dirname, '../assets/adaptive-icon-padded.tmp.png');
const DST = path.join(__dirname, '../assets/adaptive-icon.png');
const BACKUP = path.join(__dirname, '../assets/adaptive-icon-original.png');

async function main() {
  const meta = await sharp(SRC).metadata();
  const srcSize = meta.width;

  // Target: content at 61% of canvas, centred. Android safe zone = 66/108.
  // Add 18% padding on each side (the remainder split evenly).
  const TARGET = 1024;
  const CONTENT_SIZE = Math.round(TARGET * (66 / 108)); // 626px

  const padEach = Math.round((TARGET - CONTENT_SIZE) / 2); // 199px each side

  // Back up original before overwriting
  if (!fs.existsSync(BACKUP)) {
    fs.copyFileSync(SRC, BACKUP);
    console.log('Backed up original to assets/adaptive-icon-original.png');
  }

  await sharp(SRC)
    .resize(CONTENT_SIZE, CONTENT_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: padEach,
      bottom: TARGET - CONTENT_SIZE - padEach,
      left: padEach,
      right: TARGET - CONTENT_SIZE - padEach,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(TMP);

  fs.renameSync(TMP, DST);

  console.log(`Done — adaptive-icon.png is now ${TARGET}×${TARGET}px with content in the 66/108 safe zone.`);
  console.log('Rebuild your EAS preview to see the change: eas build --profile preview --platform android');
}

main().catch((err) => { console.error(err); process.exit(1); });
