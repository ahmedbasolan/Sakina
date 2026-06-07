# Guidance Options Modal — Auto-play & Background Theme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Guidance options modal the home for reading controls — review the language picker, add an opt-in Auto-play Recitation toggle, and add a premium Background Theme entry (moved out of Settings) — replacing the dead Sand/Ocean/Dawn placeholder.

**Architecture:** Add `autoPlayAudio` to the SQLite-backed `UserPreferences` (column + migration + service). Thread it through `GuidanceScreen → VerseLayer → AudioPlayerButton` (new `autoPlay` prop that plays once per verse). Reuse the existing `backgroundThemeService` + `BackgroundThemePicker`; open the picker from the modal (sequentially, not stacked) and feed the chosen image into `ImmersiveBackground` via its existing `imageUri` prop for live updates.

**Tech Stack:** React Native, expo-sqlite, expo-audio, expo-blur, core `Animated`, `StyleSheet`, DesignSystem tokens.

**Verification model:** This codebase has no RN-component test runner; per `CLAUDE.md` the gate is `npx tsc --noEmit -p tsconfig.json` (baseline = 11 pre-existing errors, none in touched files) plus a manual device pass. Each task ends with a typecheck + commit; Task 7 is the manual checklist.

---

### Task 1: Add `autoPlayAudio` to preferences (type, table, migration, service)

**Files:**
- Modify: `src/types/index.ts:241-244`
- Modify: `src/database/tables.ts:191-195`
- Modify: `src/database/migrations.ts` (append a step before the final `console.log`)
- Modify: `src/services/preferencesService.ts`
- Modify: `src/hooks/useGuidanceLogic.ts:41-44`

- [ ] **Step 1: Extend the `UserPreferences` interface**

In `src/types/index.ts`, change:
```ts
export interface UserPreferences {
  primaryLanguage: LanguagePreference;
  showTransliteration: boolean;
}
```
to:
```ts
export interface UserPreferences {
  primaryLanguage: LanguagePreference;
  showTransliteration: boolean;
  /** Auto-play recitation when a verse opens. Opt-in (default false). */
  autoPlayAudio: boolean;
}
```

- [ ] **Step 2: Add the column to the fresh-install table**

In `src/database/tables.ts`, change the `user_preferences` block:
```ts
    sql: `CREATE TABLE IF NOT EXISTS user_preferences (
      id TEXT PRIMARY KEY DEFAULT 'user_preferences',
      primaryLanguage TEXT NOT NULL DEFAULT 'english',
      showTransliteration INTEGER NOT NULL DEFAULT 1
    );`,
```
to:
```ts
    sql: `CREATE TABLE IF NOT EXISTS user_preferences (
      id TEXT PRIMARY KEY DEFAULT 'user_preferences',
      primaryLanguage TEXT NOT NULL DEFAULT 'english',
      showTransliteration INTEGER NOT NULL DEFAULT 1,
      autoPlayAudio INTEGER NOT NULL DEFAULT 0
    );`,
```

- [ ] **Step 3: Add the migration for existing installs**

In `src/database/migrations.ts`, immediately before the final
`console.log('[Migration] All steps completed successfully');` line, add:
```ts
  // 13. user_preferences: autoPlayAudio
  await runStep('user_preferences.autoPlayAudio', async () => {
    if (!(await hasColumn('user_preferences', 'autoPlayAudio'))) {
      console.log('[Migration] Adding autoPlayAudio to user_preferences...');
      await db.execAsync(
        `ALTER TABLE user_preferences ADD COLUMN autoPlayAudio INTEGER NOT NULL DEFAULT 0`,
      );
    }
  });
```

- [ ] **Step 4: Read/write the field in `PreferencesService`**

In `src/services/preferencesService.ts`:

Change the default:
```ts
  private preferences: UserPreferences = {
    primaryLanguage: 'english',
    showTransliteration: true,
  };
```
to:
```ts
  private preferences: UserPreferences = {
    primaryLanguage: 'english',
    showTransliteration: true,
    autoPlayAudio: false,
  };
```

Change the `loadPreferences` mapping:
```ts
        this.preferences = {
          primaryLanguage: prefs.primaryLanguage as LanguagePreference,
          showTransliteration: prefs.showTransliteration === 1,
        };
```
to:
```ts
        this.preferences = {
          primaryLanguage: prefs.primaryLanguage as LanguagePreference,
          showTransliteration: prefs.showTransliteration === 1,
          autoPlayAudio: prefs.autoPlayAudio === 1,
        };
```

