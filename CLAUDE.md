# Sakina — Project Guide

Sakina is a React Native (Expo) Islamic spiritual companion app. Aesthetic:
**"Celestial Night"** — cool steel-blue backgrounds (`#07111E`→`#0F1F30` via
`Colors.celestialWash`), warm cream text (`Colors.text.primary`), single gold
accent (`Colors.accent.primary #D4AF37`), twinkling stars, faint gold mandala
backdrop, calm and breathing motion. The warm-on-cool contrast is intentional —
a lantern under a starlit sky. Brand mark is the gold lantern (fanoos) in
`assets/icon.png`, recreated as [`SakinaLantern`](src/components/SakinaLantern.tsx).

Styling is **React Native `StyleSheet` + the core `Animated` API**, with all
visual values coming from [`DesignSystem.ts`](src/theme/DesignSystem.ts).
We do **not** use Tailwind, CSS, framer-motion, or Reanimated. When a design
skill (`visual-design-foundations`, `interaction-design`, `react-native-design`,
`ui-ux-pro-max`) gives a web/Tailwind snippet, follow its *principle* and
translate to our stack — never paste web code.

---

## Screen Layout Checklist — apply to EVERY screen

**Spacing**
- Use only `Spacing` tokens (`xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32 · xxxl 48`)
  and `BorderRadius` tokens. No magic numbers — if a value isn't in the scale,
  reconsider or add it to the system, don't hardcode.
- Screen horizontal padding: `Spacing.xl` (24). Gap between major blocks:
  `Spacing.xxl`–`xxxl`. Icon↔text gap: `Spacing.sm`.

**Safe areas & header clearance**
- Respect notches/home indicator with `useSafeAreaInsets()` (already used in
  `OnboardingScreen`). Never put content under the status bar or nav gestures.
- Top-aligned titles/badges must clear the header zone — don't vertically-center
  tall content that then overflows up into the back arrow / progress ring
  (the bug fixed on Paywall & Personalization). Prefer `justifyContent:'flex-start'`
  + a `paddingTop` for content-heavy screens.

**Typography & hierarchy**
- Use `Typography.sizes` (`hero 32 · h1 24 · h2 20 · body 16 · small 14 · detail 12`)
  and `Typography.fonts` (`serif` for display/titles, `latin` for body,
  `arabic` = Amiri-Quran for Quran text). Max 2–3 weights.
- One clear hierarchy per screen: title → body → caption. One **primary CTA**
  per screen; secondary actions are visibly lighter (text/ghost).
- Line height: headings tight, body ~1.5×. Keep copy short, especially first
  screens and onboarding.

**Color & contrast**
- Text from `Colors.text` on `Colors.background`. Body text contrast ≥ 4.5:1,
  large text ≥ 3:1. The single gold `Colors.accent.primary` does the accent
  work — don't introduce new arbitrary colors (mood screens use `MoodColors`).
- Surfaces use `Colors.glass.*`; shadows use the `Elevation` tokens.

**Motion** (calm, purposeful — never decorative blinking)
- Timing bands: micro-feedback 100–150ms · small transitions 200–300ms ·
  medium/page 300–500ms. Tokens: `Animations.timing` (`fast 200 · normal 400 ·
  slow 600`) and `Animations.spring` (`gentle`, `bouncy`).
- Entrances use one coherent motion (e.g. the staggered fade/slide via
  `useStaggerEntry`). Don't stack two opacity animations on the same content
  (that caused the onboarding button "blink").
- Honor reduce-motion (`useReduceMotion`) — loops/flicker must stop.
- Animate `transform`/`opacity` only; never animate layout (`width`/`height`).
  For SVG-prop animations (e.g. `Ionicons`/`react-native-svg` opacity), use
  `useNativeDriver: false`.

**Navigation & icon indicators**
- Bare icons only — never wrap back arrows, chevrons, or nav indicators in circular
  containers (`borderRadius: full` + border + background). Circles on every icon
  erode the immersive aesthetic. Use generous `hitSlop` (minimum 44 pt touch
  target: `hitSlop={{ top:12, right:12, bottom:12, left:12 }}`) without adding
  visual clutter.
- Disabled nav icons use opacity or a muted color on the icon itself, not a
  different container shape.

**Lists & components**
- Long lists use `FlatList`, never `ScrollView` + `.map`.
- Memoize where it matters (`React.memo`, `useCallback`) to avoid re-render churn.
- Define `StyleSheet.create` styles outside render; avoid inline style objects.

**Before calling a screen done**
1. Safe areas + header clearance respected on a notched device.
2. Spacing all from tokens; one primary CTA; consistent bottom placement.
3. Type hierarchy clear; contrast passes; copy is tight.
4. Motion sits in the timing bands, honors reduce-motion, no flicker.
5. The screen belongs to the same product world as its neighbors.

---

## Quoting Quran Text — non-negotiable

This exact bug shipped three times in one session (`dailyVerseService.ts`,
`StreakBar.tsx`, `SpiritualWindowBanner.tsx` all quoted verse fragments as if
they were the full ayah). Treat these as hard rules, not style preferences:

1. **Always the complete ayah, never a clause.** If a UI cites "Surah X:Y",
   the Arabic + translation must be the full text of that ayah, start to end
   — not a fragment that happens to sound quotable in English. Showing a
   fragment under its real ayah number misrepresents the Quran even when the
   fragment reads as a grammatically complete sentence.
2. **Never type Arabic diacritics or a translation from memory.** Verify
   every ayah against a reliable source before writing or editing verse
   content: `https://api.alquran.cloud/v1/ayah/{surah}:{ayah}/editions/quran-uthmani,en.sahih`
   (Uthmani script + Sahih International). Fetch it with `curl`/Node `fetch`
   and read the raw JSON yourself — the `WebFetch` tool summarizes through a
   small model that has been observed silently truncating or misnumbering
   long ayahs even when explicitly told to return the complete verbatim text.
   "Verify against Sahih International" means confirming the ayah's full
   *meaning and completeness* — light prose-smoothing for a UI card (dropping
   translator clarification brackets like `[so]`/`[O Muhammad]`, adjusting a
   connective word for flow) is fine and matches this app's existing voice
   (`quranData.ts` already does this, e.g. "the Hereafter is better for you
   than the first" for 93:4 rather than the bracketed "...than the first
   [life]"). What's never acceptable is dropping a clause, changing what the
   ayah actually claims, or substituting a specific term for a vaguer one
   (e.g. "religious scholars" becoming "devoted men of faith" changes the
   translator's specific word choice without changing meaning enough to
   justify it — prefer the source's own wording once brackets are resolved).
3. **If the complete ayah doesn't fit the slot, swap the verse — don't cut
   it.** Some ayahs are fiqh rulings (e.g. 2:222, 65:2), mid-narrative
   dialogue with no antecedent, or simply very long (2:286, 2:185). If citing
   one would mean truncating it, or it would read oddly/inappropriately out
   of context, pick a different complete, thematically-similar ayah instead.
4. **Never bound verse text with `numberOfLines`/ellipsis with no way to see
   the rest.** Clipping an ayah at render time with a permanent line cap is
   the same violation as truncating it in the data. Bound verse UI with
   font-size scaling (fixed container, tiered size by length) or by letting
   it wrap freely. A collapsed-preview-with-tap-to-expand (`numberOfLines`
   that flips to `undefined` on tap, per `QuranLibraryScreen.tsx`'s
   `VerseCard`) is fine — the complete ayah is still genuinely reachable, not
   hidden. What's banned is a clamp with no expand affordance at all. If a
   fixed-height container is used instead of expand-on-tap (e.g.
   `VerseOfTheDay.tsx`), don't pair it with `overflow: 'hidden'` unless
   you've actually budgeted the height for the longest real entry with
   margin — an unverified fixed height + hidden overflow is a silent clip
   with extra steps.
5. **Places with verse content, so far:** `src/data/quranData.ts` (already
   sourced from the Quran.com API — the standard to match), and the three
   files above. `hadithService.ts`, `quranService.ts`, `contentRepository.ts`,
   and `sunnahEnricher.ts` also carry Quran/hadith text and have not yet been
   audited against these rules — check them the next time you're in that area.

---

## "For Your Heart" — Content Voice

The Context layer's "For Your Heart" card (`ContextLayer.tsx`'s `heartCard`,
fed by `ContentAngle.angle`) has a distinct job from the "Understand"/
"Matters" sections just above it. Those sections carry the Prophet/companion
story and scholarly explanation (`Content.whyThis`) — "For Your Heart" is
not a second helping of the same voice.

For any **new or edited** `angle` entry (existing entries in `quranData.ts`
are not being retroactively rewritten — see
`docs/superpowers/specs/2026-07-16-for-your-heart-reflection-design.md`):

- Second person, present tense. Speak to the reader directly as a believer,
  not about a Prophet or companion's situation.
- Anchor it in a Divine Name or a promise/address verse to Allah's slaves
  (e.g. 39:53's "O My servants who have transgressed against yourselves, do
  not despair of the mercy of Allah") rather than narrating what happened
  historically.
- If a Prophet/companion story is genuinely the best vehicle for the point,
  it belongs in `Content.whyThis` (the Context layer's own narrative
  section), not here.

Example of the shift:
- Before (tafsir/narrative voice): *"Ibn Kathir explains that 'ni'ma
  al-Mawla wa ni'ma al-Nasir' means Allah is the best of those who
  protect... The Prophet ﷺ said on the day of Uhud: 'Allah is sufficient
  for us...'"*
- After (direct-address voice): *"You are not managing this alone. The One
  who holds the heavens is holding your worry too — He calls Himself your
  Protector, not your bystander."*

---

## Commands
- Typecheck: `npx tsc --noEmit -p tsconfig.json`
- (Run on device via Expo to verify visual changes — visuals can't be confirmed from a typecheck alone.)
