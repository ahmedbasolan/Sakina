// Shared iPhone renderer for every store screenshot set.
//
// The App Store, iPad and Google Play sets all show the same phone. They used
// to get it by cropping each other's finished PNGs at hardcoded coordinates,
// which meant the frame could not change without silently breaking the other
// two (the Play crop already cut both side-button columns off). Every set now
// asks this module for the device as vector, at its own scale.
//
// Geometry is iPhone 16 Pro, measured in points and converted with
// PT = screen px / 393. The one deliberate liberty is height: the device always
// bleeds off the bottom of the canvas, and it is made tall enough that its
// bottom corners never enter the frame. A true-height phone would start
// curving in just above the canvas edge on the iPhone canvas.
const sharp = require('sharp');

const BASE_SCREEN_W = 994;
const PT = BASE_SCREEN_W / 393;

// Bronze titanium: close to Apple's own Desert Titanium, pitched darker to sit
// in the night scene, and the same metal as the Sakina lantern.
// The lower tones are kept well above the navy on purpose: lit only from the
// top-left, the rim sank into the background along the lower sides and the
// silhouette stopped reading at thumbnail size, which is the whole job here.
const METAL = {
  lit: '#C9A76E',
  body: '#977A4C',
  mid: '#735C38',
  deep: '#504027',
  glint: '#FFF1CC',
  step: '#120E08',
};
const GLASS = '#030406';
const INK = '#F5EDE3';

function layout({ canvasW, canvasH, cx = canvasW / 2, y, scale }) {
  const s = scale;
  const screenW = Math.round(BASE_SCREEN_W * s);
  const bezel = Math.round(22 * s);
  const rim = Math.round(14 * s);
  const deviceW = screenW + 2 * (bezel + rim);
  const x0 = Math.round(cx - deviceW / 2);
  const y0 = Math.round(y);

  const screenX = x0 + rim + bezel;
  const screenY = y0 + rim + bezel;
  const screenRx = 55 * PT * s;
  const glassRx = screenRx + bezel;
  const deviceRx = glassRx + rim;

  const trueH = 852 * PT * s + 2 * (bezel + rim);
  const deviceH = Math.max(trueH, canvasH - y0 + deviceRx + 40 * s);

  const island = {
    w: 126 * PT * s,
    h: 37.33 * PT * s,
    top: screenY + 11 * PT * s,
  };
  island.x = screenX + (screenW - island.w) / 2;
  island.cy = island.top + island.h / 2;

  return {
    s, canvasW, canvasH, x0, y0, deviceW, deviceH, rim, bezel,
    screenX, screenY, screenW, screenRx, glassRx, deviceRx, trueH, island,
    statusH: Math.round(54 * PT * s),
    visibleScreenH: canvasH - screenY,
  };
}

const roundRect = (x, y, w, h, r) =>
  `M${x + r},${y} H${x + w - r} A${r},${r} 0 0 1 ${x + w},${y + r} V${y + h - r} A${r},${r} 0 0 1 ${x + w - r},${y + h} H${x + r} A${r},${r} 0 0 1 ${x},${y + h - r} V${y + r} A${r},${r} 0 0 1 ${x + r},${y} Z`;

