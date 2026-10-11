# Prayer Leadership — "Who is leading?" choice (design)

Date: 2026-10-11 · Status: approved in chat, awaiting spec review · Journey: `path_prayer_leadership` (14 days)

## 1. Goal

Prayer Leadership is written for a man leading. Days 1 and 8 currently tell a woman to
ask a scholar. Give a woman leading women a correct version of the journey, **changing a
day only where an authentic source says the practice differs** (Ahmed, 2026-10-11:
"women dont need different and separate recitation unless islam says so. if the
practices are same then let it continue").

Non-goals: a general gender setting, a profile field, onboarding questions, any other
journey. (Ahmed chose option A, "just A since we care about privacy": ask only inside
this journey.)

## 2. What changes, day by day

| Day | Man (today) | Woman leading women | Hadith layer |
|---|---|---|---|
| 1 Who Stands in Front | unchanged except the "if you are a woman, ask a scholar" line becomes a pointer to the women's version | new lesson + **new title** (she stands in the row, not in front); the "most versed in the Book of Allah leads" principle applies to women (Ibn Baz); the schools differ on whether she leads at all — named per school; the single-follower-on-your-right line is **removed, not replaced** (no source found for where one woman follower stands) | Muslim 673 (shared) |
| 2–6 | unchanged | shared | shared |
| 7 Surahs the Mosque Knows | **neutral rewording for both, title included** (e.g. "Surahs Everyone Knows"): drop the mosque/iqamah framing ("if the iqamah were called and everyone turned to you") — iqamah for women is disputed | shared | shared |
| 8 How the Prayer Begins | "if you are a woman leading women, ask a scholar" line becomes a pointer | new lesson: she stands **in the middle of the front row**; straightening the row and the takbir unchanged; men-only mechanics (second man arrives, leading your wife alone) **removed, not replaced** | Muslim 433 (shared) |
| 9 Reciting Aloud | unchanged | new lesson: Shafi'i + Hanbali — aloud in Fajr/Maghrib/Isha unless non-mahram men are present; Hanafi + Maliki reported as silent (single source — say "reported"); Aisha's Maghrib report | Bukhari 780 (shared) |
| 10 The Imam Is Followed | unchanged | new lesson: same pace teaching; the "make transitions audible" instruction **dropped** rather than asserting a voice rule for takbirs (none sourced) | Bukhari 722 (shared) |
| 11 When You Slip | unchanged | new lesson: the women behind her clap (Bukhari 1203/1204 quoted; applying it to a woman imam is stated as the app's application, not a source's words) | Muslim 571 (shared) |
| 12 Keep It Short | **neutral rewording for both**: "an elderly man" → "someone elderly" | shared | shared |
| 13 How the Prayer Ends | unchanged | shared | shared |
| 14 Go Back and Lead Your People | unchanged | new lesson + **new title/focus**: Umm Waraqah commanded to lead the people of her house; a woman leads women, not men (four-school agreement) | **Abu Dawud 592** (new `hadith_imam_14_f`) |

Rules for the women's text: add only what a source below supports; remove men-only
mechanics without inventing replacements; companions' practice (Aisha, Umm Salamah) goes
in the lesson prose with its grading dispute stated, **never** in the hadith layer (which
is for the Prophet ﷺ's words). Titles, focus lines and verses not listed above stay shared.

Known gaps, stated in the text rather than filled: a Maliki woman (her school does not
permit it — Day 1 says so; Days 2–7 still serve her); a woman leading young sons (no
source fetched — text says "women" only).

## 3. Sources (all read 2026-10-11)

Hadith (fetched, full text):
- Abu Dawud 591/592 — Umm Waraqah; 592: "he commanded her to lead the inmates of her house in prayer". Hasan (al-Albani, Muhyi al-Din Abd al-Hamid, Zubair Ali Zai). `cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-abudawud/592.json`
- Bukhari 1203, 1204 — "Subhan Allah is for men and clapping is for women".

Companions' reports (primary text):
- Musannaf Abd al-Razzaq, chapter "a woman leading women", 5080–5087 — 5082 Umm Salamah led Asr "and stood among us"; 5086 Aisha "stood among them in an obligatory prayer". Text: ar.wikisource.org, مصنف الصنعاني/كتاب الصلاة. Number 5082 corroborated by dorar.net/feqhia/1385.
- Gradings: al-Nawawi — 5082's chain sahih (Khulasat al-Ahkam, dorar.net/h/aJzyCkOF; al-Majmu' 4/199, cited by Dorar and by al-Humaydi). Ibn al-Mulaqqin — Aisha's Maghrib report (stood among them, recited aloud; Ibn Hazm, al-Muhalla 4/219) chain sahih (dorar.net/feqhia/1387). Against: al-Dhahabi — the adhan version "fihi Layth, layyin" (dorar.net/h/hVIDTZ1t); Fawzi al-Humaydi grades all of them weak and holds she stands in front, as did Ibn Hazm (alshabaka-alathariya.com/subjects/1775). **Not used:** al-Albani, Tamam al-Minna 154 — single source, possibly a different chain.

Fiqh:
- Four schools: a woman does not lead men; men's prayer behind her invalid — dorar.net/feqhia/1371 (Ibn Abidin, Ibn Abd al-Barr, al-Nawawi al-Majmu' 4/255, al-Mardawi; Ibn Hazm reports consensus).
- Whether she leads women: Shafi'i recommended (SeekersGuidance, Shuaib Ally, from al-Majmu'); Hanbali permitted (dorar.net/feqhia/1385; Diyanet fatwa); Hanafi disliked — tahrimi in the well-known view, tanzihi per some (SeekersGuidance, Basem Itani, al-Fatawa al-Hindiyya, Fath al-Qadir); Maliki **not permitted** (Diyanet citing Ibn Rushd, Ibn Juzay; al-Humaydi on Malik). Do not write "invalid" for Maliki — not read.
- Position: middle of the row — Hanafi, Shafi'i, Hanbali (dorar.net/feqhia/1387: al-Zayla'i, al-Nawawi, al-Ruhaybani; Ibn Qudamah "we know of no disagreement among those who allow her to lead them"). Jordan Iftaa (Shafi'i): middle of the front row "while being advanced a bit in front of them" — mention as a nuance.
- Reciting aloud: Shafi'i + Hanbali aloud unless non-mahram men present (dorar.net/feqhia/1387: Rawdat al-Talibin, Tashih al-Furu', al-Mughni; Ibn Taymiyyah; also almosleh.com/en/f-32487). Hanafi + Maliki silent — al-Muslih only.
- Ibn Baz (binbaz.org.sa/fatwas/17618): permissible, recommended when needed for teaching; "the most versed in the Book of Allah leads" includes women; she may lead "the women of her household".

