// The lantern from the app icon (assets/new-icon.png, 1254 px), cut out of its
// royal-blue ground so it can hang in any scene and still be the icon's lantern.
// Used by scripts/build-lantern-assets.js (the in-app brand mark and the Android
// notification icon) and store-assets/app-store/_compose-creative.js.
//
// How: the icon is gold and cream on blue, so "how much more red than blue",
// with brightness as a second route in, is a clean key — gold and the cream
// windows score high, the ground scores low. The key also catches the icon's
// loose stars, the mosque arches at the sides and the two curled flourishes
// beside the body (dropped on purpose: off the icon's arches they read as
// arms). So only connected shapes inside the body's column are kept, and edge
// pixels are un-mixed from the blue so no blue fringe rides along onto navy.
const sharp = require('sharp');
const path = require('path');

const SRC = path.join(__dirname, '..', '..', 'assets', 'new-icon.png');

// The lantern body's column in the icon, in source px: the widest parts are
// the two horizontal bars, which span x ≈ 343–903.
const CROP = { left: 336, top: 44, width: 576, height: 1124 };
const MIN_AREA = 1500; // the largest star with its glow is well under this

async function source() {
  const { data, info } = await sharp(SRC).removeAlpha().extract(CROP).raw().toBuffer({ resolveWithObject: true });
  return { data, W: info.width, H: info.height };
}

// Connected components of `solid`, keeping those of at least `minArea` whose
// centroid passes `accept(cx, cy, area)`.
function keepComponents(solid, W, H, minArea, accept) {
  const N = W * H;
  const seen = new Uint8Array(N);
  const keep = new Uint8Array(N);
  const stack = new Int32Array(N);
  for (let s = 0; s < N; s++) {
    if (seen[s] || !solid[s]) continue;
    let sp = 0, area = 0, sx = 0, sy = 0;
    const members = [];
    stack[sp++] = s; seen[s] = 1;
    while (sp) {
      const p = stack[--sp];
      members.push(p); area++;
      const x = p % W, y = (p / W) | 0;
      sx += x; sy += y;
      for (const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) {
        if (q >= 0 && !seen[q] && solid[q]) { seen[q] = 1; stack[sp++] = q; }
      }
    }
    if (area >= minArea && accept(sx / area, sy / area, area)) for (const p of members) keep[p] = 1;
  }
  return keep;
}

function dilate(mask, W, H, R) {
  const out = new Uint8Array(W * H);
  const r2 = R * R;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) continue;
      for (let dy = -R; dy <= R; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= H) continue;
        for (let dx = -R; dx <= R; dx++) {
          const xx = x + dx; if (xx < 0 || xx >= W || dx * dx + dy * dy > r2) continue;
          out[yy * W + xx] = 1;
        }
      }
    }
  }
  return out;
}

// Full-colour lantern, RGBA, CROP-sized.
async function iconLantern() {
  const { data, W, H } = await source();
  const N = W * H;

  // The ground colour, sampled from the inside of the dome where nothing else is.
  const bg = [0, 1, 2].map((k) => {
    let t = 0, n = 0;
    for (let y = 230; y < 260; y++) for (let x = 272; x < 302; x++) { t += data[(y * W + x) * 3 + k]; n++; }
    return t / n;
  });

  // Brightness is the second route in: the white-hot centre of the middle
  // window has R ≈ B, so on R - B alone it keyed half-transparent and grey.
  const key = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    key[i] = Math.min(1, Math.max(0, (r - b + 70) / 110, ((r + g + b) / 3 - 130) / 60));
  }

  const solid = key.map((k) => (k >= 0.4 ? 1 : 0));
  // Body column only: the flourishes hug the crop's side edges, so a shape
  // whose centroid sits within 40 px of either edge is one of them (or an arch
  // sliver) and goes.
  const keep = keepComponents(solid, W, H, MIN_AREA, (cx) => cx > 40 && cx < W - 40);
  // Grow by 3 px so the anti-aliased rim (key < 0.4) comes along.
  const grown = dilate(keep, W, H, 3);

  // The window body's outer posts run x = 30–544. The icon's glow spills past
  // the right post at the window band and keys as a dark smudge stuck to the
  // frame (so the component filter keeps it); clip the body rows to the posts.
  const inBody = (x, y) => y < 400 || y > 878 || (x >= 27 && x <= 547);

  // Un-mix edge pixels from the blue ground: P = a*C + (1-a)*BG.
  const out = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    const a = grown[i] && inBody(i % W, (i / W) | 0) ? key[i] : 0;
    for (let k = 0; k < 3; k++) {
      const p = data[i * 3 + k];
      const c = a > 0.02 ? (p - (1 - a) * bg[k]) / a : p;
      out[i * 4 + k] = Math.max(0, Math.min(255, Math.round(c)));
    }
    out[i * 4 + 3] = Math.round(a * 255);
  }
  return sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
}

// White silhouette of the gold frame alone, for Android's status bar, which
// draws only a small icon's alpha. The cream windows and the calligraphy on
// them are left out, so the windows read as openings in the cage; the frame
// is thickened by `grow` source px so its bars survive being drawn ~80 px tall.
async function iconLanternFrame({ grow = 9 } = {}) {
  const { data, W, H } = await source();
  const N = W * H;
  const gold = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    // Gold: warm and saturated. Cream (window glass) has a high blue channel.
    gold[i] = r - b > 90 && b < 120 && r > 150 ? 1 : 0;
  }
  // Calligraphy strokes are gold too, but they are islands inside the windows;
  // the frame pieces are each far larger and reach outside the window band.
  const frame = keepComponents(gold, W, H, MIN_AREA, (cx, cy, area) =>
    cx > 40 && cx < W - 40 && !(area < 20000 && cy > 420 && cy < 860));
  const thick = dilate(frame, W, H, grow);
  const out = Buffer.alloc(N * 4, 255);
  for (let i = 0; i < N; i++) out[i * 4 + 3] = thick[i] ? 255 : 0;
  return sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
}

// Where the hanging ring's top sits in the cut-out, as a fraction of its
// height — for drawing a chain down to it.
const RING_TOP = 18 / CROP.height;
const ASPECT = CROP.width / CROP.height;

module.exports = { iconLantern, iconLanternFrame, RING_TOP, ASPECT };