// Everything that sits behind the screen image: shadow, buttons, metal, glass.
function underSvg(L) {
  const { s, x0, y0, deviceW, deviceH, deviceRx, rim, glassRx, trueH } = L;
  const gx = x0 + rim, gy = y0 + rim, gw = deviceW - 2 * rim, gh = deviceH - 2 * rim;
  const outer = roundRect(x0, y0, deviceW, deviceH, deviceRx);
  const glass = roundRect(gx, gy, gw, gh, glassRx);

  // Side buttons, placed on a TRUE-height phone so they sit where a real one's
  // do even though the rendered body is taller.
  const btn = (side, top, len) => {
    const w = 11 * s, out = 5 * s;
    const x = side === 'left' ? x0 - out : x0 + deviceW - w + out;
    const yTop = y0 + top * trueH;
    const h = len * trueH;
    return `<rect x="${x}" y="${yTop}" width="${w}" height="${h}" rx="${3 * s}" fill="url(#btn-${side})"/>
      <rect x="${x}" y="${yTop}" width="${w}" height="${1.5 * s}" rx="${0.75 * s}" fill="${METAL.glint}" opacity="0.35"/>`;
  };

  return `<svg width="${L.canvasW}" height="${L.canvasH}" viewBox="0 0 ${L.canvasW} ${L.canvasH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="far" x="-40%" y="-20%" width="180%" height="140%"><feGaussianBlur stdDeviation="${38 * s}"/></filter>
    <filter id="near" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${7 * s}"/></filter>

    <linearGradient id="rimLight" gradientUnits="userSpaceOnUse" x1="${x0}" y1="${y0}" x2="${x0 + deviceW * 0.55}" y2="${y0 + deviceW * 2}">
      <stop offset="0" stop-color="${METAL.lit}"/>
      <stop offset="0.28" stop-color="${METAL.body}"/>
      <stop offset="0.7" stop-color="${METAL.mid}"/>
      <stop offset="1" stop-color="${METAL.deep}"/>
    </linearGradient>
    <linearGradient id="rimRight" gradientUnits="userSpaceOnUse" x1="${x0}" y1="0" x2="${x0 + deviceW}" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity="0"/>
      <stop offset="0.7" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.2"/>
    </linearGradient>
    <radialGradient id="glintL" gradientUnits="userSpaceOnUse" cx="${x0 + deviceRx * 0.34}" cy="${y0 + deviceRx * 0.34}" r="${deviceRx * 0.95}">
      <stop offset="0" stop-color="${METAL.glint}" stop-opacity="0.9"/>
      <stop offset="0.35" stop-color="${METAL.glint}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${METAL.glint}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glintR" gradientUnits="userSpaceOnUse" cx="${x0 + deviceW - deviceRx * 0.34}" cy="${y0 + deviceRx * 0.34}" r="${deviceRx * 0.8}">
      <stop offset="0" stop-color="${METAL.glint}" stop-opacity="0.45"/>
      <stop offset="1" stop-color="${METAL.glint}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="chamfer" gradientUnits="userSpaceOnUse" x1="0" y1="${y0}" x2="0" y2="${y0 + trueH * 0.55}">
      <stop offset="0" stop-color="${METAL.glint}" stop-opacity="0.95"/>
      <stop offset="0.25" stop-color="${METAL.glint}" stop-opacity="0.4"/>
      <stop offset="1" stop-color="${METAL.glint}" stop-opacity="0.08"/>
    </linearGradient>
    <linearGradient id="btn-left" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${METAL.deep}"/>
      <stop offset="0.35" stop-color="${METAL.lit}"/>
      <stop offset="1" stop-color="${METAL.mid}"/>
    </linearGradient>
    <linearGradient id="btn-right" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${METAL.mid}"/>
      <stop offset="0.65" stop-color="${METAL.body}"/>
      <stop offset="1" stop-color="${METAL.deep}"/>
    </linearGradient>
    <clipPath id="ring"><path fill-rule="evenodd" d="${outer} ${glass}"/></clipPath>
  </defs>

  <path d="${roundRect(x0 + 6 * s, y0 + 46 * s, deviceW - 12 * s, deviceH, deviceRx)}" fill="#00040B" opacity="0.7" filter="url(#far)"/>
  <path d="${roundRect(x0, y0 + 8 * s, deviceW, deviceH, deviceRx)}" fill="#000000" opacity="0.55" filter="url(#near)"/>

  ${btn('left', 0.184, 0.055)}
  ${btn('left', 0.273, 0.102)}
  ${btn('left', 0.396, 0.102)}
  ${btn('right', 0.314, 0.157)}

  <path d="${outer}" fill="url(#rimLight)"/>
  <g clip-path="url(#ring)">
    <rect x="${x0}" y="${y0}" width="${deviceW}" height="${deviceH}" fill="url(#rimRight)"/>
    <rect x="${x0}" y="${y0}" width="${deviceW}" height="${deviceH}" fill="url(#glintL)"/>
    <rect x="${x0}" y="${y0}" width="${deviceW}" height="${deviceH}" fill="url(#glintR)"/>
  </g>
  <path d="${roundRect(x0 + 0.9 * s, y0 + 0.9 * s, deviceW - 1.8 * s, deviceH - 1.8 * s, deviceRx - 0.9 * s)}" fill="none" stroke="url(#chamfer)" stroke-width="${1.8 * s}"/>
  <path d="${glass}" fill="${GLASS}" stroke="${METAL.step}" stroke-width="${2.2 * s}"/>
</svg>`;
}

