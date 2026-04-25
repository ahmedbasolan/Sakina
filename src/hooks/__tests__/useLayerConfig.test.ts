import { buildLayerConfig, parsePracticeSteps, nextLayerLabelFor } from '../useLayerConfig';
import type { GuidanceExperience } from '../../types';

function makeExperience(partial: Partial<GuidanceExperience['angle']>): GuidanceExperience {
  return {
    content: {
      id: 'test',
      type: 'Quran',
      primaryText: '',
      englishTranslation: '',
      source: '',
      whyThis: '',
      moods: ['Calm'],
    },
    angle: {
      id: 'a1',
      contentId: 'test',
      mood: 'Calm',
      angle: '',
      ...partial,
    },
  };
}

describe('buildLayerConfig', () => {
  it('returns only verse when no other content is present', () => {
    expect(buildLayerConfig(makeExperience({}))).toEqual(['verse']);
  });

  it('includes context when contextBlocks has entries', () => {
    const exp = makeExperience({
      contextBlocks: [{ kind: 'tafsir', text: 't', source: { label: 'T', url: 'https://x' } }],
    });
    expect(buildLayerConfig(exp)).toEqual(['verse', 'context']);
  });

  it('includes practice when practiceSteps parses to a non-empty array', () => {
    const exp = makeExperience({
      practiceSteps: JSON.stringify([{ type: 'mindset', icon: 'star', title: 't', instruction: 'i', source: 's', sourceType: 'quran_dua' }]),
    });
    expect(buildLayerConfig(exp)).toEqual(['verse', 'practice']);
  });

  it('includes reflection when reflection prompt is present', () => {
    expect(buildLayerConfig(makeExperience({ reflection: 'What does this mean to you?' }))).toEqual([
      'verse',
      'reflection',
    ]);
  });

  it('orders all layers correctly when all present', () => {
    const exp = makeExperience({
      contextBlocks: [{ kind: 'tafsir', text: 't', source: { label: 'T', url: 'https://x' } }],
      practiceSteps: JSON.stringify([{ type: 'mindset', icon: 'star', title: 't', instruction: 'i', source: 's', sourceType: 'quran_dua' }]),
      reflection: 'prompt',
    });
    expect(buildLayerConfig(exp)).toEqual(['verse', 'context', 'practice', 'reflection']);
  });
});

describe('parsePracticeSteps', () => {
  it('returns [] for undefined', () => {
    expect(parsePracticeSteps(undefined)).toEqual([]);
  });

  it('returns [] for invalid JSON', () => {
    expect(parsePracticeSteps('{not json}')).toEqual([]);
  });

  it('parses a valid JSON array', () => {
    const json = JSON.stringify([{ type: 'mindset' }]);
    expect(parsePracticeSteps(json)).toHaveLength(1);
  });
});

describe('nextLayerLabelFor', () => {
  it('returns the name of the layer after the current index', () => {
    const layers = ['verse', 'context', 'practice', 'reflection'] as const;
    expect(nextLayerLabelFor(layers, 0)).toBe('Tafsir');
    expect(nextLayerLabelFor(layers, 1)).toBe('Practice');
    expect(nextLayerLabelFor(layers, 2)).toBe('Reflect');
  });

  it('returns undefined on the final layer', () => {
    const layers = ['verse', 'context', 'practice', 'reflection'] as const;
    expect(nextLayerLabelFor(layers, 3)).toBeUndefined();
  });

  it('returns undefined when only verse is present', () => {
    expect(nextLayerLabelFor(['verse'], 0)).toBeUndefined();
  });
});
