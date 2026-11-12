import { STATIC_SPIRITUAL_PATHS } from '../../data/staticPaths';
import { WIDGET_NAMED_PATH_IDS, WIDGET_SENSITIVE_PATH_IDS, isNamedOnWidget } from '../journeyPrivacy';

describe('journey privacy on the widget', () => {
  it('classifies every Journey exactly once', () => {
    for (const { id } of STATIC_SPIRITUAL_PATHS) {
      const named = WIDGET_NAMED_PATH_IDS.has(id);
      const sensitive = WIDGET_SENSITIVE_PATH_IDS.has(id);
      // The id rides along so a failure names the Journey that is unclassified
      // (or listed twice) instead of printing a bare `false`.
      expect([id, named !== sensitive]).toEqual([id, true]);
    }
  });

  it('lists no id that is not a Journey', () => {
    const ids = new Set(STATIC_SPIRITUAL_PATHS.map((p) => p.id));
    for (const id of [...WIDGET_NAMED_PATH_IDS, ...WIDGET_SENSITIVE_PATH_IDS]) {
      expect([id, ids.has(id)]).toEqual([id, true]);
    }
  });

  it.each([
    'path_hope_after_crisis',
    'path_tawbah_intensive',
    'path_marriage_seeker',
    'path_death_awareness',
  ])('%s is never named', (id) => {
    expect(isNamedOnWidget(id)).toBe(false);
  });

  it('names Trusting the Results', () => {
    expect(isNamedOnWidget('path_trusting_the_results')).toBe(true);
  });

  it('treats an unknown Journey as sensitive', () => {
    expect(isNamedOnWidget('path_added_next_year')).toBe(false);
  });
});