// Everything that sits over the screen image: the island and the status bar.
function overSvg(L) {
  const { s, screenX, screenW, island } = L;
  const cy = island.cy;
  const ink = `fill="${INK}"`;

  const leftEarCx = (screenX + island.x) / 2;
  const rightEarCx = (island.x + island.w + screenX + screenW) / 2;

  // Right cluster widths in iOS points: signal 17, gap 6, wifi 15.5, gap 6, battery 27.
  const u = PT * s;
  const clusterW = (17 + 6 + 15.5 + 6 + 27) * u;
  let cx = rightEarCx - clusterW / 2;

  const bars = [0.36, 0.56, 0.78, 1].map((f, i) => {
    const bw = 3 * u, gap = 1.65 * u, full = 11 * u;
    const h = full * f;
    return `<rect x="${cx + i * (bw + gap)}" y="${cy + full / 2 - h}" width="${bw}" height="${h}" rx="${0.8 * u}" ${ink}/>`;
  }).join('');
  cx += (17 + 6) * u;

  const wifiBase = cy + 5.4 * u;
  const wcx = cx + 7.75 * u;
  const arc = (r) => {
    const dx = r * Math.SQRT1_2, dy = r * Math.SQRT1_2;
    return `<path d="M${wcx - dx},${wifiBase - dy} A${r},${r} 0 0 1 ${wcx + dx},${wifiBase - dy}" fill="none" stroke="${INK}" stroke-width="${2.1 * u}" stroke-linecap="round"/>`;
  };
  const dot = 3.3 * u;
  const wifi = `${arc(9.6 * u)}${arc(5.9 * u)}
    <path d="M${wcx},${wifiBase} L${wcx - dot * Math.SQRT1_2},${wifiBase - dot * Math.SQRT1_2} A${dot},${dot} 0 0 1 ${wcx + dot * Math.SQRT1_2},${wifiBase - dot * Math.SQRT1_2} Z" ${ink}/>`;
  cx += (15.5 + 6) * u;

  const bw = 24.5 * u, bh = 12.5 * u, by = cy - bh / 2;
  const battery = `
    <rect x="${cx + 0.5 * u}" y="${by + 0.5 * u}" width="${bw - u}" height="${bh - u}" rx="${3.8 * u}" fill="none" stroke="${INK}" stroke-opacity="0.4" stroke-width="${u}"/>
    <rect x="${cx + 2 * u}" y="${by + 2 * u}" width="${bw - 4 * u}" height="${bh - 4 * u}" rx="${2.3 * u}" ${ink}/>
    <path d="M${cx + bw + 1 * u},${cy - 2.1 * u} a${1.4 * u},${1.4 * u} 0 0 1 ${1.4 * u},${1.4 * u} v${1.4 * u} a${1.4 * u},${1.4 * u} 0 0 1 -${1.4 * u},${1.4 * u} Z" ${ink} fill-opacity="0.4"/>`;

  const lensR = 5.6 * u;
  const lensCx = island.x + island.w - island.h / 2 - 1.5 * u;

  return `<svg width="${L.canvasW}" height="${L.canvasH}" viewBox="0 0 ${L.canvasW} ${L.canvasH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="lens" cx="0.38" cy="0.35" r="0.7">
      <stop offset="0" stop-color="#27324A"/>
      <stop offset="0.45" stop-color="#0D111B"/>
      <stop offset="1" stop-color="#05070B"/>
    </radialGradient>
  </defs>
  <rect x="${island.x}" y="${island.top}" width="${island.w}" height="${island.h}" rx="${island.h / 2}" fill="#000000"/>
  <circle cx="${lensCx}" cy="${cy}" r="${lensR}" fill="url(#lens)"/>
  <circle cx="${lensCx - lensR * 0.3}" cy="${cy - lensR * 0.32}" r="${lensR * 0.2}" fill="#6E86B8" opacity="0.35"/>

  <text x="${leftEarCx}" y="${cy + 6.1 * u}" text-anchor="middle" font-family="Segoe UI" font-weight="600" font-size="${17 * u}" letter-spacing="${-0.2 * u}" ${ink}>9:41</text>
  ${bars}
  ${wifi}
  ${battery}
</svg>`;
}

