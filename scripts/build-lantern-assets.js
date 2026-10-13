// Builds the two lantern assets the app ships, both from the app icon's lantern
// so the brand mark matches the icon everywhere:
//
//   src/assets/brand/lantern.png   full-colour cut-out, rendered by
//                                  src/components/SakinaLantern.tsx
//   assets/notification-icon.png   Android status-bar small icon (expo-notifications
//                                  "icon" in app.json)
//
// Android draws a notification small icon from its ALPHA ONLY — colour is
// thrown away and the shape is tinted white in the status bar and with the
// plugin's "color" in the shade. So the notification icon is a white shape on
// transparent, drawn here as vector in the cut-out's own 576 x 1124 frame from
// measured landmarks (ring, onion-dome cage, top bar, three-window body, bottom
// bar, curved base). Tracing the raster was tried first and came out broken:
// the gold's specular highlights fail any colour key, so the dome bars split.
// Strokes are deliberately heavier than the icon's (~40 vs ~28 units) so each
// bar is >= 3 px at xxxhdpi (96 px), where the lantern is ~86 px tall.
//
// Run: node scripts/build-lantern-assets.js   (needs only sharp)
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { iconLantern } = require('./lib/iconLantern');

const ROOT = path.join(__dirname, '..');

// Tallest in-app use is 72 pt (RestingPoint), 216 px at @3x; 360 leaves room.
const LANTERN_H = 360;

const S = 40; // notification stroke width, in cut-out units
const notificationSvg = (size) => {
  // Lantern spans y 14–1114 (1100 units); fit it to 88% of the canvas height,
  // Android's 2 dp padding on a 24 dp icon being ~8% a side.
  const k = (size * 0.88) / 1100;
  const tx = size / 2 - 288 * k;
  const ty = size / 2 - 564 * k;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(${tx},${ty}) scale(${k})" fill="#fff" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
    <!-- ring -->
    <circle cx="288" cy="72" r="40" fill="none" stroke-width="${S}"/>
    <!-- onion-dome cage: outer and inner bar pairs from the apex to the top bar -->
    <g fill="none" stroke-width="${S}">
      <path d="M288,134 C200,160 66,214 62,340"/>
      <path d="M288,134 C376,160 510,214 514,340"/>
      <path d="M288,134 C222,182 180,250 178,340"/>
      <path d="M288,134 C354,182 396,250 398,340"/>
    </g>
    <!-- top bar -->
    <rect x="10" y="338" width="556" height="58" rx="29" stroke="none"/>
    <!-- body: solid frame with three pointed-arch windows cut out -->
    <path fill-rule="evenodd" stroke="none" d="
      M30,410 H546 V872 H30 Z
      M72,846 V510 Q72,472 111,446 Q150,472 150,510 V846 Z
      M202,846 V520 Q202,468 288,430 Q374,468 374,520 V846 Z
      M426,846 V510 Q426,472 465,446 Q504,472 504,510 V846 Z"/>
    <!-- bottom bar -->
    <rect x="8" y="880" width="560" height="50" rx="25" stroke="none"/>
    <!-- base: outer and inner curved legs meeting at the centre -->
    <g fill="none" stroke-width="${S}">
      <path d="M58,936 C74,1010 150,1058 288,1078"/>
      <path d="M518,936 C502,1010 426,1058 288,1078"/>
      <path d="M181,944 C190,1004 226,1050 288,1074"/>
      <path d="M395,944 C386,1004 350,1050 288,1074"/>
    </g>
    <!-- base plate -->
    <path stroke="none" d="M140,1078 H436 L548,1094 Q566,1097 562,1106 Q558,1114 544,1114 H32 Q18,1114 14,1106 Q10,1097 28,1094 Z"/>
  </g>
</svg>`;
};

(async () => {
  // In-app brand mark.
  const outLantern = path.join(ROOT, 'src', 'assets', 'brand', 'lantern.png');
  fs.mkdirSync(path.dirname(outLantern), { recursive: true });
  const cut = await iconLantern();
  const meta = await sharp(cut).metadata();
  const w = Math.round((LANTERN_H * meta.width) / meta.height);
  await sharp(cut).resize(w, LANTERN_H, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toFile(outLantern);
  console.log('wrote', path.relative(ROOT, outLantern), `${w}x${LANTERN_H}`);

  // Android notification small icon. Expo derives every density from this one
  // file, so it is written large; it must be pure white on transparent.
  const outNotif = path.join(ROOT, 'assets', 'notification-icon.png');
  await sharp(Buffer.from(notificationSvg(512))).png().toFile(outNotif);
  const { data, info } = await sharp(outNotif).raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < info.width * info.height; i++) {
    const [r, g, b, a] = [0, 1, 2, 3].map((k) => data[i * info.channels + k]);
    if (a > 0 && (r < 250 || g < 250 || b < 250)) throw new Error(`notification icon has a non-white pixel at ${i}`);
  }
  console.log('wrote', path.relative(ROOT, outNotif), '512x512 (white on transparent)');
})().catch((e) => { console.error(e); process.exit(1); });
