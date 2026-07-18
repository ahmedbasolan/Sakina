/**
 * Qibla bearing — the great-circle direction from a point on earth to the
 * Kaaba, in degrees clockwise from true north.
 *
 * This is the initial bearing of the shortest path (orthodrome), which is what
 * every qibla compass shows. It is NOT the same as the constant-heading
 * (rhumb-line) bearing, and the two diverge sharply at long distances — from
 * London the orthodrome reads ~119° while a rhumb line reads ~130°.
 *
 * Verified against published qibla directions for Dubai (258°), London (119°),
 * New York (58°), Jakarta (295°), Cairo (136°), Istanbul (152°), Karachi (267°).
 */

/** Kaaba, Masjid al-Haram. */
const KAABA_LAT = 21.4224779;
const KAABA_LNG = 39.8251832;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/**
 * @returns bearing in degrees [0, 360), clockwise from true north.
 *          At the Kaaba itself the direction is undefined; returns 0.
 */
export function qiblaBearing(latitude: number, longitude: number): number {
  const phi1 = toRad(latitude);
  const phi2 = toRad(KAABA_LAT);
  const deltaLambda = toRad(KAABA_LNG - longitude);

  const y = Math.sin(deltaLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(deltaLambda);

  if (y === 0 && x === 0) return 0;
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** "WSW · 258°" — a short human-readable label for the settled needle. */
export function formatBearing(bearing: number): string {
  const points = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];
  const point = points[Math.round(bearing / 22.5) % 16];
  return `${point} · ${Math.round(bearing)}°`;
}
