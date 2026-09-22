# App Store — version metadata (en-US)

> **Ship gate.** Apply this with the first iOS build cut from a `main` that
> contains `feat/screen-detox-journey`, and bump `app.json`'s `version` past
> 1.3.0 first — the name, subtitle, keywords and description can only change
> with a new version. The description counts ten journeys, seven free, which
> is true on that branch and **false** on `main` today (9 journeys, 5 free).
> Promotional text is the only field that can go live without a new version,
> so it is written to be true on both builds and states no count.

## Live today (for rollback)

- Name: `Sakina: Quran & Reflection`
- Subtitle: `Salah, Dhikr, Quran & Sunnah` — spends "Quran" twice across name and subtitle
- Pending, never shipped: App Information also held an unsubmitted subtitle,
  `Muslim dua, Ayah, Reflection`, set at some point for a future version. It
  was overwritten on 2026-09-22 when version 1.4 was set up.
- Keywords: `islamic,azkar,adhkar,dhikr,hadith,tafsir,salah,namaz,sunnah,iman,deen,anxiety,calm,journal,mood,sabr` (read from App Store Connect, 2026-09-22)
- Build: **7** (1.3.0), cut by EAS from commit `50b38d4` on 2026-09-01 — not build 5
- Promotional text before 2026-09-22: `Emotional well-being, rooted in the Quran. A new verse every day, and one chosen for exactly how you feel, with the tafsir behind it.`

1.4 was submitted with build **8** (1.4.0, commit `cd08cbb`) on 2026-09-22.

## App name  (limit 30)
Sakina: Daily Quran Verses

## Subtitle  (limit 30)
Prayer Times, Qibla & Tafsir

## Keywords  (limit 100 — comma-separated, no spaces)
verse,day,english,islamic,muslim,dua,dhikr,azkar,hadith,ayah,journal,reminder,audio,surah,namaz,mood

## Promotional text  (limit 170 — editable any time, not indexed)
Not just a verse a day. A verse for how you feel, what it means, and journeys to live it.

## Description  (limit 4000 — NOT indexed on iOS)
Use the "Full description" in `play-listing.md` verbatim. Apple does not
search the description, so it is conversion copy only, and one copy cannot
drift from the other. Its claims are checked in that file's table.

## What's New
• New journey: Screen Detox. Seven days on reclaiming your attention for Allah, free for everyone.
• Tawbah Intensive, ten days of sincere repentance, is now free.
• The mood check-in now sorts how you feel into two groups, so yours is quicker to find, and each mood keeps the same name wherever it appears.
• Sources & Attribution now credits the transliteration and the Quran reciters.

## 1.4.1 subtitle  (limit 30 — ship with the next version)
A verse for how you feel

## 1.4.1 keywords  (limit 100 — ship with the next version)
prayer,times,qibla,tafsir,dua,dhikr,hadith,islamic,muslim,english,journal,audio,surah,ayah,mood,day

### Why 1.4.1 changes the subtitle

The name is what people type; the subtitle is what they READ in search
results, beside the first screenshots. 1.4's "Prayer Times, Qibla & Tafsir"
is Muslim Pro's feature list — the most generic line on the page, and the
one place the difference should show. "A verse for how you feel" is the
same sentence as screenshot 1's headline, so a search result reads as one
story: Sakina: Daily Quran Verses / A verse for how you feel / FIND a verse
for how you feel.

The cost is that prayer times and qibla drop from subtitle weight to keyword
weight. That is small in practice: "prayer times" is held by Muslim Pro
(598k ratings) and Athan Pro (80k), and a 0-rating app was not going to
outrank them from any field.

