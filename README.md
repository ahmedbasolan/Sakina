# Islamic Mood-Based Guidance App

A minimal, offline-first mobile app that delivers verified Qur'an, Sunnah, and Prophetic practices based on a user-selected mood, with structured learning paths.

## Core Features

- **Offline-First**: Fully functional without internet connection using local SQLite database
- **8 Moods**: Anxious, Sad, Angry, Guilty, Grateful, Happy, Hopeful, Calm
- **Verified Content**: Curated Qur'an verses, Hadith, and Duʿāʾ with proper sources
- **Paths**: Structured multi-step guidance for deeper engagement
- **Freemium Model**: Daily free guidance limits with Premium unlock options
- **Anti-Repetition Engine**: Ensures content doesn't repeat with 7-day cooldown
- **Simple Flow**: Focused user experience without distraction
- **Local Reflections**: Save personal reflections locally

## Architecture

### Tech Stack

- **Frontend**: React Native with Expo
- **Database**: SQLite (expo-sqlite)
- **Language**: TypeScript
- **Styling**: React Native StyleSheet

### Project Structure

```
src/
├── components/          # Reusable UI components
├── database/            # Database layer
│   ├── schema.ts        # Database schema and initialization
│   └── seedData.ts      # Mock data seeding
├── data/                # Static data
├── navigation/          # Navigation logic
│   └── MainNavigator.tsx # Main app navigator
├── screens/             # App screens
│   ├── HomeScreen.tsx   # Mood selection screen
│   ├── GuidanceScreen.tsx # Guidance display screen
│   ├── PathsScreen.tsx  # Learning paths
│   └── PaywallScreen.tsx # Premium upgrade screen
├── services/            # Business logic
│   ├── rotationEngine.ts # Anti-repetition logic
│   └── freemiumService.ts # Premium/Free limits logic
└── types/               # TypeScript definitions
```

## Database Schema

### Tables

1. **content** - Primary content (Qur'an, Hadith, Duʿāʾ)
2. **content_angles** - Mood-specific angles and actions
3. **content_moods** - Many-to-many relationship between content and moods
4. **user_history** - Track shown content for anti-repetition
5. **saved_reflections** - User-saved reflections
6. **user_subscription** - Tracks subscription status

### Anti-Repetition Logic

The rotation engine ensures:

- Same verse + angle combination never repeats within 7-day cooldown
- Tracks `contentId`, `angleId`, `mood`, and `timestamp`
- Falls back to least recently shown content if all options are in cooldown

## Privacy & Data Persistence

**This app is strictly local-only.**

- **No Data Collection**: We do not collect, track, or analyze any user data.
- **Local Storage**: All your reflections, history, and preferences are stored securely on your device using an encrypted SQLite database.
- **Data Ownership**: Your data belongs to you. Uninstalling the app will permanently delete all your data as it is not synced to any cloud server.

## User Flow

1. **Home Screen**: Mood selection & session limits indicator
2. **Mood Selection**: User selects a mood
3. **Paywall Check**: Checks daily limits (Freemium)
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