Change `savePreferences`:
```ts
        await db.runAsync(
          `INSERT OR REPLACE INTO user_preferences (id, primaryLanguage, showTransliteration) 
           VALUES ('user_preferences', ?, ?)`,
          [prefs.primaryLanguage, prefs.showTransliteration ? 1 : 0],
        );
```
to:
```ts
        await db.runAsync(
          `INSERT OR REPLACE INTO user_preferences (id, primaryLanguage, showTransliteration, autoPlayAudio) 
           VALUES ('user_preferences', ?, ?, ?)`,
          [prefs.primaryLanguage, prefs.showTransliteration ? 1 : 0, prefs.autoPlayAudio ? 1 : 0],
        );
```

- [ ] **Step 5: Fix the in-hook default so the type compiles**

In `src/hooks/useGuidanceLogic.ts`, change:
```ts
  const [preferences, setPreferences] = useState<UserPreferences>({
    primaryLanguage: 'english',
    showTransliteration: true,
  });
```
to:
```ts
  const [preferences, setPreferences] = useState<UserPreferences>({
    primaryLanguage: 'english',
    showTransliteration: true,
    autoPlayAudio: false,
  });
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 11 errors total (pre-existing baseline); none referencing `UserPreferences`, `preferencesService`, `migrations`, `tables`, or `useGuidanceLogic`.

- [ ] **Step 7: Commit**

```bash
git add src/types/index.ts src/database/tables.ts src/database/migrations.ts src/services/preferencesService.ts src/hooks/useGuidanceLogic.ts
git commit -m "feat(prefs): add autoPlayAudio preference (type, table, migration, service)"
```

---

### Task 2: Add `autoPlay` to `AudioPlayerButton`

**Files:**
- Modify: `src/components/AudioPlayerButton.tsx`

- [ ] **Step 1: Add the prop to the interface**

In the `AudioPlayerButtonProps` interface, add after `iconSize?: number;`:
```ts
  /** When true, start recitation once per verse as soon as it mounts/changes. */
  autoPlay?: boolean;
```

- [ ] **Step 2: Destructure it**

In `AudioPlayerButtonInternal({ ... })`, add `autoPlay = false,` to the destructured props (next to `iconSize`).

- [ ] **Step 3: Auto-play effect (fires once per verse)**

In `AudioPlayerButtonInternal`, just after the existing `const player = AudioModule.useAudioPlayer(...)` / `status` lines, add:
```ts
  // Auto-play: start recitation once per verseKey when enabled. A ref guard
  // prevents re-firing on re-render or fighting a manual pause.
  const autoPlayedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!autoPlay || isLocked) return;
    if (autoPlayedKeyRef.current === verseKey) return;
    autoPlayedKeyRef.current = verseKey;
    const t = setTimeout(() => {
      try { player.play(); } catch { /* player not ready — ignore */ }
    }, 350);
    return () => clearTimeout(t);
    // player intentionally omitted from deps (stable per uri; mirrors this file's
    // other effects) so the timer keys only on verse change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, isLocked, verseKey]);
```
(`useRef`/`useEffect` are already imported at the top of the file.)

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 11 baseline errors; none in `AudioPlayerButton.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/components/AudioPlayerButton.tsx
git commit -m "feat(audio): add autoPlay prop to AudioPlayerButton"
```

---

### Task 3: Thread `autoPlayAudio` through `VerseLayer`

**Files:**
- Modify: `src/components/VerseLayer.tsx`

- [ ] **Step 1: Add the prop to `VerseLayerProps`**

In the `VerseLayerProps` interface, add after `audioKey?: string;`:
```ts
  /** Auto-play recitation when this verse opens (driven by user preference). */
  autoPlayAudio?: boolean;
```

- [ ] **Step 2: Destructure with a default**

In the `VerseLayer` component params, add `autoPlayAudio = false,` next to `audioKey,`.

- [ ] **Step 3: Forward to the audio button**

In the action-bar audio block, change:
```tsx
                <AudioPlayerButton
                  verseKey={audioKey}
                  size={34}
                  iconSize={22}
                  color="rgba(245, 237, 227, 0.8)"
                  showLabel={false}
                  containerStyle={styles.audioBtnInner}
                  style={styles.audioBtnReset}
                />
```
to:
```tsx
                <AudioPlayerButton
                  verseKey={audioKey}
                  size={34}
                  iconSize={22}
                  autoPlay={autoPlayAudio}
                  color="rgba(245, 237, 227, 0.8)"
                  showLabel={false}
                  containerStyle={styles.audioBtnInner}
                  style={styles.audioBtnReset}
                />
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 11 baseline errors; none in `VerseLayer.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/components/VerseLayer.tsx
git commit -m "feat(guidance): forward autoPlayAudio preference into VerseLayer"
```

