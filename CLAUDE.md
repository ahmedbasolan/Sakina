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

## Commands
- Typecheck: `npx tsc --noEmit -p tsconfig.json`
- (Run on device via Expo to verify visual changes — visuals can't be confirmed from a typecheck alone.)
