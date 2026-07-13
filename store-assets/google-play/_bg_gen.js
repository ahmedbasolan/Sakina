// Faithful reproduction of the app's real background layers for a clean,
// text-free Play Store background template:
//   - Colors.celestialWash gradient (src/theme/DesignSystem.ts)
//   - AnimatedMandala's 12-fold star-polygon lattice (src/components/AnimatedMandala.tsx)
//   - TwinklingStar dots (src/components/TwinklingStar.tsx), frozen mid-twinkle
const fs = require('fs');
const path = require('path');

const W = 1080, H = 1920;
const GOLD = '#D4AF37';

// ---- exact port of generateStarWeb() from AnimatedMandala.tsx ----
function generateStarWeb(points, step, radius, cx, cy, phase = -Math.PI / 2) {
  const seg = [];
  for (let i = 0; i < points; i++) {
    const a1 = (i * Math.PI * 2) / points + phase;
    const a2 = ((i + step) * Math.PI * 2) / points + phase;
    seg.push(
      `M ${(cx + radius * Math.cos(a1)).toFixed(2)},${(cy + radius * Math.sin(a1)).toFixed(2)} L ${(cx + radius * Math.cos(a2)).toFixed(2)},${(cy + radius * Math.sin(a2)).toFixed(2)}`,
    );
  }
  return seg.join(' ');
}

// AnimatedMandala's own viewBox is 0..100 with CENTER=50, OUTER_R=48 (CENTER*0.96),
// then the whole thing scales to `size`. Reproduce that scaling directly at our
// target pixel size instead of nesting a second viewBox.
function buildMandala(size, cx, cy, opacity) {
  const VB = 100;
  const CENTER = VB / 2;
  const OUTER_R = CENTER * 0.96;
  const scale = size / VB;
  const maxStep = Math.floor(12 / 2); // 6
  const steps = [];
  for (let s = 3; s <= maxStep - 1; s++) steps.push(s); // [3,4,5] — full lattice, matches default (no webLayers cap)

  const localCx = CENTER, localCy = CENTER;
  const webs = steps.map((step) => ({
    d: generateStarWeb(12, step, OUTER_R, localCx, localCy),
    w: 0.16,
    o: step === maxStep - 1 ? 0.34 : 0.24,
  }));

  const parts = [];
  parts.push(`<g transform="translate(${cx - size / 2},${cy - size / 2}) scale(${scale})" opacity="${opacity}" fill="none" stroke="${GOLD}" stroke-linejoin="round" stroke-linecap="round">`);
  parts.push(`<circle cx="${localCx}" cy="${localCy}" r="${OUTER_R}" stroke-width="0.3" opacity="0.5"/>`);
  for (const web of webs) {
    parts.push(`<path d="${web.d}" stroke-width="${web.w}" opacity="${web.o}"/>`);
  }
  parts.push(`<circle cx="${localCx}" cy="${localCy}" r="${OUTER_R * 0.5}" stroke-width="0.14" opacity="0.2"/>`);
  parts.push(`<circle cx="${localCx}" cy="${localCy}" r="${OUTER_R * 0.18}" stroke-width="0.3" opacity="0.5"/>`);
  parts.push('</g>');
  return parts.join('');
}

// ---- twinkling stars, scattered across the full canvas, frozen mid-twinkle ----
// TwinklingStar animates opacity 0.2 <-> 1 (avg ~0.5-0.6); size 1.5-2.5 in the app's
// pt-based screens. Scaled up here since this canvas is a much larger pixel canvas.
function buildStars(seedPositions) {
  return seedPositions
    .map(({ x, y, size, o }) => `<circle cx="${x}" cy="${y}" r="${size}" fill="${GOLD}" fill-opacity="${o}"/>`)
    .join('\n');
}

const STARS = [
  { x: 0.08, y: 0.03, size: 4, o: 0.8 },
  { x: 0.88, y: 0.05, size: 3, o: 0.55 },
  { x: 0.22, y: 0.09, size: 3.5, o: 0.7 },
  { x: 0.72, y: 0.07, size: 3, o: 0.5 },
  { x: 0.5, y: 0.02, size: 3, o: 0.6 },
  { x: 0.05, y: 0.15, size: 3, o: 0.45 },
  { x: 0.95, y: 0.14, size: 3.5, o: 0.65 },
  { x: 0.35, y: 0.18, size: 2.5, o: 0.4 },
  { x: 0.65, y: 0.2, size: 3, o: 0.55 },
  { x: 0.15, y: 0.28, size: 3, o: 0.5 },
  { x: 0.85, y: 0.3, size: 2.5, o: 0.45 },
  { x: 0.45, y: 0.35, size: 3, o: 0.6 },
  { x: 0.05, y: 0.45, size: 2.5, o: 0.4 },
  { x: 0.92, y: 0.48, size: 3, o: 0.5 },
  { x: 0.25, y: 0.55, size: 2.5, o: 0.4 },
  { x: 0.7, y: 0.6, size: 3, o: 0.55 },
  { x: 0.1, y: 0.68, size: 2.5, o: 0.4 },
  { x: 0.88, y: 0.72, size: 3, o: 0.5 },
  { x: 0.4, y: 0.78, size: 2.5, o: 0.4 },
  { x: 0.6, y: 0.85, size: 2.5, o: 0.4 },
  { x: 0.18, y: 0.9, size: 3, o: 0.45 },
  { x: 0.8, y: 0.95, size: 2.5, o: 0.4 },
].map((s) => ({ x: s.x * W, y: s.y * H, size: s.size, o: s.o }));

const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img">
<title>Sakina brand background</title>
<desc>Celestial Night background — steel-blue gradient, twinkling stars, and the app's real 12-fold gold mandala lattice. No text or UI, ready for manual composition.</desc>
<defs>
  <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#07111E"/>
    <stop offset="0.5" stop-color="#0C1A2E"/>
    <stop offset="1" stop-color="#0F1F30"/>
  </linearGradient>
</defs>
<rect x="0" y="0" width="${W}" height="${H}" fill="url(#bgGrad)"/>
${buildStars(STARS)}
${buildMandala(760, W / 2, H * 0.42, 0.14)}
</svg>
`;

fs.writeFileSync(path.join(__dirname, '06-background-only.svg'), svg);
console.log('wrote 06-background-only.svg');