---

### Task 4: Redesign `DisplayPreferencesModal`

**Files:**
- Modify (full replacement): `src/components/DisplayPreferencesModal.tsx`

- [ ] **Step 1: Replace the file contents**

Replace the entire file with:
```tsx
import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import { UserPreferences, LanguagePreference } from '../types';

interface DisplayPreferencesModalProps {
  isVisible: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreference: (newPrefs: Partial<UserPreferences>) => void;
  isPremium: boolean;
  /** Display name of the active background theme, or null for Default. */
  selectedThemeName: string | null;
  /** Open the full background-theme picker (parent closes this sheet first). */
  onOpenBackgroundPicker: () => void;
}

const Toggle: React.FC<{ value: boolean; onPress: () => void }> = ({ value, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.toggleBase, value && styles.toggleActive]}
    accessibilityRole="switch"
    accessibilityState={{ checked: value }}
  >
    <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
  </TouchableOpacity>
);

const DisplayPreferencesModal: React.FC<DisplayPreferencesModalProps> = ({
  isVisible,
  onClose,
  preferences,
  onUpdatePreference,
  isPremium,
  selectedThemeName,
  onOpenBackgroundPicker,
}) => {
  const setLanguage = (lang: LanguagePreference) => onUpdatePreference({ primaryLanguage: lang });

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              <View style={styles.header}>
                <Text style={styles.title}>READING OPTIONS</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={Colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* ── Primary language ── */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PRIMARY LANGUAGE</Text>
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={[styles.optionButton, preferences.primaryLanguage === 'english' && styles.optionButtonActive]}
                    onPress={() => setLanguage('english')}
                  >
                    <Ionicons
                      name="text-outline"
                      size={20}
                      color={preferences.primaryLanguage === 'english' ? Colors.background.primary : Colors.text.secondary}
                    />
                    <Text style={[styles.optionText, preferences.primaryLanguage === 'english' && styles.optionTextActive]}>
                      ENGLISH
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.optionButton, preferences.primaryLanguage === 'arabic' && styles.optionButtonActive]}
                    onPress={() => setLanguage('arabic')}
                  >
                    <Text style={[styles.arabicIcon, preferences.primaryLanguage === 'arabic' && styles.arabicIconActive]}>
                      ع
                    </Text>
                    <Text style={[styles.optionText, preferences.primaryLanguage === 'arabic' && styles.optionTextActive]}>
                      ARABIC
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── Recitation ── */}
              <View style={styles.section}>
                <View style={styles.switchRow}>
                  <View style={styles.switchLabelWrap}>
                    <Text style={styles.sectionTitle}>AUTO-PLAY RECITATION</Text>
                    <Text style={styles.sectionSubtitle}>Play recitation when a verse opens</Text>
                  </View>
                  <Toggle
                    value={preferences.autoPlayAudio}
                    onPress={() => onUpdatePreference({ autoPlayAudio: !preferences.autoPlayAudio })}
                  />
                </View>

                <View style={[styles.switchRow, { marginTop: Spacing.xl }]}>
                  <View style={styles.switchLabelWrap}>
                    <Text style={styles.sectionTitle}>TRANSLITERATION</Text>
                    <Text style={styles.sectionSubtitle}>Show phonetics under the Arabic</Text>
                  </View>
                  <Toggle
                    value={preferences.showTransliteration}
                    onPress={() => onUpdatePreference({ showTransliteration: !preferences.showTransliteration })}
                  />
                </View>
              </View>

              {/* ── Background (premium) ── */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>BACKGROUND</Text>
                <TouchableOpacity style={styles.backgroundRow} onPress={onOpenBackgroundPicker} activeOpacity={0.8}>
                  <Ionicons name="image-outline" size={20} color={Colors.accent.primary} />
                  <Text style={styles.backgroundValue} numberOfLines={1}>
                    {selectedThemeName ?? 'Default (Atmospheric Dark)'}
                  </Text>
                  {!isPremium && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="lock-closed" size={10} color={Colors.background.primary} />
                      <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color={Colors.text.muted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                <Text style={styles.doneButtonText}>DONE</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surfaceSheet,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 50 : Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: Typography.sizes.small,
    fontWeight: '700',
    color: Colors.accent.primary,
    letterSpacing: 2,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.detail - 1,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: Typography.sizes.detail,
    color: Colors.text.muted,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  optionButton: {
    flex: 1,
    height: 54,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionButtonActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  optionText: {
    fontSize: Typography.sizes.small - 3,
    fontWeight: '700',
    color: Colors.text.secondary,
    letterSpacing: 1,
  },
  optionTextActive: {
    color: Colors.background.primary,
  },
  arabicIcon: {
    fontSize: 18,
    color: Colors.text.secondary,
    fontFamily: Typography.fonts.arabic,
  },
  arabicIconActive: {
    color: Colors.background.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabelWrap: {
    flex: 1,
    paddingRight: Spacing.lg,
  },
  toggleBase: {
    width: 54,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 3,
  },
  toggleActive: {
    backgroundColor: Colors.accent.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.text.primary,
    transform: [{ translateX: 0 }],
  },
  toggleThumbActive: {
    transform: [{ translateX: 24 }],
  },
  backgroundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    height: 54,
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  backgroundValue: {
    flex: 1,
    fontSize: Typography.sizes.small - 2,
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: 0.3,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  premiumBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: Colors.background.primary,
  },
  doneButton: {
    backgroundColor: Colors.accent.primary,
    height: 54,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  doneButtonText: {
    color: Colors.background.primary,
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: Typography.sizes.small - 1,
  },
});

export default DisplayPreferencesModal;
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: GuidanceScreen will now error because it doesn't yet pass the 3 new props (`isPremium`, `selectedThemeName`, `onOpenBackgroundPicker`). That's expected — fixed in Task 5. The modal file itself must have no errors. (If you prefer a green checkpoint, do Task 5 before committing; otherwise commit now and fix in Task 5.)

- [ ] **Step 3: Commit**

```bash
git add src/components/DisplayPreferencesModal.tsx
git commit -m "feat(guidance): redesign options modal — auto-play toggle + background row, drop dead placeholder"
```

---

### Task 5: Wire `GuidanceScreen` — auto-play pref, live background, picker

**Files:**
- Modify: `src/screens/GuidanceScreen.tsx`

- [ ] **Step 1: Add imports**

After `import DisplayPreferencesModal from '../components/DisplayPreferencesModal';` add:
```ts
import BackgroundThemePicker from '../components/BackgroundThemePicker';
import { backgroundThemeService } from '../services/backgroundThemeService';
```

- [ ] **Step 2: Add state + theme loader**

Just below `const [isPrefsModalVisible, setIsPrefsModalVisible] = useState(false);` add:
```ts
  const [isThemePickerVisible, setIsThemePickerVisible] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [selectedThemeUri, setSelectedThemeUri] = useState<string | null>(null);
  const [selectedThemeName, setSelectedThemeName] = useState<string | null>(null);

  const refreshSelectedTheme = React.useCallback(async () => {
    if (!isPremium) return;
    const t = await backgroundThemeService.getSelectedTheme();
    setSelectedThemeId(t?.id ?? null);
    setSelectedThemeUri(t?.imageUri ?? null);
    setSelectedThemeName(t?.name ?? null);
  }, [isPremium]);

  useEffect(() => { refreshSelectedTheme(); }, [refreshSelectedTheme]);
