# Sacred Journeys — Content & Length Spec

Source of truth for journey **duration**, **tone**, and **phasing**. This is a
writing brief: most paths are still empty `dailySteps: []` shells in
[`src/data/staticPaths.ts`](../src/data/staticPaths.ts), so these are targets to
author against, not finished content.

## Principles

1. **7 days is the minimum, and the default.** Low attention spans make 14 feel
   long. A complete transformation arc fits in 7 (Salah Transformation proves it).
   Go longer when the subject's severity needs it (confirmed by Ahmed 2026-10-04):
   a heavier subject earns more days; a lighter one stays at 7. The tables below
   are targets for the current stubs, not a ceiling.
2. **14 days only for a genuine multi-stage arc** — where day 8 is new
   territory, not "more verses." Sabr, tawbah, and decision journeys qualify.
3. **Keep 21–90 only where the duration *is* the therapy** (habit rewiring,
   recovery, fundamentals). Never frame these as "Day X of 90" — chunk into
   phases so the horizon stays short.

## Tone

Every path carries a `tone` that shapes the immersive step screen:

| Tone | Feel | Animation | Pressure | Language |
| --- | --- | --- | --- | --- |
| **refuge** | calm sanctuary | slow reveal, cooler palette | none — no streaks | "you showed up today" |
| **momentum** | forward drive | brighter accent, celebration | streaks, progress | "Day 3 — keep going" |

Default derives from `theme`: Sad/grief → refuge, Hopeful/habit → momentum.
`tone` overrides where the default is wrong.

---

## Tier 1 — 7 days (default)

| Path | Current | Target | Tone | Rationale |
| --- | --- | --- | --- | --- |
| Salah Transformation | 7 | **7** | momentum | Complete; one prayer-state skill per day toward khushu. Don't touch. |
| Screen Detox | 7 | **7** | momentum | Habit reset; "7-day challenge" framing is the motivator. |
| Suicidal Thoughts → Hope | 7 | **7** | refuge | Emergency anchor. Gentle, no streaks, no "missed a day." |
| Death Awareness | 7 | **7** | refuge | Contemplative (Zuhd); short reflective arc, not a grind. |
| Rizq Revolution | 14 | **7** | momentum | Padded — Day 4 ≈ Day 9. Compress to a tight 7. (Only real content edit.) |
| Prayer Leadership | 14 | **7** | momentum | Confidence/skill-building; short and galvanizing. |
| Leaving Haram Job | 14 | **7** | momentum | Courage + decision; a focused week, not a month of limbo. |
| Anxiety → Tawakkul\* | — | **7** | refuge | Referenced in code, undefined. Author as calming 7. |
| Grateful Heart\* | — | **7** | momentum | Referenced, undefined. Uplifting daily gratitude. |

## Tier 2 — 14 days (multi-stage arc)

| Path | Current | Target | Tone | Rationale |
| --- | --- | --- | --- | --- |
| Grief & Loss | 14 | **14** | refuge | Sabr can't be rushed; grief unfolds in stages. |
| Tawbah Intensive | 10 | **14** | refuge | Stages: recognition → remorse → resolve → repair. |
| Forced Marriage | 14 | **14** | momentum | Empowerment: rights → scripts → escalation handling. |
| Haram Relationships (exit) | 14 | **14** | refuge | Grief of leaving + tawbah; emotionally heavy. |
| Wrong Marriage | 30 | **14** | refuge | 30 days of limbo for a decision framework. Compress. |
| Depression vs Low Iman | 21 | **14** | refuge | Low-energy user; 21 daunting, 14 reachable. |
| Marriage Seeker | 21 | **14** | momentum | Character prep; aspirational, forward-looking. |
| Healing from Toxic Family | 21 | **14** | refuge | Boundaries + birr al-walidayn; emotionally taxing. |
| Living in Two Worlds | 21 | **14** | momentum | Identity integration; constructive. |
| Career Choice | 21 | **14** | momentum | Direction-finding; momentum suits decision energy. |

## Tier 3 — Keep long, phase-chunk the UI

Duration *is* the therapy. Fix isn't shortening — it's framing the horizon as
the current phase via `phases`.

| Path | Length | Tone | Phases | Rationale |
| --- | --- | --- | --- | --- |
| Addiction Recovery | 30 | momentum | 3 × 10-day | Rewiring needs runway; weekly wins sustain it. |
| Quran Connection | 30 | momentum | 4 weekly | Building a daily reading habit — 30 days is the point. |
| Ramadan Reset | 30 | momentum | 3 × *ashar* (the three tens) | Fixed to the month; chunk by Ramadan's own thirds. |
| Convert Journey (bundle) | 60 | momentum | by module | "Module 2: Salah" beats "Day 23." |
| Breaking Free (bundle) | 90 | momentum + refuge messaging | 3 × 30-day stages | Rewire protocol; shame-free, soft language even with streaks. |

\* *Anxiety → Tawakkul, Grateful Heart, and Guilt → Tawbah appear in the
icon/color map in [`PathsScreen.tsx`](../src/screens/PathsScreen.tsx) but have no
entry in `staticPaths.ts`. Reconcile so the list doesn't reference ghosts.*

---

## Structural changes (done)

- `SpiritualPath.tone?: PathTone` and `SpiritualPath.phases?: PathPhase[]` added
  to [`src/types/index.ts`](../src/types/index.ts).
- Durations + tone set across `staticPaths.ts` per the tables above.

## Open follow-ups

- Compress Rizq Revolution content 14 → 7 (merge overlapping days).
- Author the empty Tier-1/Tier-2 paths to their target lengths.
- Wire `tone` into `ImmersiveBackground` / `PathTopBar` / step layers.
- Wire `phases` into `PathDetailScreen` + the step top bar for Tier-3.
- Define the three ghost paths or remove them from the visual map.