Keyword changes from 1.4, each for a reason:
- in: `prayer`, `times`, `qibla`, `tafsir` — moved down from the subtitle
- out: `verse` — now in the subtitle, and a repeated word is wasted characters
- out: `azkar` — the app has no adhkar collection; keep keywords to features
  that exist (`dua` and `dhikr` stay: journeys carry du'a and dhikr steps)
- out: `reminder`, `namaz` — the weakest remaining demand, to make room

Both fields change only with a new version, and 1.4 was already in review,
so they wait for 1.4.1 rather than pulling 1.4 — which carries the rating
prompt — back out of the queue.

---

## Why these words

Apple indexes name + subtitle + keywords as one pool and builds phrases across
them, so no word appears twice across the three fields (checked). The name
carries the search intent; screenshot 1 ("Find a verse for how you feel") and
the promotional text carry the mood mechanic, which is where it converts.

Demand was measured with App Store autocomplete (US): the list is ordered by
popularity, so the shorter the prefix at which a term surfaces, the more it is
typed. Ranking, not volume — confirm volume in Apple Search Ads before shipping.

| Term | Surfaces at | Rank | Where it lives |
|---|---|---|---|
| prayer times | "pra" | 3 | subtitle |
| verse of the day | "vers" | 3 | name `verses` + keyword `day` |
| quran english | "qur" | 8 | name `quran` + keyword `english` |
| qibla | "qi" | 2 | subtitle |
| journal | "jou" | 1 | keyword — the private reflection journal |
| islamic | "isl" | 2 | keyword |
| azkar | "az" | 5 | keyword (outranks the `adhkar` spelling) |
| dhikr | "dh" | 8 | keyword |
| tafsir | "taf" | 2 | subtitle |
| hadith | "had" | 2 | keyword |
| quran audio | "quran a" | 1 | name `quran` + keyword `audio` |
| daily quran verses | exact suggestion | — | the name itself |

`verse` sits in keywords beside `verses` in the name because "quran verse" is
the category's strongest generic phrase, and Apple's plural matching is not
documented well enough to bet it on six characters.

`dua` never surfaced in autocomplete — its prefixes are crowded by unrelated
names — but the category's dua apps carry 8–12k ratings each, so the demand is
real and it stays.

## Tested and rejected — do not re-propose without new data

| Proposal | What autocomplete returned |
|---|---|
| `Quran for Anxiety` | nothing for "quran anx", "muslim anx", "islamic anx", "dua for anx" |
| `Islamic Mindfulness` | only other apps' names (Tazkiyah, Muraqaba) — no generic demand |
| `Emotional Well-being` | nothing for "islamic wellbeing"; "emotional well" returns six secular wellness apps |
| `Islamic Wellness` | autocompletes to **Sakina - Islamic Wellness**, the competitor already using this name (83 ratings) |

The last one matters beyond demand: "Sakina: Islamic Mindfulness" would sit
beside "Sakina - Islamic Wellness" in every search, and anyone half-remembering
"the Islamic wellness Sakina app" would install theirs.

## Deliberately NOT in keywords

- `widget` — strong demand, but Lock Screen Verses is a notification
  (`lockscreenVerseService.ts:2`). Apple rejects keywords for features an app
  does not have.
- `athan` / `adhan` — no adhan audio is verified in the app.
- `tasbih` — the dhikr counter lives inside journey practice steps; "tasbih
  counter" searchers want a standalone counter and would bounce.
- `transliteration` — never surfaced.
- `sakina`, `app`, `free` — already indexed or ignored; wasted characters.
- Competitor names — Apple rejects them.

## Release-note claims, checked

"New" means not in the LIVE build. Live 1.3 is **build 7, commit `50b38d4`**
(`eas build:list`), and every item below was checked with
`git merge-base --is-ancestor <commit> 50b38d4` returning false.

| Claim | Evidence |
|---|---|
| Screen Detox is new | 8dd7130, not an ancestor of 50b38d4 |
| seven days, free for everyone | `staticPaths.ts` `duration: 7`; absent from `PREMIUM_GATED_PATHS` on the branch |
| "reclaiming your attention for Allah" | the path's own `description` |
| Tawbah: ten days, now free | `duration: 10`; gated on `main`, ungated on the branch (8dd7130) |
| check-in sorted into two groups | f0974b9 |
| each mood keeps the same name everywhere | ddff5ef — Calm read "CALM" on one screen and "PEACEFUL" on others |
| sources credit transliteration and reciters | 726a844 |

**Corrected 2026-09-22.** The first draft of these notes dated "new" from
build 5 (30 Aug) without checking which build Apple released, and so listed
two things already live in 1.3: the 100+ new mood lessons (ce517db) and the
mobile-data Quran download fix (0a052dd). Both are ancestors of 50b38d4. Check
the shipped build's commit, not the version number, before writing notes.

Left out on purpose: the Mushaf RTL fix (0f8ccf3) is Android-only; the Hope
After Crisis journey (3f00cdb) is long live; the rating prompt is not a
feature; the word "reflections", because in the app that is the private
journal's name.