A scholar should approve the six women's lessons before release; these are fatwa sites
and an encyclopedia quoting the books, not the books themselves.

## 4. Architecture

**Data (`src/types/index.ts`, `src/data/staticPaths.ts`)**
`PathStep` gains optional
`variants?: { womanLeading?: { angleId: string; hadithContentId?: string; title?: string; focus?: string } }`.
Only Prayer Leadership days 1, 8, 9, 10, 11, 14 carry it. `SpiritualPath` gains optional
`leaderChoice?: true` (only this path).

**Content (`src/data/quranData.ts`, `src/data/hadithData.ts`)**
Six angles `q_angle_imam_day{1,8,9,10,11,14}_f` against the same `contentId` as the
man's day; mood = path theme (`Hopeful`); single-quoted `id`/`contentId`/`mood`; CRLF,
zero bare LFs; `[Tafsir …]` tag only where an entry has been read. One hadith
`hadith_imam_14_f` (Abu Dawud 592). Edits to existing angles: imam days 1 and 8 (pointer
line), 7 and 12 (neutral wording). `SEED_VERSION` bump with changelog. The `imam`
prefix in `JOURNEY_ANGLE_PREFIXES` already covers the new ids.

**Resolution — one seam, in `PathsService`**
- Pure `resolveStep(step, choice)` in `src/utils/leaderChoice.ts`: returns the step with
  the `womanLeading` fields applied when `choice === 'woman'`, else the step unchanged.
