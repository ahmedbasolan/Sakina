import { GuidanceExperience, PracticeStepData } from '../types';

export type LayerKind = 'verse' | 'context' | 'practice' | 'reflection';

/**
 * Parse the JSON-serialized practiceSteps string on ContentAngle.
 * Returns [] on null/undefined/invalid JSON — config builder degrades gracefully.
 */
export function parsePracticeSteps(raw: string | undefined | null): PracticeStepData[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PracticeStepData[]) : [];
  } catch {
    return [];
  }
}

/**
 * Derive the layer sequence for a given experience. Layers are included only
 * when their content is present — no empty screens, no filler.
 */
export function buildLayerConfig(experience: GuidanceExperience): LayerKind[] {
  const layers: LayerKind[] = ['verse'];
  if (experience.angle.contextBlocks && experience.angle.contextBlocks.length > 0) {
    layers.push('context');
  }
  if (parsePracticeSteps(experience.angle.practiceSteps).length > 0) {
    layers.push('practice');
  }
  if (experience.angle.reflection) {
    layers.push('reflection');
  }
  return layers;
}

/**
 * User-facing label for the layer that comes after the current one.
 * Returned as "Tafsir" / "Practice" / "Reflect". Undefined when there is no next layer.
 */
const LAYER_LABEL: Record<LayerKind, string> = {
  verse: 'Verse',
  context: 'Tafsir',
  practice: 'Practice',
  reflection: 'Reflect',
};

export function nextLayerLabelFor(
  layers: readonly LayerKind[],
  currentIndex: number,
): string | undefined {
  const next = layers[currentIndex + 1];
  return next ? LAYER_LABEL[next] : undefined;
}
