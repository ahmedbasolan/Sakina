# "For Your Heart" — User-Focused Voice + Reflection Writing

Date: 2026-07-16
Status: Approved for planning

## Problem

On the Guidance screen's Context layer, the "For Your Heart" card
(`ContextLayer.tsx:236-254`) currently renders `experience.angle.angle` —
tafsir explanation frequently mixed with Prophetic quotes and narrative
("The Prophet ﷺ said on the day of Uhud..."). That's redundant with the
Context layer's own "Understand"/"Matters" sections just above it, which
already carry Prophet/companion stories by design. "For Your Heart" has no
distinct job right now — it's a second helping of the same voice.

Separately, the data already contains a per-verse reflection question
(`ContentAngle.reflection`, e.g. *"If the Creator is your Helper, how big
is your obstacle really?"*) and a full save pipeline
(`useGuidanceLogic`'s `reflectionText` state → `GuidanceScreen.onSaveReflection`
→ `RotationEngine.saveReflection` → `saved_reflections` table → merged into
`ReflectionHistoryScreen`'s journal view) — but no UI anywhere calls it. The
state exists in `useGuidanceLogic.ts` (`reflectionText`, `showReflectionInput`,
`handlePrimaryAction`) but is never rendered or wired into `GuidanceScreen`.

## Goals

1. Give "For Your Heart" its own distinct job: speak directly to the reader
   about what this ayah means for *them*, drawing on what Allah says to His
   slaves/believers — not a second retelling of a Prophet/companion story.
2. Let the user write a short reflection in response to the per-verse
   question, right there in the card, and save it into their existing
   reflection journal.
3. Explain briefly, once, why writing it down is worth the extra few seconds
   (the psychological hook, not a nag).

## Non-goals

- **No rewrite of the 189 existing `angle` entries in `quranData.ts`.** This
  spec only changes the *voice guideline* for new/edited content going
  forward (documented in CLAUDE.md) and ships the reflection-writing feature,
  which works with existing `angle` text as-is. Auditing/rewriting existing
  entries is a separate, later content pass.
- No new database schema — `saved_reflections` and `ReflectionRepository`
  already support this exactly (arbitrary reflection text keyed to
  `contentId` + `angleId` + `mood`).
- No auto-save-on-navigate or draft persistence across verses. Save is an
  explicit, deliberate action (see "Data loss on navigate" below) — that was
  a direct design choice, not an oversight.
- No changes to `FloatingActionRow`'s existing (currently-unused-by-Guidance)
  `reflection` layerType — that's a separate component used by
  `PathStepScreen`, out of scope here.

## Design

### 1. Content voice rule (new entries only)

New section added to CLAUDE.md's Quran-content rules: "For Your Heart" copy
must be second-person, present-tense, and address the reader directly as a
believer — ideally anchored in a Divine Name or a promise/address verse to
Allah's slaves (e.g. 39:53) — rather than narrating what happened to a
Prophet or companion. If a story is the best way to make the point, it
belongs in the Context layer's `whyThis`, not here.

Example of the shift (illustrative, not a rewrite of production data):
- Before (current voice, tafsir/narrative): *"Ibn Kathir explains that
  'ni'ma al-Mawla wa ni'ma al-Nasir' means Allah is the best of those who
  protect... The Prophet ﷺ said on the day of Uhud: 'Allah is sufficient
  for us...'"*
- After (target voice, direct address): *"You are not managing this alone.
  The One who holds the heavens is holding your worry too — He calls
  Himself your Protector, not your bystander."*

### 2. Reflection UI — extends the existing heart card

No new card. The existing `heartCard` in `ContextLayer.tsx` grows a second
section below a hairline divider, so it reads as one continuous block (per
CLAUDE.md's "one coherent motion/block" rule), not a second competing box:

```
♡ FOR YOUR HEART
<angle text>
— angleSource

──────────────────────────────  (hairline, accentColor @ 15% opacity)

✎ REFLECT
<per-verse reflection question, from experience.angle.reflection —
 falls back to "What does this ayah mean for you right now?" if absent>

[ Write freely — even a few words count...                    ]
  ↑ multiline TextInput, grows with content, no fixed height cap

Writing it down turns a fleeting feeling into words you can
return to — a quiet line between you and Allah.
  ↑ one-line hint, small/muted, sits below the input

                                          [ Save reflection ]
                                          ↑ appears only once trimmed
                                            text.length > 0, fades in
                                            (opacity only, micro band)
```

**Save interaction:**
- Tapping "Save reflection": `HapticsService.notificationAsync('SUCCESS')`,
  optimistic UI flips the button to a muted "Saved ✓" state immediately,
  then commits via the existing `onSaveReflection` prop
  (`GuidanceScreen` → `rotationEngine.saveReflection`). On failure, revert
  to the editable state + `WARNING` haptic — same optimistic/revert pattern
  already used by `useGuidanceLogic.handleSave` for the heart-bookmark
  toggle.
- Editing the text again after a save re-arms the Save button (an "edited
  since last save" flag, separate from "has ever been saved").
- No character counter or max-length UI — the repository already silently
  clamps at 1000 chars server-side; not worth surfacing.

**Data loss on navigate (explicit tradeoff, confirmed with product owner):**
Unsaved reflection text is discarded — silently, with no confirmation
prompt — when the verse changes (swipe, "next verse" tap, or leaving the
screen). This matches the chosen design (explicit Save = intentional
commit, not autosave-on-leave). `reflectionText` and the saved/edited flags
reset on `experience.content.id` change, mirroring the existing
`savedStates` reset in `useGuidanceLogic`.

**Visibility:** the whole Reflect block only renders when the heart card
itself renders (i.e., `angle` is truthy) — same condition as today, so
there's never a reflection prompt floating without its "For Your Heart"
context above it.

### 3. Code changes

- **`ContextLayer.tsx`**: extend `heartCard` with the divider + Reflect
  block. New props: `reflectionPrompt: string`, `reflectionValue: string`,
  `onReflectionChange: (text: string) => void`,
  `onSaveReflectionPress: () => void`, and a single
  `reflectionStatus: 'empty' | 'dirty' | 'saved'` driving the Save button
  (hidden / "Save reflection" active / muted "Saved ✓" respectively) —
  one derived status instead of separate booleans, so the four button
  states can't drift out of sync with each other.
- **`useGuidanceLogic.ts`**:
  - Keep `reflectionText` / `setReflectionText`.
  - Remove `showReflectionInput` / `setShowReflectionInput` (dead — was for
    a tap-to-reveal pattern we're not using; the block is always visible
    inline) and `handlePrimaryAction` (dead — was the old
    save-then-advance-together path; save and advance are now decoupled).
    Neither is referenced outside this hook or covered by
    `useGuidanceLogic.test.ts`, confirmed safe to delete.
  - Add `reflectionSaved: boolean` state (whether the *current* text has
    been committed), reset to `false` alongside `reflectionText` in the
    existing `experience?.content?.id` reset effect. Derive
    `reflectionStatus` from `reflectionText`/`reflectionSaved`:
    empty text → `'empty'`; non-empty + not yet saved, or edited after a
    save (text changed since the save call) → `'dirty'`; non-empty and
    matches what was last saved → `'saved'`.
  - Add a `saveReflection()` action implementing the optimistic-save/revert
    behavior described above, calling the hook's existing
    `onSaveReflection` callback param.
- **`GuidanceScreen.tsx`**: destructure the new state/action from
  `useGuidanceLogic`, pass down to `ContextLayer` alongside the existing
  props. Compute `reflectionPrompt` from `experience.angle?.reflection`
  with the generic fallback.
- **`CLAUDE.md`**: add the "For Your Heart" voice rule described above,
  near the existing "Quoting Quran Text" section.

### 4. Testing

- `useGuidanceLogic.test.ts`: cover the new `saveReflection()` optimistic
  success/failure paths and the reset-on-new-experience behavior, replacing
  any assumptions about the removed dead code (there were none).
- Manual on-device pass (per CLAUDE.md's "Commands" section — visual
  changes need real-device confirmation): type a reflection, save it,
  confirm it appears in `ReflectionHistoryScreen`'s journal with the right
  verse citation and mood; confirm swiping to the next verse clears the
  input; confirm the empty-state fallback prompt renders for any verse
  missing `angle.reflection`.