// The status band continues each COLUMN of the app's top edge upward, so the
// seam matches pixel for pixel across backgrounds that vary left to right (the
// Reflections mandala does). Per column: the median of the top rows, which
// drops an isolated star; then a WIDE horizontal box blur. At 8px the mandala's
// hairlines, crossing the top rows at an angle, were carried straight up into
// visible vertical streaks behind the clock; only the broad left-to-right
// colour should continue, not the linework.
const statusBand = async (buf, width, height) => {
  const ROWS = 16, R = Math.round(width * 0.04);
  const { data } = await sharp(buf).extract({ left: 0, top: 0, width, height: ROWS }).raw().toBuffer({ resolveWithObject: true });
  const col = new Float64Array(width * 3);
  const v = new Array(ROWS);
  for (let x = 0; x < width; x++) {
    for (let k = 0; k < 3; k++) {
      for (let r = 0; r < ROWS; r++) v[r] = data[(r * width + x) * 3 + k];
      v.sort((a, b) => a - b);
      col[x * 3 + k] = v[ROWS >> 1];
    }
  }
  const row = Buffer.alloc(width * 3);
  for (let x = 0; x < width; x++) {
    for (let k = 0; k < 3; k++) {
      let t = 0, n = 0;
      for (let d = -R; d <= R; d++) {
        const xx = Math.min(width - 1, Math.max(0, x + d));
        t += col[xx * 3 + k]; n++;
      }
      row[x * 3 + k] = Math.round(t / n);
    }
  }
  const band = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) row.copy(band, y * width * 3);
  return sharp(band, { raw: { width, height, channels: 3 } }).png().toBuffer();
};

const meanColour = async (buf, width, top, rows) => {
  const { data } = await sharp(buf).extract({ left: 0, top, width, height: rows }).raw().toBuffer({ resolveWithObject: true });
  const [r, g, b] = [0, 1, 2].map((k) => {
    let t = 0;
    for (let i = k; i < data.length; i += 3) t += data[i];
    return Math.round(t / (data.length / 3));
  });
  return { r, g, b };
};

// The app's own pixels, with an iOS status-bar band above them that continues
// whatever the app draws edge to edge (see statusBand) instead of stamping a
// fixed navy strip over it. Any room left below short content takes the mean of
// the BOTTOM rows — filling it with the top colour left a band under the tab bar.
async function screenLayer(L, screen) {
  let img = sharp(screen.src);
  const meta = await img.metadata();
  if (screen.crop) {
    img = img.extract({ left: 0, top: screen.crop.top, width: meta.width, height: screen.crop.bottom - screen.crop.top });
  }
  const srcH = screen.crop ? screen.crop.bottom - screen.crop.top : meta.height;
  const contentH = Math.round(srcH * (L.screenW / meta.width));
  const content = await img.resize(L.screenW, contentH).removeAlpha().png().toBuffer();

  const H = L.visibleScreenH;
  const room = H - L.statusH;
  const used = Math.min(contentH, room);

  const bottomColour = await meanColour(content, L.screenW, used - 8, 8);

  const body = await sharp(content).extract({ left: 0, top: 0, width: L.screenW, height: used }).png().toBuffer();
  const status = await statusBand(content, L.screenW, L.statusH);
  const flat = await sharp({ create: { width: L.screenW, height: H, channels: 3, background: bottomColour } })
    .composite([{ input: status, left: 0, top: 0 }, { input: body, left: 0, top: L.statusH }])
    .png()
    .toBuffer();

  const r = L.screenRx;
  const w = L.screenW;
  const maskSvg = `<svg width="${w}" height="${H}"><path d="M0,${H} V${r} A${r},${r} 0 0 1 ${r},0 H${w - r} A${r},${r} 0 0 1 ${w},${r} V${H} Z" fill="#fff"/></svg>`;
  const mask = await sharp(Buffer.from(maskSvg)).png().toBuffer();
  return sharp(flat).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

/**
 * Render the phone onto a transparent layer the size of the target canvas.
 * `y` is the device's top edge; `scale` is 1 for a 994 px screen.
 */
async function renderDevice({ canvasW, canvasH, cx, y, scale = 1, screen }) {
  const L = layout({ canvasW, canvasH, cx, y, scale });
  const [under, shot, over] = await Promise.all([
    sharp(Buffer.from(underSvg(L))).png().toBuffer(),
    screenLayer(L, screen),
    sharp(Buffer.from(overSvg(L))).png().toBuffer(),
  ]);
  return sharp({ create: { width: canvasW, height: canvasH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: under },
      { input: shot, left: L.screenX, top: L.screenY },
      { input: over },
    ])
    .png()
    .toBuffer();
}

module.exports = { renderDevice, layout };