```
(`useState`/`useEffect` are already imported; `React` is in scope for `React.useCallback`.)

- [ ] **Step 3: Feed the chosen image into `ImmersiveBackground`**

Change the opening tag:
```tsx
    <ImmersiveBackground mood={mood} isPremium={isPremium}>
```
to:
```tsx
    <ImmersiveBackground mood={mood} isPremium={isPremium} imageUri={selectedThemeUri ?? undefined}>
```

- [ ] **Step 4: Pass the auto-play preference into `VerseLayer`**

In the `<VerseLayer ... />` block, add `autoPlayAudio={preferences.autoPlayAudio}` next to `showTransliteration={preferences.showTransliteration}`.

- [ ] **Step 5: Pass the new props into the options modal**

Change:
```tsx
      <DisplayPreferencesModal
        isVisible={isPrefsModalVisible}
        onClose={() => setIsPrefsModalVisible(false)}
        preferences={preferences}
        onUpdatePreference={updatePreference}
      />
```
to:
```tsx
      <DisplayPreferencesModal
        isVisible={isPrefsModalVisible}
        onClose={() => setIsPrefsModalVisible(false)}
        preferences={preferences}
        onUpdatePreference={updatePreference}
        isPremium={isPremium}
        selectedThemeName={selectedThemeName}
        onOpenBackgroundPicker={() => {
          setIsPrefsModalVisible(false);
          setIsThemePickerVisible(true);
        }}
      />

      <BackgroundThemePicker
        isVisible={isThemePickerVisible}
        onClose={() => { setIsThemePickerVisible(false); refreshSelectedTheme(); }}
        isPremium={isPremium}
        selectedThemeId={selectedThemeId}
        onSelectTheme={async (themeId) => {
          await backgroundThemeService.setSelectedTheme(themeId);
          await refreshSelectedTheme();
        }}
      />
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: back to 11 baseline errors; none in `GuidanceScreen.tsx` or `DisplayPreferencesModal.tsx`.

