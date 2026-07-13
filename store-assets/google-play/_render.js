const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.svg'));

(async () => {
  for (const file of files) {
    const svgPath = path.join(dir, file);
    const pngPath = path.join(dir, file.replace('.svg', '.png'));
    await sharp(svgPath, { density: 144 })
      .resize(1080, 1920)
      .flatten({ background: '#07111E' }) // no alpha channel, per Play Store spec
      .png()
      .toFile(pngPath);
    const meta = await sharp(pngPath).metadata();
    console.log(`${file} -> ${pngPath.split('\\').pop()} (${meta.width}x${meta.height}, alpha=${meta.hasAlpha})`);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
