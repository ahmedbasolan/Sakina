#!/usr/bin/env node
/**
 * Cuts a 2:3 portrait crop of every landscape theme photo. Output goes to
 * src/assets/themes/portrait/ and is referenced as `portraitImageSource` in
 * backgroundThemeService.ts (and directly by the MoodColors images in
 * DesignSystem.ts). The share card uses it because it sizes itself to its
 * photo, and a landscape photo made a card too short to hold a verse; the
 * full-screen backgrounds use it so the visible part is framed on the
 * subject. The originals stay for the theme picker thumbnails and the iOS
 * lock-screen attachment (Android shows no attachment image at all).
 *
 * `x` is where the crop sits across the photo: 0 = flush left, 1 = flush
 * right. Each was picked by eye against the photo, not by sharp's attention
 * strategy, which cut the Sheikh Zayed mosque in half and missed the lion's
 * face. Change a value, re-run, and look at the result.
 *
 * Crops are full height at native resolution (no upscaling), so a 1440x960
 * source gives 640x960.
 *
 * Usage: node scripts/make-portrait-crops.mjs
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = 'src/assets/themes';
const OUT = path.join(SRC, 'portrait');
const ASPECT = 2 / 3; // width / height

const CROPS = {
  animals_birds_flight: { x: 0.76, subject: 'kingfisher' },
  landscape_lavender_field: { x: 0.78, subject: 'lavender rows and sun' },
  landscape_rolling_hills: { x: 0.7, subject: 'sun over the field' },
  landscape_sheikh_zayed: { x: 0.5, subject: 'main dome and its reflection' },
  mountain_alpine_lake: { x: 0.25, subject: 'rowing boat and cliffs' },
  mountain_lake_reflection: { x: 0.52, subject: 'jetty' },
  mountain_misty_valley: { x: 0.3, subject: 'peak and glacier valley' },
  mountain_snow_peaks: { x: 0.1, subject: 'lit summit over the clouds' },
  mountain_sunrise_peak: { x: 0.41, subject: 'main summit' },
  nature_autumn_forest: { x: 0.4, subject: 'lake between the pines' },
  nature_bamboo_grove: { x: 0.87, subject: 'right-hand puffin' },
  nature_forest_path: { x: 0.9, subject: 'light through the trees' },
  nature_sunbeams_forest: { x: 0.58, subject: 'tree trunk and crown' },
  nature_waterfall: { x: 0.08, subject: "lion's face" },
  ocean_calm_shore: { x: 0.12, subject: 'sun and shoreline' },
  ocean_sunset_beach: { x: 0.9, subject: 'pink horizon and wave' },
  sky_golden_sunset: { x: 0.42, subject: 'sun and jetty, boat left out' },
  sky_milky_way: { x: 0.39, subject: 'galactic core over the peak' },
  sky_northern_lights: { x: 0.62, subject: 'aurora' },
  sky_pastel_clouds: { x: 0.5, subject: 'starfield' },
  sky_starry_galaxy: { x: 0.6, subject: 'shooting star and horizon glow' },
};

// Every landscape theme photo must have an entry, or the share card falls
// back to a landscape photo and a card too short for the verse.
const failures = [];
for (const f of fs.readdirSync(SRC).filter((n) => n.endsWith('.jpg'))) {
  const id = f.replace(/\.jpg$/, '');
  const { width, height } = await sharp(path.join(SRC, f)).metadata();
  if (width / height > ASPECT + 0.01 && !CROPS[id] && id !== 'mood_sad') failures.push(`no crop for landscape ${f}`);
}
// A crop that is generated but never wired up does nothing, silently.
const service = fs.readFileSync('src/services/backgroundThemeService.ts', 'utf8');
for (const id of Object.keys(CROPS)) {
  if (!fs.existsSync(path.join(SRC, id + '.jpg'))) failures.push(`crop listed for missing ${id}.jpg`);
  if (!service.includes(`portraitImageSource: require('../assets/themes/portrait/${id}.jpg')`))
    failures.push(`${id} has a crop but no portraitImageSource in backgroundThemeService.ts`);
}
// The MoodColors images in DesignSystem.ts are full-screen backgrounds that
// bypass BACKGROUND_THEMES, so they must name the portrait/ crop directly.
// mood_sad.jpg (0.78) is the one exception: it has no crop, and is exempt
// from the landscape check above for the same reason.
const designSystem = fs.readFileSync('src/theme/DesignSystem.ts', 'utf8');
for (const [, rel] of designSystem.matchAll(/require\('\.\.\/assets\/themes\/([^']+\.jpg)'\)/g)) {
  const { width, height } = await sharp(path.join(SRC, rel)).metadata();
  if (width / height > ASPECT + 0.01 && rel !== 'mood_sad.jpg')
    failures.push(`DesignSystem.ts uses landscape ${rel} as a full-screen mood image; point it at portrait/`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });
for (const [id, { x }] of Object.entries(CROPS)) {
  const src = path.join(SRC, id + '.jpg');
  const { width, height } = await sharp(src).metadata();
  const cw = Math.round(height * ASPECT);
  const left = Math.round(x * (width - cw));
  const out = path.join(OUT, id + '.jpg');
  await sharp(src)
    .extract({ left, top: 0, width: cw, height })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out);
  console.log(`${id}: ${cw}x${height} from left ${left} -> ${out} (${Math.round(fs.statSync(out).size / 1024)} KB)`);
}
