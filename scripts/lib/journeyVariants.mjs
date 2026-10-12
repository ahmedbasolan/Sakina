/**
 * Expands a path into every day sequence a user can actually see: the base
 * sequence, plus one per step-variant key (today only `womanLeading`). Mirrors
 * src/utils/leaderChoice.ts resolveStep — keep the two in step. Every
 * per-journey check (one verse / one hadith per journey, distinct du'a, mood,
 * roundtrip, claims) must run on each sequence, because a woman never sees the
 * base sequence and a man never sees hers.
 */
const LABELS = { womanLeading: ' (woman leading)' };
export function variantSequences(path) {
  const keys = new Set();
  for (const s of path.dailySteps || []) for (const k of Object.keys(s.variants || {})) keys.add(k);
  const out = [{ label: '', steps: path.dailySteps || [] }];
  for (const k of keys) {
    out.push({
      label: LABELS[k] || ` (${k})`,
      steps: path.dailySteps.map((s) => {
        const v = s.variants?.[k];
        if (!v) return s;
        return { ...s, angleId: v.angleId, hadithContentId: v.hadithContentId ?? s.hadithContentId,
          title: v.title ?? s.title, focus: v.focus ?? s.focus };
      }),
    });
  }
  return out;
}
