# Google Play — Default store listing (en-US)

> ASO note (2026-09-17): the title carries the primary keyword because Play
> weights it heaviest, and unlike Apple, Play **indexes the full description** —
> so the body below repeats target terms in ordinary prose rather than hiding
> them in a keyword field that does not exist here. Every feature claim was
> checked against the code; see the "claims checked" list at the bottom before
> editing, and re-check anything you add.

## App name  (limit 30)
Sakina: Quran for Anxiety

## Short description  (limit 80)
Tell it how you feel — get a Quran verse, tafsir, dua and prayer times.

## Full description  (limit 4000)
Some days you open the Quran and don't know where to look. Sakina starts from how you actually feel, then brings you the verse, the tafsir behind it, and one thing to do today.

Tell the app you're anxious, grateful, tired, lonely, angry or carrying guilt. It answers with a complete ayah, the scholarly context behind it, an authentic du'a, and a small practice you can finish in a few minutes. Not a generic daily reminder — something chosen for the moment you are in.

WHAT'S INSIDE

· Mood-based Quran guidance — nine moods, each mapped to real verses, tafsir from Ibn Kathir, As-Sa'di and Ibn al-Qayyim, and a practice drawn from the Sunnah.

· Ten guided journeys — multi-day Islamic paths on tawakkul, rizq, salah, repentance, grief, screen detox and more. One verse, one lesson, one practice per day. Seven of them are completely free.

· Prayer times and qibla — accurate salah times for your location, Hanafi or standard Asr calculation, a live qibla compass, and prayer time reminders.

· Full Quran library — read any surah in Uthmani Arabic with transliteration and the Sahih International translation, laid out page by page like a Mushaf, with verse-by-verse audio recitation.

· Du'a and adhkar — supplications from the Quran and authentic hadith, organised by what you're facing rather than by chapter.

· Reflection journal — write after any session, and keep it. Your reflections are stored only on your device and are never uploaded, even when you sign in.

· Mood calendar — every check-in on one screen, so you can see what the last few months have really looked like.

· Lock screen verses — a complete ayah waiting for you at tahajjud, morning and evening remembrance. (Sakina Pro)

WHY THE SOURCING MATTERS

Every ayah is complete. Never a clause lifted out of context, never truncated to fit a card. Every hadith carries its collection and its number, so you can go and check it yourself. Tafsir is attributed to the scholar it came from, not to the app.

Sakina is not an AI chatbot and it does not generate religious content. It is a curated library of classical Islamic scholarship, organised around the moments you need it most.

FOR THE DAYS THAT ARE HARD

This was built for anxiety, grief, loneliness, burnout and guilt as much as for gratitude. If you have been looking for Quran for anxiety, a dua for stress, or a Muslim app that meets you somewhere other than a streak counter, this is that.

It is for any Muslim who wants dhikr, salah and the Quran woven into an ordinary week — whether you have been praying for thirty years or are finding your way back.

SAKINA PRO

Unlocks unlimited guidance, lock screen verses, background themes, and two Pro-only journeys. Monthly, annual, or a one-time lifetime unlock that never renews. Everything not marked Pro above stays free, including seven of the ten journeys.

سَكِينَة — Sakina — is the tranquillity that descends on the heart and settles it. That is the whole idea.

Terms of Use: https://ahmedbasolan.github.io/sakina-legal/terms.html
Privacy Policy: https://ahmedbasolan.github.io/sakina-legal/privacy.html

---

## Claims checked against the code (2026-09-17)

Re-verify before changing any of these — a store listing is the one place a
drifted claim is visible to Google's policy reviewers as a misrepresentation.

| Claim | Where it was checked |
|---|---|
| nine moods | `MOOD_LABELS` in `src/constants/index.ts` |
| ten journeys, seven free | `AVAILABLE_PATH_IDS` (10) minus `PREMIUM_GATED_PATHS` (3) in `PathsScreen.tsx` |
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

- **Per-prayer reminder tuning.** `notificationService` schedules prayer
  notifications as one category; there is no per-prayer toggle. The listing
  says "prayer time reminders" and stops there.
- **Athan / adhan audio.** Not verified as a feature, so the keyword is left
  on the table rather than asserted. Add it only if a real adhan sound ships.
- **A named upstream for the Arabic text.** `SettingsScreen.tsx` credits
  Tanzil.net, but the curated corpus is byte-locked against quran.com
  api/v4 `text_uthmani` (`scripts/refresh-quran-canonical.mjs`) while the
  downloadable full-Quran text comes from api.alquran.cloud. Two different
  upstreams, both Uthmani — so the listing claims the script, not a vendor.
  Worth reconciling the Settings credit separately.
