/**
 * Drift checks between the files that must agree but live in two native
 * targets the compiler never sees together:
 *
 * - `SakinaPrayerAttributes.swift` exists twice (widget extension + this
 *   module). ActivityKit matches APNs `attributes-type` by type name and the
 *   two targets decode the same JSON, so the copies must be byte-identical.
 * - The App Group id and snapshot key are string literals in Swift, JSON in
 *   app.json, and JS — a typo in any one silently breaks the card.
 * - The font the widget asks for by name must be the PostScript name inside
 *   the TTF it bundles; a wrong name falls back to the system font silently.
 *
 * What this does NOT catch: anything about whether the Swift compiles, whether
 * the extension can actually read the App Group at render time, or how the
 * card looks. Those are only checked by a device build.
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '../../..');
const MODULE_DIR = path.join(ROOT, 'modules/sakina-live-activity');
const TARGET_DIR = path.join(ROOT, 'targets/live-activity');
const APP_GROUP = 'group.com.lelahmed.sakina';
const SNAPSHOT_KEY = 'sakina.liveActivity.snapshot.v1';

const read = (p: string) => fs.readFileSync(p, 'utf8');
const swiftFiles = (dir: string) =>
  fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.swift'))
    .map((f) => read(path.join(dir, f)))
    .join('\n');

/** PostScript name (name id 6, Windows/Unicode record) from a TTF's name table. */
function postScriptName(ttfPath: string): string | null {
  const b = fs.readFileSync(ttfPath);
  const numTables = b.readUInt16BE(4);
  let nameOff = -1;
  for (let i = 0; i < numTables; i++) {
    const r = 12 + i * 16;
    if (b.toString('ascii', r, r + 4) === 'name') nameOff = b.readUInt32BE(r + 8);
  }
  if (nameOff < 0) return null;
  const count = b.readUInt16BE(nameOff + 2);
  const strOff = nameOff + b.readUInt16BE(nameOff + 4);
  for (let i = 0; i < count; i++) {
    const r = nameOff + 6 + i * 12;
    const platform = b.readUInt16BE(r);
    const nameId = b.readUInt16BE(r + 6);
    if (nameId !== 6 || platform !== 3) continue;
    const len = b.readUInt16BE(r + 8);
    const off = b.readUInt16BE(r + 10);
    let s = '';
    for (let j = 0; j < len; j += 2) s += String.fromCharCode(b.readUInt16BE(strOff + off + j));
    return s;
  }
  return null;
}

describe('live activity native parity', () => {
  it('keeps the two SakinaPrayerAttributes.swift copies byte-identical', () => {
    const inTarget = fs.readFileSync(path.join(TARGET_DIR, 'SakinaPrayerAttributes.swift'));
    const inModule = fs.readFileSync(path.join(MODULE_DIR, 'ios/SakinaPrayerAttributes.swift'));
    expect(inModule.equals(inTarget)).toBe(true);

    const src = inTarget.toString('utf8');
    expect(src).toMatch(/struct SakinaPrayerAttributes: ActivityAttributes/);
    // The content-state JSON the server pushes: { prayerName, prayerEpoch }.
    expect(src).toMatch(/var prayerName: String/);
    expect(src).toMatch(/var prayerEpoch: Double/);
    expect(src).toMatch(/var version: Int/);
    // The main app deploys to iOS 15.1, so the type must be availability-gated.
    expect(src).toMatch(/@available\(iOS 17\.2, \*\)\s*struct SakinaPrayerAttributes/);
  });

  it('uses one App Group id and one snapshot key everywhere', () => {
    const app = JSON.parse(read(path.join(ROOT, 'app.json'))).expo;
    expect(app.ios.entitlements['com.apple.security.application-groups']).toEqual([APP_GROUP]);
    expect(app.ios.infoPlist.NSSupportsLiveActivities).toBe(true);
    expect(app.plugins).toContain('@bacons/apple-targets');

    for (const src of [swiftFiles(TARGET_DIR), swiftFiles(path.join(MODULE_DIR, 'ios'))]) {
      expect(src).toContain(`"${APP_GROUP}"`);
      expect(src).toContain(`"${SNAPSHOT_KEY}"`);
    }
  });

  it('registers the module and app-delegate classes that the Swift declares', () => {
    const config = JSON.parse(read(path.join(MODULE_DIR, 'expo-module.config.json')));
    const swift = swiftFiles(path.join(MODULE_DIR, 'ios'));
    for (const name of config.apple.modules) {
      expect(swift).toMatch(new RegExp(`public class ${name}: Module\\b`));
    }
    for (const name of config.apple.appDelegateSubscribers) {
      expect(swift).toMatch(new RegExp(`public class ${name}: ExpoAppDelegateSubscriber\\b`));
    }
    // JS looks the module up by the name the Swift definition registers.
    expect(swift).toContain('Name("SakinaLiveActivity")');
    expect(read(path.join(MODULE_DIR, 'index.ts'))).toContain("'SakinaLiveActivity'");
  });

  it('keeps every card font fixed-size so the 160 pt budget holds at any Dynamic Type size', () => {
    const swift = swiftFiles(TARGET_DIR);
    // Font.custom(_:size:) scales relative to .body; only fixedSize: does not.
    expect(swift).not.toMatch(/Font\.custom\([^)]*\bsize:/);
    // Text styles (.body, .caption, …) scale too; fixed .system(size:) does not.
    expect(swift).not.toMatch(
      /\.font\(\.(largeTitle|title|title2|title3|headline|subheadline|body|callout|footnote|caption|caption2)\b/,
    );
    expect(swift).toMatch(/\.dynamicTypeSize\(/);
  });

  it('never promises a tap target the card does not have', () => {
    // The whole card opens Prayer Times; there is no verse deep link (ruling R9).
    expect(read(path.join(TARGET_DIR, 'VerseView.swift'))).not.toMatch(/tap to/i);
  });

  it('asks SwiftUI for the PostScript name of the font the extension bundles', () => {
    const plist = read(path.join(TARGET_DIR, 'Info.plist'));
    const fonts = [...plist.matchAll(/<string>([^<]+\.ttf)<\/string>/g)].map((m) => m[1]);
    expect(fonts).toEqual(['AmiriQuran-Regular.ttf']);

    const ttf = path.join(TARGET_DIR, fonts[0]);
    const psName = postScriptName(ttf);
    expect(psName).toBe('AmiriQuran-Regular');
    expect(swiftFiles(TARGET_DIR)).toContain(`Font.custom("${psName}"`);
  });
});