- [ ] **Step 7: Commit**

```bash
git add src/screens/GuidanceScreen.tsx
git commit -m "feat(guidance): wire auto-play preference + live premium background into Guidance"
```

---

### Task 6: Remove the background picker from Settings

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`

- [ ] **Step 1: Read the current usage**

Open `src/screens/SettingsScreen.tsx` and locate: the `BackgroundThemePicker` import (line ~24), the `backgroundThemeService` import (line ~23), the `selectedTheme` state and its `getSelectedTheme()` load effect (around line ~97), the row/button in the JSX that opens the picker, and the `<BackgroundThemePicker .../>` element (around lines ~325-335).

- [ ] **Step 2: Remove them**

Delete, in `SettingsScreen.tsx`:
- the `import BackgroundThemePicker from '../components/BackgroundThemePicker';` line,
- the `import { backgroundThemeService } from '../services/backgroundThemeService';` line,
- the `selectedTheme` state declaration and the `useEffect`/loader that calls `backgroundThemeService.getSelectedTheme()`,
- the `showThemePicker` (or equivalent) visibility state,
- the settings **row/list item** that opens the theme picker (the `TouchableOpacity` whose press sets the picker visible),
- the `<BackgroundThemePicker ... />` element near the end of the render.

Leave all other Settings rows and styles intact. (Theme selection still persists via `backgroundThemeService`; Settings simply no longer sets it.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 11 baseline errors; none in `SettingsScreen.tsx` (no unused-import or undefined-reference errors). If tsc reports an unused variable it won't fail the build (noUnusedLocals is off), but remove any now-dead `selectedTheme`/handler code you left behind.

- [ ] **Step 4: Commit**

```bash
git add src/screens/SettingsScreen.tsx
git commit -m "refactor(settings): move background-theme picker to the Guidance options modal"
```

---

### Task 7: Manual verification (device/Expo)

**Files:** none (verification only)

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: 11 errors total, all pre-existing (App.tsx ×2, seedContent, rotationEngine.test ×2, contentRepository ×2, subscriptionService, sunnahEnricher, verify_seeding ×2). None in any file touched by this plan.

- [ ] **Step 2: Auto-play (free + premium)**

Open a mood → Guidance. Open the gear → toggle **Auto-play Recitation ON** → close. Swipe to the next verse: recitation should start automatically (~0.3s after it appears). Toggle **OFF** → next verse opens silently. Manual tap of the speaker still plays/pauses. Re-open the app → the toggle state persisted.

- [ ] **Step 3: Background theme (premium)**

As a premium user, open the gear → tap **Background** → the options sheet closes and the picker opens → choose a theme → close. The Guidance background updates **live** to that image. Re-enter Guidance → it persists. Choose **Default** → reverts to the atmospheric gradient.

- [ ] **Step 4: Background theme (free)**

As a free user, the **Background** row shows a **PREMIUM** badge; opening the picker shows locked thumbnails + upsell; selecting **Default** works.

- [ ] **Step 5: Settings**

Open Settings → the background-theme row is gone; everything else works; no crash.

- [ ] **Step 6: Language picker (regression)**

Switch Primary Language English↔Arabic and toggle Transliteration — both still apply to the verse as before.

---

## Self-review notes (addressed)

- **Spec coverage:** language review (Task 4/7-6), auto-play toggle (Tasks 1-5), background entry + premium gate + Settings removal (Tasks 4-6), dead placeholder removed (Task 4), teal→gold button (Task 4). All covered.
- **Type consistency:** `autoPlayAudio: boolean` is defined once (Task 1) and read identically in the service, hook default, modal, VerseLayer, and AudioPlayerButton. `BackgroundThemePicker` props (`isVisible`, `onClose`, `isPremium`, `selectedThemeId`, `onSelectTheme`) match its existing interface. `ImmersiveBackground.imageUri` is an existing prop.
- **Sequencing caveat:** Task 4 leaves a temporary type error (modal needs props GuidanceScreen passes in Task 5). Either run 4+5 back-to-back before relying on a green checkpoint, or accept the documented red between them.
