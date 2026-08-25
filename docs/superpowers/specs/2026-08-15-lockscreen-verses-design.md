# Lock Screen Verses — Design

**Date:** 2026-08-15
**Status:** Design approved, not implemented
**Premium:** Yes — gated on `freemium.isPremium()`

Premium users receive a verse on the lock screen at each of the three
spiritual windows, over a curated background photo of their choosing.

---

## 1. Delivery mechanism

**Rich local notifications**, not a WidgetKit lock screen widget.

Two approaches were rejected, both for hard reasons worth recording so they
are not re-proposed later:

- **Lock Screen Widget (WidgetKit).** iOS renders accessory-family widgets
  desaturated and monochrome by system design, so a **background image is
  impossible** — that is an OS constraint, not an effort budget. The text
  budget also cannot hold a complete ayah, which collides with the Quran
  rule below. It additionally needs a Swift widget extension, an App Group,
  a config plugin and a custom dev client, none of which are reachable
  without a Mac.
- **Setting the wallpaper directly.** iOS has never exposed a
  set-wallpaper API. Any wallpaper flow is necessarily "save image, user
  applies it manually" and cannot be scheduled.

Notifications appear on the lock screen, carry an image attachment, and work
entirely within the Expo managed workflow.

### Notification budget: zero net cost

`notificationService` already schedules three spiritual reminders per day
across seven days (21 pending). This feature **changes their payload, not
their count**. Current usage stays at 57 of the iOS 64-pending cap, as pinned
by the budget test in `notificationService.test.ts`.

Do not add a fourth window without revisiting that test — it exists precisely
to stop a silent overflow.

---

## 2. The attachment is the background photo, not a rendered card

The notification attachment is the **chosen curated photo as a bundled
asset**. The verse text lives in the notification title and body.

This is load-bearing, not an aesthetic call. Baking the verse into the image
requires `captureRef`, which needs a **mounted view** and therefore cannot run
inside a background task. Since the weekly re-schedule runs in the background,
a render-per-notification design would break the moment the app was not
foregrounded. A static bundled photo plus a text body needs no rendering, no
image cache, and no invalidation.

Resolve the asset to a local URI via `expo-asset` (`Asset.fromModule(...)`,
`downloadAsync()`, then `localUri`) at schedule time.

**If the verse must be baked into the image**, that is the separate
"save as wallpaper" action, which runs while the app is open and can reuse
`ShareSheet`'s existing renderer. It is out of scope here.

---

## 3. Backgrounds — reuse, build nothing

`backgroundThemeService.ts` already ships **28 `BackgroundTheme` entries, all
of them premium**, across 6 categories (sky / mountains / nature / landscapes /
ocean / animals), and `ShareSheet` already renders a picker over them.

> Corrected 2026-08-15: an earlier revision of this section said "34 themes,
> 28 premium, 6 free". That was `THEME_CATEGORIES`' six ids being counted as
> themes. There are **no free themes**, which is why the background fallback
> in `lockscreenVerseService` does not filter on `isPremium` — the feature is
> premium-gated, so any theme is legitimate for a user who reaches it.

- No new assets.
- No new picker component.
- Same `BackgroundTheme` type from `types/index.ts`.

Curated-only is a deliberate choice over user photo libraries: reading the
photo library would add a data type to the **App Privacy declaration**, which
currently declares no photo access at all. The app only ever *writes* verse
cards. Keep it that way.

---

## 4. Verse selection — window-seeded, extending `dailyVerseService`

Selection stays in `dailyVerseService`, extended from one verse per day to one
verse per **(day, window)** pair:

```
selectVerseIndex(`${dateKey}:${window}`, recentIndices)
```

Same `VERSE_POOL`, same `dateHash`, same forward-walk collision handling. The
daily verse of the day keeps its current behaviour and seed.

### The pool cannot support a 30-day no-repeat window at 3/day

`VERSE_POOL` holds **52 verses**; `HISTORY_WINDOW` is **30 entries**. Today
that is 30 entries for 30 days. At three verses per day, matching that
guarantee would need 90 history entries — more than the pool contains. Setting
`HISTORY_WINDOW = 90` would mark every verse recent, collapse the forward walk,
and hit the `return base` fallback, silently reintroducing repeats. The
existing comment on that fallback ("POOL_SIZE stays well above HISTORY_WINDOW")
is exactly the invariant that would break.

