import { qiblaBearing, formatBearing } from '../qibla';

/**
 * Expected bearings are published qibla directions for each city, cross-checked
 * against islamicfinder / qiblafinder. A 1.5° tolerance covers the small
 * differences between sources' Kaaba coordinates.
 */
describe('qiblaBearing', () => {
  const CITIES: [string, number, number, number][] = [
    ['Dubai', 25.2048, 55.2708, 258.2],
    ['London', 51.5074, -0.1278, 119.0],
    ['New York', 40.7128, -74.006, 58.5],
    ['Jakarta', -6.2088, 106.8456, 295.2],
    ['Cairo', 30.0444, 31.2357, 136.1],
    ['Istanbul', 41.0082, 28.9784, 151.6],
    ['Karachi', 24.8607, 67.0011, 267.7],
    ['Sydney', -33.8688, 151.2093, 277.5],
    // Published values for Cape Town range ~22.9°–23.4° depending on which
    // Kaaba coordinates the source uses; 23.4 matches the ones in qibla.ts.
    ['Cape Town', -33.9249, 18.4241, 23.4],
  ];

  it.each(CITIES)('points from %s toward the Kaaba', (_city, lat, lng, expected) => {
    expect(qiblaBearing(lat, lng)).toBeCloseTo(expected, 0);
  });

  it('always returns a bearing in [0, 360)', () => {
    for (let lat = -80; lat <= 80; lat += 20) {
      for (let lng = -180; lng <= 180; lng += 30) {
        const b = qiblaBearing(lat, lng);
        expect(b).toBeGreaterThanOrEqual(0);
        expect(b).toBeLessThan(360);
        expect(Number.isFinite(b)).toBe(true);
      }
    }
  });

  it('is due north from a point directly south of the Kaaba', () => {
    expect(qiblaBearing(0, 39.8251832)).toBeCloseTo(0, 1);
  });

  it('is due south from a point directly north of the Kaaba', () => {
    expect(qiblaBearing(40, 39.8251832)).toBeCloseTo(180, 1);
  });

  it('does not return NaN at the Kaaba itself', () => {
    expect(Number.isFinite(qiblaBearing(21.4224779, 39.8251832))).toBe(true);
  });

  it('handles the antipode without throwing', () => {
    expect(Number.isFinite(qiblaBearing(-21.4224779, -140.1748168))).toBe(true);
  });
});

describe('formatBearing', () => {
  it('names the compass point', () => {
    expect(formatBearing(258.2)).toBe('WSW · 258°');
    expect(formatBearing(0)).toBe('N · 0°');
    expect(formatBearing(90)).toBe('E · 90°');
  });

  it('wraps 360 back to north rather than indexing past the array', () => {
    expect(formatBearing(359.9)).toBe('N · 360°');
  });
});
