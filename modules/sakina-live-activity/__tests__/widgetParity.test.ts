/**
 * Drift checks between the Home Screen widget's TypeScript (which decides
 * everything and writes the snapshot) and its Swift (which only decodes and
 * draws). The two are never compiled together, so a renamed field, a new
 * state kind or a changed key would otherwise surface only on a phone, as a
 * widget stuck on its locked fallback.
 *
 * What this does NOT catch: whether the Swift compiles, whether WidgetKit
 * shows the entries at their times, whether text fits the square, or how any
 * of it looks. Those are only checked by a device build.
 */
import * as fs from 'fs';
import * as path from 'path';
import { LOCKED_STATE, WIDGET_COPY, WIDGET_URLS } from '../../../src/services/widget/widgetState';
import { WIDGET_SNAPSHOT_KEY } from '../../../src/services/widget/widgetTimeline';

const ROOT = path.resolve(__dirname, '../../..');
const TARGET_DIR = path.join(ROOT, 'targets/live-activity');
const MODULE_DIR = path.join(ROOT, 'modules/sakina-live-activity');
const read = (p: string) => fs.readFileSync(p, 'utf8');

const NEW_FILES = ['WidgetSnapshotStore.swift', 'SakinaPathWidget.swift', 'PathWidgetView.swift'];
const KINDS = ['locked', 'checkin', 'gentle', 'journey', 'verse', 'reflection'];
const FIELDS = ['kind', 'kicker', 'text', 'sub', 'dayLabel', 'title', 'day', 'of', 'arabic', 'english', 'ref', 'fallback', 'url'];

describe('home screen widget native parity', () => {
  it('reads the snapshot under the key the app writes', () => {
    expect(read(path.join(TARGET_DIR, 'WidgetSnapshotStore.swift'))).toContain(`"${WIDGET_SNAPSHOT_KEY}"`);
    expect(read(path.join(MODULE_DIR, 'ios/SharedStore.swift'))).toContain(`"${WIDGET_SNAPSHOT_KEY}"`);
  });

  it('reloads the widget kind the extension declares', () => {
    expect(read(path.join(TARGET_DIR, 'SakinaPathWidget.swift'))).toContain('kind: "SakinaPathWidget"');
    expect(read(path.join(MODULE_DIR, 'ios/SakinaLiveActivityModule.swift'))).toContain('"SakinaPathWidget"');
  });

  // Swift infers a multi-statement closure's type poorly; every other
  // multi-statement Function in this module declares its signature, and the
  // Swift is never compiled until an EAS build.
  it.each(['writeWidgetSnapshot', 'clearWidgetSnapshot'])('declares the closure signature of Function("%s")', (name) => {
    const module = read(path.join(MODULE_DIR, 'ios/SakinaLiveActivityModule.swift'));
    expect(module).toMatch(new RegExp(`Function\\("${name}"\\) \\{ \\([^)]*\\) -> Void in`));
  });

  it('is part of the extension bundle', () => {
    expect(read(path.join(TARGET_DIR, 'SakinaLiveActivity.swift'))).toMatch(/SakinaPathWidget\(\)/);
  });

  it.each(KINDS)('draws state kind %s', (kind) => {
    expect(read(path.join(TARGET_DIR, 'PathWidgetView.swift'))).toContain(`case "${kind}"`);
  });

  it.each(FIELDS)('decodes field %s', (field) => {
    expect(read(path.join(TARGET_DIR, 'WidgetSnapshotStore.swift'))).toMatch(new RegExp(`\\blet ${field}: `));
  });

  // The app never writes the reflection question (it can name the mood); the
  // widget must not grow a place to draw one.
  it('has no question field to draw', () => {
    expect(read(path.join(TARGET_DIR, 'WidgetSnapshotStore.swift'))).not.toMatch(/\blet question\b/);
    expect(read(path.join(TARGET_DIR, 'PathWidgetView.swift'))).not.toMatch(/state\.question/);
  });

  it('falls back to exactly the locked state the app writes', () => {
    const store = read(path.join(TARGET_DIR, 'WidgetSnapshotStore.swift'));
    expect(LOCKED_STATE).toMatchObject({ kicker: WIDGET_COPY.lockedKicker, text: WIDGET_COPY.lockedText, url: WIDGET_URLS.pro });
    for (const s of [WIDGET_COPY.lockedKicker, WIDGET_COPY.lockedText, WIDGET_URLS.pro]) {
      expect(store).toContain(`"${s}"`);
    }
  });

  it('previews the gallery with the check-in copy', () => {
    const store = read(path.join(TARGET_DIR, 'WidgetSnapshotStore.swift'));
    expect(store).toContain(`"${WIDGET_COPY.checkin}"`);
    expect(store).toContain(`"${WIDGET_COPY.checkinSub}"`);
  });

  it.each(NEW_FILES)('%s never clips text, scales it away, or draws the lantern', (file) => {
    const src = read(path.join(TARGET_DIR, file));
    expect(src.replace(/lineLimit\(nil\)/g, '')).not.toMatch(/lineLimit\(/);
    expect(src).not.toMatch(/truncationMode|minimumScaleFactor/);
    expect(src).not.toMatch(/Image\("lantern"\)|LanternMark|CardLantern/);
  });

  it('hides the personal lines when the phone is locked', () => {
    expect(read(path.join(TARGET_DIR, 'PathWidgetView.swift'))).toMatch(/\.privacySensitive\(\)/);
  });
});