**Resolution — two scopes instead of one:**

1. **Within a day: three distinct verses, guaranteed.** The three window
   selections for one `dateKey` must not collide. Enforce explicitly rather
   than relying on hash spread.
2. **Across days: rolling history of ~36 entries (≈12 days).** Keeps
   `HISTORY_WINDOW` comfortably under `POOL_SIZE` so the forward walk always
   terminates on a real candidate.

This is a genuine reduction from the current 30-day cross-day guarantee, and
it is the honest cost of tripling the draw rate against a fixed pool.

**To restore a 30-day window, the pool must grow to ~100 verses.** Every added
ayah must be the complete verse verified against
`api.alquran.cloud/v1/ayah/{s}:{a}/editions/quran-uthmani,en.sahih`, fetched
and read as raw JSON — never `WebFetch`, never from memory. Note the pool
deliberately excludes 2:185 and 2:286 for length; that exclusion logic applies
here too.

---

## 5. Quran rules — how this feature stays compliant

The notification body carries the **complete ayah**, never a clause
(CLAUDE.md rule 1).

iOS collapses a long notification body to roughly four lines and expands it
fully on tap. That is the **collapsed-preview-with-tap-to-expand** pattern
which rule 4 explicitly permits — the complete ayah remains genuinely
reachable. It is *not* a banned permanent clamp.

Where an ayah is too long to read well even expanded, **swap the verse; never
cut it** (rule 3).

---

## 6. Setup UX

### Entry point A — `ShareSheet` background picker

Beneath the selected photo theme at `ShareSheet.tsx:490`, add:

> **Also use on Lock Screen** — [toggle]

Reuses the theme the user just chose. Tapping through for the first time opens
the setup screen below with that theme pre-selected.

### Entry point B — Settings

New row in `SettingsScreen`, near the existing notification rows:

> **Lock Screen Verses** — Premium

Opens a dedicated setup screen:

| Control | Default | Notes |
|---|---|---|
| Master toggle | Off | Gates everything below |
| Tahajjud | On | 1 hour before Fajr |
| Morning adhkar | On | At sunrise |
| Evening adhkar | On | Existing window timing |
| Background | Lock screen choice, else ShareSheet theme, else `BACKGROUND_THEMES[0]` | Reuses the existing picker |
| Show transliteration | **Off** | See §7 |

Per-window toggles matter: Tahajjud fires roughly an hour before Fajr, and
some users will want the other two without a pre-dawn notification.

### Non-premium state

Row is visible but locked, matching the existing premium affordances. Tapping
routes to the `Support` screen (`SupportSakinaScreen`), consistent with the
other upgrade entry points.

Follow the existing `isPremium` reset discipline from `ShareSheet.tsx:160` —
when premium lapses, clear the stored lock screen preference rather than
leaving a premium theme selected.

---

## 7. Transliteration

**Off by default.** Toggled per §6.

- Off: Arabic + English translation
- On: Arabic + transliteration + English translation

Transliteration is a display concern only; it does not affect verse selection
or the notification schedule.

---

## 8. Screen layout checklist

The setup screen is a new screen and must satisfy the standard checklist:
`Spacing` tokens throughout, `useSafeAreaInsets()`, one primary CTA, bare nav
icons with 44pt `hitSlop` and no circular containers, `FlatList` for the theme
grid, and motion inside the `Animations.timing` bands honouring
`useReduceMotion`.

---

## 9. Before calling this done

1. `npx tsc --noEmit -p tsconfig.json`
2. `npx jest` — including the pending-notification budget test, which must
   still show 57 and not 78
3. Assert three **distinct** verses for a single `dateKey` across the three
   windows — this is the check the pool-size constraint in §4 exists for, and
   it must be shown to fail against a naive `HISTORY_WINDOW = 90` before it is
   trusted passing
4. Confirm the notification body renders the **complete** ayah on a real
   device, expanded — not a `numberOfLines`-style clip
5. Verify a lapsed premium user's stored theme is cleared
6. Device-verify on a physical iPhone: notification delivery at each window,
   attachment rendering, and expansion behaviour

Items 4 and 6 cannot be confirmed from a typecheck.
