# Google Play — Default store listing (en-US)

> **Ship gate.** Play listing text goes live the moment it is saved, with no
> build attached. The description counts ten journeys, seven free: true on
> `feat/screen-detox-journey`, **false** on `main` today (9 journeys, 5 free).
> Apply it only once the Android build containing that branch is live, or it
> promises users two journeys they cannot open.

> ASO note (2026-09-21): the title targets "daily Quran verses" because App
> Store autocomplete shows real demand there — "quran verse" alone suggests
> daily quran verses, quran verse of the day, daily ayah — against thin
> competition (#1 for "quran verse of the day" had 2 ratings). An earlier draft
> targeted "Quran for Anxiety"; autocomplete returns **nothing** for "quran
> anx", "muslim anx" or "dua for anx", so that field looked empty because
> nobody searches it. Do not revert to it. Caveat: Play's own autocomplete
> endpoint returned 404, so Play demand is inferred from the App Store's.
>
> Play weights the title heaviest and, unlike Apple, **indexes the full
> description**, so the body repeats target terms in ordinary prose rather than
> hiding them in a keyword field that does not exist here. Every feature claim
> was checked against the code; see the "claims checked" list at the bottom
> before editing, and re-check anything you add.

## App name  (limit 30)
Sakina: Daily Quran Verses

## Short description  (limit 80)
A verse for how you feel, what it means, and journeys to live it.

## Full description  (limit 4000)
Not just a verse a day. A verse for how you feel, what it means, and journeys to live it.

Tell Sakina you're overwhelmed, grateful, tired, lonely, angry or carrying guilt. It answers with a complete ayah, the scholarly context behind it, and a question to reflect on, which you can answer in a private journal. Not a generic daily reminder — something chosen for the moment you are in.

When you want more than a moment, a guided journey takes one theme across days: a verse, a lesson and something to practise each day, from a du'a to recite to a small act to carry out.

WHAT'S INSIDE

· A daily Quran verse — a new ayah every day, complete and referenced, at the top of Home.

· Mood-based Quran guidance — nine moods, each mapped to real verses, with context drawn from the scholarship of Ibn Kathir, As-Sa'di and Ibn al-Qayyim, and a question to reflect on.

· Ten guided journeys — multi-day Islamic paths on tawakkul, rizq, salah, repentance, hope after crisis, screen detox and more. One verse, one lesson and one practice a day. Seven of them are completely free.

· Prayer times and qibla — accurate salah times for your location, Hanafi or standard Asr calculation, a live qibla compass, and prayer time reminders.

· Full Quran library — read any surah in Uthmani Arabic with transliteration and the Sahih International translation, laid out page by page like a Mushaf, with verse-by-verse audio recitation.

· Reflection journal — write after any session, and keep it. Your reflections are stored only on your device and are never uploaded, even when you sign in.

· Mood calendar — every check-in on one screen, so you can see what the last few months have really looked like.

· Lock screen verses — a complete ayah waiting for you at tahajjud, morning and evening remembrance. (Sakina Pro)

WHY THE SOURCING MATTERS

Every ayah is complete. Never a clause lifted out of context, never truncated to fit a card. Every hadith carries its collection and its number, so you can go and check it yourself. Tafsir is attributed to the scholar it came from, not to the app.

Sakina is not an AI chatbot and it does not generate religious content. It is a curated library of classical Islamic scholarship, organised around the moments you need it most.

FOR THE DAYS THAT ARE HARD

This was built for anxiety, grief, loneliness, burnout and guilt as much as for gratitude. If you want Quran verses that speak to what you are carrying, rather than another streak counter, this is that.

It is for any Muslim who wants dhikr, salah and the Quran woven into an ordinary week — whether you have been praying for thirty years or are finding your way back.

SAKINA PRO

Unlocks unlimited guidance, lock screen verses, background themes, and two Pro-only journeys. Monthly, annual, or a one-time lifetime unlock that never renews. Everything not marked Pro above stays free, including seven of the ten journeys.

سَكِينَة — Sakina — is the tranquillity that descends on the heart and settles it. That is the whole idea.

Terms of Use: https://ahmedbasolan.github.io/sakina-legal/terms.html
Privacy Policy: https://ahmedbasolan.github.io/sakina-legal/privacy.html

---

## Claims checked against the code (2026-09-21)

Re-verify before changing any of these — a store listing is the one place a
drifted claim is visible to Google's policy reviewers as a misrepresentation.

| Claim | Where it was checked |
|---|---|
| a new verse every day, at the top of Home | `dailyVerseService.ts` keys the pick to the local date (`todayKey`) with a no-repeat history; rendered at `HomeScreen.tsx:398`, directly under `HeroHeader` — so "at the top", not "the first thing you see" |
| a mood answer = ayah + context + a question to reflect on | `GuidanceScreen.tsx:196` — `LAYER_TYPES` is verse, context and (only when a verse has one) story. ContextLayer renders no du'a, action or practice |
| that question can be answered in a private journal | `GuidanceScreen.tsx:85` calls `saveReflection` |
| du'a and practice live in journeys | `PracticeLayer` is mounted only by `PathStepScreen` |
| nine moods | `MOOD_LABELS` in `src/constants/index.ts` — the list says "overwhelmed", not "anxious": there is no Anxious mood |
| ten journeys, seven free | `AVAILABLE_PATH_IDS` (10) minus `PREMIUM_GATED_PATHS` (3) in `PathsScreen.tsx` |
| topics: tawakkul, rizq, salah, repentance, hope after crisis, screen detox | Trusting the Results, Rizq Revolution, Salah Transformation, Tawbah Intensive, Hope After Crisis, Screen Detox. An earlier draft said "grief" — no journey is about grief, and it was never checked |
| two Pro-only journeys | `PREMIUM_GATED_PATHS` — Marriage Seeker, Death Awareness are "Sakina Pro exclusive"; Trusting the Results is a dated free-tier promise, so it is NOT counted as Pro-only |
| Ibn Kathir / As-Sa'di / Ibn al-Qayyim | attribution block in `SettingsScreen.tsx` |
| Hanafi or standard Asr | prayer times settings |
| qibla compass | `src/components/LocationCompass.tsx` |
| verse-by-verse audio | `AudioPlayerButton.tsx` → `audioService` (everyayah.com) |
| Mushaf page layout | `SurahReaderScreen.tsx` |
| reflections never uploaded | `supabaseDataService.ts:8` — "Reflections are ALWAYS local (privacy-first, never synced)" |
| complete ayahs, never truncated | enforced by `npx jest quranArabicIntegrity` |
| hadith carry collection + number | enforced by `node scripts/verify-citations.mjs` |

### Deliberately NOT claimed

- **A du'a or a practice in the mood flow, or a du'a collection.** Every
  earlier version of this copy — the live one included — said a mood session
  ends in a du'a and a practice, and listed a "Du'a and adhkar" collection.
  Neither exists. The mood flow is verse, context and a reflection question
  (`GuidanceScreen.tsx:196`); du'as and practices are journey steps
  (`PracticeLayer`, mounted only by `PathStepScreen`); no du'a screen or route
  exists. Removed 2026-09-22. This table existed and still passed them over,
  because nobody checked what a mood session RENDERS — see CLAUDE.md's "Which
  Angle Fields Actually Render".
- **A widget.** "quran verse widget" is one of the strongest autocomplete
  suggestions in the whole category, and it is tempting. But Lock Screen Verses
  is a *notification* with a background photo (`lockscreenVerseService.ts:2`,
  "preferences and notification payload"), not a widget, and the daily verse
  lives inside the app. Shipping a real home-screen widget would be the single
  biggest keyword this app could unlock — until then, the word stays out.
- **Per-prayer reminder tuning.** `notificationService` schedules prayer
  notifications as one category; there is no per-prayer toggle. The listing
  says "prayer time reminders" and stops there.
- **Athan / adhan audio.** Not verified as a feature, so the keyword is left
  on the table rather than asserted. Add it only if a real adhan sound ships.
- **A named upstream for the Arabic text.** The listing claims the script
  ("Uthmani Arabic") and no vendor, which stays correct however the plumbing
  changes. For the record, since an earlier draft of this note got it wrong:
  the curated corpus is **Tanzil-lineage**, not quran.com. Measured over a
  20-ayah sample, the corpus carries 21 U+06ED tanween ornaments and
  alquran.cloud's `quran-uthmani` carries 22, while quran.com's
  `text_uthmani` carries zero; quran.com is only the skeleton *witness* in
  `quranArabicIntegrity`, never a source. `SettingsScreen.tsx` therefore
  credits Tanzil.net correctly, and now also credits the transliteration
  (alquran.cloud) and the recitation (everyayah.com) it had been omitting.
