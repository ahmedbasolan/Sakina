# Sakina

An offline-first React Native app that delivers verified Qur'an, Sunnah, and Prophetic practice based on a user-selected mood, plus multi-day spiritual journeys.

## Core Features

- **Offline-First**: Fully functional without internet connection using local SQLite database
- **9 Moods**: Overwhelmed, Sad, Angry, Tired, Lonely, Grateful, Hopeful, Guilty, Calm
- **Verified Content**: Curated Qur'an verses, Hadith, and Duʿāʾ with proper sources
- **Paths**: Structured multi-step guidance for deeper engagement
- **Freemium Model**: Free tier allows 3 refreshes per prayer window, 30 saved items and 30 days of history; Pro removes these limits
- **Anti-Repetition Engine**: Ensures content doesn't repeat with 7-day cooldown
- **Simple Flow**: Focused user experience without distraction
- **Local Reflections**: Save personal reflections locally

## Architecture

### Tech Stack

- **Frontend**: React Native with Expo
- **Database**: SQLite (expo-sqlite) locally; Supabase (Postgres) for optional account sync
- **Purchases**: RevenueCat (`react-native-purchases`)
- **Crash reports**: PostHog, opt-in only (see Privacy)
- **Language**: TypeScript
- **Styling**: React Native StyleSheet

### Project Structure

```
src/
├── components/          # Reusable UI components
├── config/              # App configuration
├── constants/           # Shared constants and freemium limits
├── context/             # React contexts (app, auth, theme)
├── data/                # Static content (quranData, hadithData, staticPaths)
├── database/            # Local SQLite layer
│   ├── tables.ts        # DDL
│   ├── migrations.ts    # Schema versioning
│   ├── operations.ts    # Queries + clearAllLocalUserData()
│   └── seedContent.ts   # Content seeding (SEED_VERSION lives here)
├── hooks/               # Custom hooks
├── navigation/          # MainNavigator + route types
├── screens/             # 18 screens (Home, Guidance, Paths, PathStep, ...)
├── services/            # Business logic
│   ├── rotationEngine.ts      # Anti-repetition
│   ├── freemiumService.ts     # Free/Pro limits
│   ├── pathsService.ts        # Journey progress
│   └── supabaseDataService.ts # Optional cloud sync
├── theme/               # DesignSystem.ts (all visual tokens)
├── types/               # TypeScript definitions
└── utils/               # Helpers
```

## Database Schema

### Tables

Content: `content`, `content_angles`, `content_moods`, `spiritual_paths`,
`path_steps`, `audio_content`, `quran_cache`, `collections`.

Personal: `user_history`, `saved_reflections`, `reflections`,
`bookmarked_verses`, `user_path_progress`, `user_sessions`,
`user_subscription`, plus the personal keys in `kv_store`.

Device settings: `user_preferences` (language, transliteration, madhab).

The personal tables and `kv_store` keys are the ones `clearAllLocalUserData()`
empties on account deletion; device settings deliberately survive it. Adding a
table that holds personal data means adding it there and to the `PERSONAL` list
in `scripts/verify-local-wipe.mjs` (a personal `kv_store` key goes in
`PERSONAL_KV`).

### Anti-Repetition Logic

The rotation engine ensures:

- Same verse + angle combination never repeats within 7-day cooldown
- Tracks `contentId`, `angleId`, `mood`, and `timestamp`
- Falls back to least recently shown content if all options are in cooldown

## Privacy & Data Persistence

**Local-first. Nothing leaves the device unless you sign in.**

- **No usage analytics, tracking or ads**: there is no advertising or tracking
  SDK, and no usage analytics. The one third-party reporting service is
  PostHog, used **only for crash and error reports**, and **off by default**: it
  sends nothing unless the user turns on "Share Crash Reports" in Settings. Even
  then only exception events are sent (app-lifecycle events are disabled), and
  `errorLoggingService` scrubs credentials and tokens before sending.
- **Guest mode is fully local**: without an account, reflections, history and
  preferences stay in the on-device SQLite database and never leave the phone.
- **Optional account sync**: signing in syncs mood history, journey progress
  and the profile with its subscription status to Supabase, so they survive a
  reinstall or a device change. **Reflections are never synced**, signed in or
  not. Local-row ownership is tracked in `kv_store`'s `local_data_owner` so one
  account's data is never uploaded under another.
- **Account deletion** clears the server copy, then wipes the personal tables
  on-device via `clearAllLocalUserData()`.
- **At rest**: the local SQLite database is **not** encrypted. It relies on
  OS-level app sandboxing, not on database encryption.

## User Flow

1. **Home Screen**: Mood selection & session limits indicator
2. **Mood Selection**: User selects a mood
3. **Limit Check**: Checks the free tier's refreshes for the current prayer window
4. **Content Delivery**: Rotation engine selects optimal content
5. **Guidance Experience**: Read content, reflection, or follow a path
6. **Reflection**: Optional local save

## Getting Started

### Prerequisites

- Node.js
- Expo CLI

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the app:

```bash
npm start
```

## License

[Add your license here]

---

**Note**: This app is designed to provide spiritual guidance and is not a substitute for professional mental health services, religious counseling, or medical advice.
