import * as fs from 'fs';
import * as path from 'path';
import { buildPush } from '../../../../supabase/functions/_shared/apnsPayload';
import type { ScheduledPrayer } from '../../../../supabase/functions/_shared/liveActivityPlan';

const NOW = Date.UTC(2026, 9, 29, 15, 40) / 1000; // Asr has just arrived
const MAGHRIB: ScheduledPrayer = { name: 'Maghrib', at: Date.UTC(2026, 9, 29, 18, 20) / 1000 };
const ASR: ScheduledPrayer = { name: 'Asr', at: NOW };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Aps = Record<string, any>;
const aps = (p: { body: object }): Aps => (p.body as { aps: Aps }).aps;

const start = buildPush({ kind: 'start', next: MAGHRIB }, NOW);
const update = buildPush({ kind: 'update', next: MAGHRIB }, NOW);
const end = buildPush({ kind: 'end' }, NOW, ASR);

// The fields Swift decodes, read out of the source file so a rename on either side fails here.
function swiftVars(structName: string): string[] {
  const file = path.join(__dirname, '../../../../targets/live-activity/SakinaPrayerAttributes.swift');
  const src = fs.readFileSync(file, 'utf8');
  const open = src.indexOf(`struct ${structName}`);
  expect(open).toBeGreaterThanOrEqual(0);
  const bodyStart = src.indexOf('{', open) + 1;
  let depth = 1;
  let i = bodyStart;
  while (depth > 0) {
    if (src[i] === '{') depth++;
    if (src[i] === '}') depth--;
    i++;
  }
  // Only this struct's own members: drop nested braces' contents.
  let own = '';
  depth = 0;
  for (const ch of src.slice(bodyStart, i - 1)) {
    if (ch === '{') depth++;
    if (depth === 0) own += ch;
    if (ch === '}') depth--;
  }
  return [...own.matchAll(/\bvar\s+(\w+)\s*:/g)].map((m) => m[1]).sort();
}

describe('buildPush', () => {
  it('start carries an alert without sound', () => {
    expect(aps(start).event).toBe('start');
    expect(aps(start).alert).toEqual({ title: 'Sakina', body: 'Counting down to Maghrib' });
    expect(aps(start).alert).not.toHaveProperty('sound');
    expect(aps(start)).not.toHaveProperty('sound');
  });

  it('update and end carry no alert', () => {
    expect(aps(update).event).toBe('update');
    expect(aps(end).event).toBe('end');
    expect(aps(update)).not.toHaveProperty('alert');
    expect(aps(end)).not.toHaveProperty('alert');
  });

  it('prayerEpoch is epoch seconds', () => {
    const epoch = aps(start)['content-state'].prayerEpoch;
    expect(epoch).toBe(MAGHRIB.at);
    expect(Number.isInteger(epoch)).toBe(true);
    expect(epoch).toBeLessThan(1e11); // milliseconds would be ~1.8e12
    expect(aps(update)['content-state']).toEqual({ prayerName: 'Maghrib', prayerEpoch: MAGHRIB.at });
  });

  it('topic is the bundle id push-type topic', () => {
    for (const p of [start, update, end]) {
      expect(p.headers['apns-topic']).toBe('com.lelahmed.sakina.push-type.liveactivity');
      expect(p.headers['apns-push-type']).toBe('liveactivity');
    }
  });

  it('stale-date is the next prayer plus 15 minutes', () => {
    expect(aps(update)['stale-date']).toBe(MAGHRIB.at + 900);
  });

  it('end sets dismissal-date to now', () => {
    expect(aps(end)['dismissal-date']).toBe(NOW);
  });

  it('content-state keys exactly match the Swift ContentState', () => {
    const swift = swiftVars('ContentState');
    expect(swift).toEqual(['prayerEpoch', 'prayerName']);
    for (const p of [start, update, end]) {
      expect(Object.keys(aps(p)['content-state']).sort()).toEqual(swift);
    }
  });

  it('start names the attributes type and its version, matching Swift', () => {
    expect(aps(start)['attributes-type']).toBe('SakinaPrayerAttributes');
    expect(aps(start).attributes).toEqual({ version: 1 });
    expect(Object.keys(aps(start).attributes).sort()).toEqual(swiftVars('SakinaPrayerAttributes'));
  });

  it('start goes to the push-to-start token at priority 10; update and end to the activity token at 5', () => {
    expect(start.tokenKind).toBe('pushToStart');
    expect(start.headers['apns-priority']).toBe('10');
    expect(update.tokenKind).toBe('activity');
    expect(update.headers['apns-priority']).toBe('5');
    expect(end.tokenKind).toBe('activity');
    expect(end.headers['apns-priority']).toBe('5');
  });

  it('timestamp is now, in seconds', () => {
    for (const p of [start, update, end]) expect(aps(p).timestamp).toBe(NOW);
  });

  it('end carries the final content-state so the system can decode it', () => {
    expect(aps(end)['content-state']).toEqual({ prayerName: 'Asr', prayerEpoch: ASR.at });
  });

  it('end without a known final prayer still carries a decodable content-state', () => {
    const bare = aps(buildPush({ kind: 'end' }, NOW));
    expect(typeof bare['content-state'].prayerName).toBe('string');
    expect(bare['content-state'].prayerEpoch).toBe(NOW);
  });

  it('start asks for an update token (input-push-token: 1)', () => {
    expect(aps(start)['input-push-token']).toBe(1);
    expect(aps(update)).not.toHaveProperty('input-push-token');
    expect(aps(end)).not.toHaveProperty('input-push-token');
  });

  it('only start carries attributes, and only update carries a stale-date', () => {
    expect(aps(update)).not.toHaveProperty('attributes');
    expect(aps(end)).not.toHaveProperty('attributes');
    expect(aps(start)).not.toHaveProperty('stale-date');
    expect(aps(end)).not.toHaveProperty('stale-date');
    expect(aps(start)).not.toHaveProperty('dismissal-date');
    expect(aps(update)).not.toHaveProperty('dismissal-date');
  });
});