- `PathsService` holds the choice in memory per path, loads it from kv_store at app start
  (awaited alongside existing init), and **every method that returns a path or steps**
  (`getPathById`, `getAllPaths`, `getPathsByMood`, `getCurrentStep`, `getNextStep`,
  `getCompletedSteps`) returns resolved steps. So every consumer — PathDetail list +
  openDay, PathStep advance, Home card (`useHomeData`), completion celebration — is
  consistent without per-screen code.
- `getLeaderChoice(pathId)`, `setLeaderChoice(pathId, choice)` update cache + kv_store.
- Progress (`completedDays`) is shared; switching affects only lessons opened afterwards.
  Reflections save under whichever angle was shown.

**Storage & privacy**
- kv_store key `prayer_leadership_leader` (letters/underscores only — `verify-local-wipe`
  reads keys with `'([a-z_]+)'`), values `man` | `woman`. Never a Supabase column, never
  synced, never in progress rows.
- Added to `clearAllLocalUserData`'s kv delete list → `verify-local-wipe` picks it up.
  Like `last_opened_path`, it is not cleared on sign-out (shared-device caveat, accepted
  precedent).
- Error reports: journey-flow `logServiceError` calls must carry the **step id**
  (`step_imam_8`), never the angle id, so PostHog never sees `_f`.
  (`rotationEngine.getGuidanceForStep` logs `{ angleId }` — the journey call sites pass a
  step id for logging instead.)
- Residual, documented not "fixed": the Supabase fallback `fetchAngleById` (only when the
  local seed lacks the angle) would request an `_f` id; the SQLite DB is included in the
  user's own Android/iCloud backup.

**Picker UI (`PathDetailScreen`)**
- When `path.leaderChoice` and no stored choice, tapping any day opens a small card:
  title "Who is leading?"; options "A man" / "A woman, leading women"; caption
  "Stays on your device. Never sent to Sakina." Choosing saves and opens the tapped day.
  Dismissing opens nothing.
- Under the header: "Leading: A woman · Change" (tappable, reopens the card).
- Follows the Screen Layout Checklist: tokens only, one primary action per option row,
  bare icons, 44pt targets, reduce-motion honoured, no new colours.
- Existing users mid-journey get the card on their next tap; no default is guessed.

## 5. Verification

- Jest: `resolveStep` (no choice / man / woman / day without variant); PathsService
  returns resolved steps after `setLeaderChoice` and plain steps before.
- `verify-journey.mjs`, `verify-journey-roundtrip.mjs`, `verify-journey-claims.mjs`:
  check the women's sequence as its own virtual journey (all variants applied), so
  one-verse/one-hadith, distinct du'a, mood=theme, tags, citation fetches and the DB
  roundtrip run on what a woman sees. Selftests gain a planted fault (a variant pointing
  at a missing angle) shown to fail.
- `verify-citations.mjs`, `verify-tafsir-tags.mjs` cover the new angles.
- `verify-local-wipe.mjs` (+ `NO_WIPE=1`) lists the new key.
- `npx tsc --noEmit -p tsconfig.json`, `npx jest`.
- Device check by Ahmed: card appears once, both versions render, Change works, Home card
  title follows the choice.

## 6. Order of work

1. Draft the six women's lessons + Day 7/12 wording + Day 1/8 pointer lines → Ahmed
   reviews the text before it goes in.
2. Types, `resolveStep`, PathsService seam, kv storage, wipe list (TDD).
3. Content insertion by script, SEED bump.
4. Picker UI.
5. Verifier extensions + selftests.
6. Full verification run; commit; no push until asked.
