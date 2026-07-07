# Shareable Verse Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `ShareSheet`'s preview card actually shareable/savable as a real image for every user, and let premium users pick one of the existing nature-photo backgrounds (already used on the Guidance screen) instead of a flat gradient.

**Architecture:** Extract two pure helpers (`resolveCardBackground`, `buildShareText`) into a new `src/utils/shareCard.ts` so the theme/text logic is unit-testable (matching this codebase's existing convention of testing logic, not RN rendering). Wrap the preview card in `react-native-view-shot`'s `ViewShot` to capture a real PNG at share/save time, hand that PNG to `Share.share` (iOS) / `expo-sharing` (Android) or `expo-media-library` (Save Image). Reuse `BackgroundThemePicker` + `BACKGROUND_THEMES` verbatim for the premium photo backgrounds — no new assets, no new gating logic.

**Tech Stack:** React Native (Expo, `expo-dev-client`), TypeScript, Jest (`jest-expo` preset), `react-native-view-shot`, `expo-sharing`, `expo-media-library`.

Spec: `docs/superpowers/specs/2026-07-07-shareable-verse-image-design.md`

---

### Task 1: Native dependencies + Expo config

**Files:**
- Modify: `package.json` (via `npx expo install`, not a manual edit)
- Modify: `app.json`

- [ ] **Step 1: Install the three native modules**

Run:
```bash
npx expo install react-native-view-shot expo-sharing expo-media-library
```
Expected: `package.json` and `package-lock.json` gain entries for `react-native-view-shot`, `expo-sharing`, `expo-media-library` at versions `expo install` resolves as compatible with the installed Expo SDK (54.x).

- [ ] **Step 2: Register the `expo-media-library` config plugin**

`expo-media-library` needs a plugin entry to inject the iOS photo-library permission string. `expo-sharing` and `react-native-view-shot` need no plugin (no Info.plist strings, no Android permission beyond what's already granted by the OS share intent).

In `app.json`, find:
```json
      "expo-location",
      "expo-background-task"
    ],
```
Replace with:
```json
      "expo-location",
      "expo-background-task",
      [
        "expo-media-library",
        {
          "photosPermission": "Sakina saves the verse cards you create to your photo library.",
          "savePhotosPermission": "Sakina saves the verse cards you create to your photo library."
        }
      ]
    ],
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json app.json
git commit -m "chore: add view-shot, sharing, media-library deps for verse image sharing"
```

Note: these are native modules. `npx tsc --noEmit` and Jest will pass without a rebuild, but the app itself needs a new `expo-dev-client` build (EAS) before any of this code runs on a device — bundle it with the OAuth/notification-fix rebuild already pending, per project notes. Nothing in this task is device-testable yet.

---

### Task 2: `shareCard.ts` — pure theme/text helpers (TDD)

**Files:**
- Create: `src/utils/shareCard.ts`
- Test: `src/utils/__tests__/shareCard.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/__tests__/shareCard.test.ts`:

```typescript
import { resolveCardBackground, buildShareText, CardTheme } from '../shareCard';
import { BackgroundTheme } from '../../types';

const purpleTheme: CardTheme = { id: 'purple', colors: ['#C4B5FD', '#8B5CF6'], label: 'Royal' };
const whiteTheme: CardTheme = {
  id: 'white',
  colors: ['#FFFFFF', '#F3F4F6'],
  label: 'Pearl',
  textColor: '#1F2937',
};
const photoTheme: BackgroundTheme = {
  id: 'sky_milky_way',
  name: 'Milky Way',
  category: 'sky',
  imageSource: 1,
  isPremium: true,
};

describe('resolveCardBackground', () => {
  it('returns the gradient theme when no photo theme is selected', () => {
    const result = resolveCardBackground(purpleTheme, null, true);
    expect(result).toEqual({
      kind: 'gradient',
      colors: purpleTheme.colors,
      textColor: '#FFFFFF',
      subTextColor: 'rgba(255, 255, 255, 0.8)',
    });
  });

  it('uses the theme textColor override for light gradients', () => {
    const result = resolveCardBackground(whiteTheme, null, true);
    expect(result.textColor).toBe('#1F2937');
    expect(result.subTextColor).toBe('rgba(31, 41, 55, 0.7)');
  });

  it('returns the photo background for a premium user with a selected photo theme', () => {
    const result = resolveCardBackground(purpleTheme, photoTheme, true);
    expect(result).toEqual({
      kind: 'photo',
      imageSource: photoTheme.imageSource,
      textColor: '#FFFFFF',
      subTextColor: 'rgba(255, 255, 255, 0.8)',
    });
  });

  it('falls back to the gradient for a non-premium user even with a photo theme selected', () => {
    const result = resolveCardBackground(purpleTheme, photoTheme, false);
    expect(result.kind).toBe('gradient');
  });
});

describe('buildShareText', () => {
  const content = {
    text: 'In the name of Allah, the Most Gracious, the Most Merciful.',
    source: 'Surah Al-Fatihah 1:1',
    arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    transliteration: 'Bismillahir Rahmanir Raheem',
  };

  it('includes only the English text when only English is toggled on', () => {
    const result = buildShareText(content, {
      showEnglish: true,
      showArabic: false,
      showTransliteration: false,
    });
    expect(result).toBe(`"${content.text}"\n\n\n${content.source}\n\nShared via Sakina`);
  });

  it('includes Arabic and transliteration when toggled on', () => {
    const result = buildShareText(content, {
      showEnglish: true,
      showArabic: true,
      showTransliteration: true,
    });
    expect(result).toBe(
      `"${content.text}"\n\n${content.arabicText}\n(${content.transliteration})\n\n${content.source}\n\nShared via Sakina`,
    );
  });

  it('omits Arabic/transliteration lines when the content lacks them even if toggled on', () => {
    const result = buildShareText(
      { text: content.text, source: content.source },
      { showEnglish: true, showArabic: true, showTransliteration: true },
    );
    expect(result).toBe(`"${content.text}"\n\n\n${content.source}\n\nShared via Sakina`);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest src/utils/__tests__/shareCard.test.ts`
Expected: FAIL — `Cannot find module '../shareCard'`

- [ ] **Step 3: Implement `shareCard.ts`**

Create `src/utils/shareCard.ts`:

```typescript
import { ImageSourcePropType } from 'react-native';
import { BackgroundTheme } from '../types';

export interface CardTheme {
  id: string;
  colors: [string, string, ...string[]];
  label: string;
  textColor?: string;
}

export type CardBackground =
  | { kind: 'gradient'; colors: [string, string, ...string[]]; textColor: string; subTextColor: string }
  | { kind: 'photo'; imageSource: ImageSourcePropType; textColor: string; subTextColor: string };

/**
 * Resolves what the share-card preview should render as its background.
 * Premium nature-photo backgrounds only apply when `isPremium` is true — a
 * lapsed subscriber with a stale `selectedPhotoTheme` in state falls back to
 * the gradient instead of rendering a background they can no longer pick.
 */
export function resolveCardBackground(
  selectedTheme: CardTheme,
  selectedPhotoTheme: BackgroundTheme | null,
  isPremium: boolean,
): CardBackground {
  if (isPremium && selectedPhotoTheme) {
    return {
      kind: 'photo',
      imageSource: selectedPhotoTheme.imageSource,
      textColor: '#FFFFFF',
      subTextColor: 'rgba(255, 255, 255, 0.8)',
    };
  }
  return {
    kind: 'gradient',
    colors: selectedTheme.colors,
    textColor: selectedTheme.textColor || '#FFFFFF',
    subTextColor: selectedTheme.textColor ? 'rgba(31, 41, 55, 0.7)' : 'rgba(255, 255, 255, 0.8)',
  };
}

export interface ShareTextContent {
  text: string;
  source: string;
  arabicText?: string;
  transliteration?: string;
}

export interface ShareTextToggles {
  showEnglish: boolean;
  showArabic: boolean;
  showTransliteration: boolean;
}

/** Builds the plain-text share payload from the toggled-on content sections. */
export function buildShareText(content: ShareTextContent, toggles: ShareTextToggles): string {
  let shareText = '';
  if (toggles.showEnglish) shareText += `"${content.text}"\n\n`;
  if (toggles.showArabic && content.arabicText) shareText += `${content.arabicText}\n`;
  if (toggles.showTransliteration && content.transliteration)
    shareText += `(${content.transliteration})\n`;
  shareText += `\n${content.source}\n\nShared via Sakina`;
  return shareText;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest src/utils/__tests__/shareCard.test.ts`
Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add src/utils/shareCard.ts src/utils/__tests__/shareCard.test.ts
git commit -m "feat: extract card background and share-text logic into testable helpers"
```

---

### Task 3: `ShareSheet.tsx` — real image capture, share, and save

**Files:**
- Modify: `src/components/ShareSheet.tsx`

This task makes every share/save action operate on a real captured PNG instead of text-only deep links. It does not yet touch premium photo backgrounds (Task 4) or the `isPremium`/`onUpgrade` props (also Task 4) — kept separate so each commit is a coherent, reviewable unit.

- [ ] **Step 1: Swap imports — drop `Linking`, add capture/share modules, import `CardTheme` from the new helper module**

Find:
```typescript
import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Share,
  Linking,
  Platform,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Spacing, Typography } from '../theme/DesignSystem';
```
Replace:
```typescript
import React, { useRef, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Share,
  Platform,
  Clipboard,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Spacing, Typography } from '../theme/DesignSystem';
import { buildShareText, CardTheme } from '../utils/shareCard';
```

- [ ] **Step 2: Delete the local `CardTheme` interface (now imported from `shareCard.ts`)**

Find:
```typescript
interface CardTheme {
  id: string;
  colors: [string, string, ...string[]];
  label: string;
  textColor?: string;
}

const CARD_THEMES: CardTheme[] = [
```
Replace:
```typescript
const CARD_THEMES: CardTheme[] = [
```

- [ ] **Step 3: Add the `ViewShot` ref**

Find:
```typescript
  // Personalization State
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>(CARD_THEMES[2]); // Default Purple
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
```
Replace:
```typescript
  // Personalization State
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>(CARD_THEMES[2]); // Default Purple
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const viewShotRef = useRef<ViewShot>(null);
```

- [ ] **Step 4: Replace `handleAction` with the real capture/share/save implementation**

Find (the entire existing function):
```typescript
  const handleAction = async (action: string) => {
    let shareText = '';
    if (showEnglish) shareText += `"${content.text}"\n\n`;
    if (showArabic && content.arabicText) shareText += `${content.arabicText}\n`;
    if (showTransliteration && content.transliteration)
      shareText += `(${content.transliteration})\n`;
    shareText += `\n${content.source}\n\nShared via Sakina`;

    try {
      if (action === 'whatsapp') {
        const url = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) return Linking.openURL(url);
      } else if (action === 'telegram') {
        const url = `tg://msg?text=${encodeURIComponent(shareText)}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) return Linking.openURL(url);
      } else if (action === 'messages') {
        const url = `sms:&body=${encodeURIComponent(shareText)}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) return Linking.openURL(url);
      } else if (action === 'instagram') {
        // Instagram doesn't support pre-filled text — open the app and let the user paste
        const url = 'instagram://app';
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          Clipboard.setString(shareText);
          return Linking.openURL(url);
        }
      } else if (action === 'copy_text') {
        Clipboard.setString(shareText);
        onClose();
        return;
      }

      // Fallback: system share sheet
      await Share.share({ message: shareText });
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      onClose();
    }
  };
```
Replace:
```typescript
  /** Captures the preview card (whatever background/content is currently
   *  showing) to a local PNG file. Called lazily at share/save time rather
   *  than on every render so theme/toggle changes don't trigger disk I/O. */
  const captureCardImage = async (): Promise<string> => {
    const uri = await viewShotRef.current?.capture?.();
    if (!uri) throw new Error('Failed to capture share card');
    return uri;
  };

  const handleAction = async (action: string) => {
    const shareText = buildShareText(content, {
      showEnglish,
      showArabic,
      showTransliteration,
    });

    try {
      if (action === 'copy_text') {
        Clipboard.setString(shareText);
        return;
      }

      if (action === 'save_image') {
        const uri = await captureCardImage();
        const permission = await MediaLibrary.requestPermissionsAsync();
        if (permission.granted) {
          await MediaLibrary.saveToLibraryAsync(uri);
        }
        return;
      }

      // Every social target (WhatsApp/Telegram/Messages/Instagram) and the
      // "more" fallback share the captured image the same way: URL schemes
      // like whatsapp:// can only carry text, never a file, so the only way
      // to hand a real image to a specific app is the OS's own share sheet —
      // the user picks the app from there themselves.
      const uri = await captureCardImage();
      if (Platform.OS === 'ios') {
        await Share.share({ url: uri, message: shareText });
      } else {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: shareText });
      }
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      onClose();
    }
  };
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: no new errors. (`viewShotRef` is referenced in `captureCardImage` but not yet attached to any JSX element — that's fine, it's wired up in Task 4; an unattached ref is not a type error.)

- [ ] **Step 6: Commit**

```bash
git add src/components/ShareSheet.tsx
git commit -m "feat: capture and share the verse card as a real image instead of text-only deep links"
```

---

### Task 4: `ShareSheet.tsx` — premium photo backgrounds + `isPremium`/`onUpgrade` props

**Files:**
- Modify: `src/components/ShareSheet.tsx`

- [ ] **Step 1: Add the new imports**

Find:
```typescript
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Spacing, Typography } from '../theme/DesignSystem';
import { buildShareText, CardTheme } from '../utils/shareCard';
```
Replace:
```typescript
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, BorderRadius, Spacing, Typography } from '../theme/DesignSystem';
import { BackgroundTheme } from '../types';
import { BACKGROUND_THEMES } from '../services/backgroundThemeService';
import BackgroundThemePicker from './BackgroundThemePicker';
import { resolveCardBackground, buildShareText, CardTheme } from '../utils/shareCard';
```

Also add `Image` and `ImageBackground` to the `react-native` import list from Task 3:

Find:
```typescript
  Share,
  Platform,
  Clipboard,
} from 'react-native';
```
Replace:
```typescript
  Share,
  Platform,
  Clipboard,
  Image,
  ImageBackground,
} from 'react-native';
```

- [ ] **Step 2: Add `isPremium`/`onUpgrade` to the props interface and component signature**

Find:
```typescript
interface ShareSheetProps {
  isVisible: boolean;
  onClose: () => void;
  content: {
    text: string;
    source: string;
    translation?: string;
    arabicText?: string;
    transliteration?: string;
  };
}
```
Replace:
```typescript
interface ShareSheetProps {
  isVisible: boolean;
  onClose: () => void;
  isPremium: boolean;
  onUpgrade: () => void;
  content: {
    text: string;
    source: string;
    translation?: string;
    arabicText?: string;
    transliteration?: string;
  };
}
```

Find:
```typescript
const ShareSheet = ({ isVisible, onClose, content }: ShareSheetProps) => {
```
Replace:
```typescript
const ShareSheet = ({ isVisible, onClose, isPremium, onUpgrade, content }: ShareSheetProps) => {
```

- [ ] **Step 3: Add a `CardContent` component so the card's text layer isn't duplicated across the gradient and photo render branches**

Find (immediately above the `ShareSheet` component definition):
```typescript
/** Parse "Surah Ar-Rum 30:4-5" → { name: "Ar-Rum", ref: "30:4-5" } */
function parseSource(src: string): { name: string; ref: string } {
  const match = src.match(/^Surah\s+(.+?)\s+(\d+:\d+(?:-\d+)?)$/);
  if (match) return { name: match[1], ref: match[2] };
  return { name: src, ref: '' };
}

const ShareSheet = ({ isVisible, onClose, isPremium, onUpgrade, content }: ShareSheetProps) => {
```
Replace:
```typescript
/** Parse "Surah Ar-Rum 30:4-5" → { name: "Ar-Rum", ref: "30:4-5" } */
function parseSource(src: string): { name: string; ref: string } {
  const match = src.match(/^Surah\s+(.+?)\s+(\d+:\d+(?:-\d+)?)$/);
  if (match) return { name: match[1], ref: match[2] };
  return { name: src, ref: '' };
}

interface CardContentProps {
  textColor: string;
  subTextColor: string;
  content: ShareSheetProps['content'];
  parsedSource: { name: string; ref: string };
  selectedFont: (typeof FONTS)[number];
  showArabic: boolean;
  showTransliteration: boolean;
  showEnglish: boolean;
}

/** The card's text layer — identical whether it sits over a gradient or a
 *  premium photo background, so both branches in ShareSheet render it. */
const CardContent = ({
  textColor,
  subTextColor,
  content,
  parsedSource,
  selectedFont,
  showArabic,
  showTransliteration,
  showEnglish,
}: CardContentProps) => (
  <>
    <View style={styles.cardHeader}>
      <Ionicons
        name="moon-outline"
        size={11}
        color={subTextColor}
        style={{ opacity: 0.65, marginRight: 5 }}
      />
      <Text style={[styles.moodLabel, { color: subTextColor }]}>Sakina app</Text>
    </View>

    {/* No numberOfLines here: the user is looking at this preview card right
        before it's captured and shared/saved as an image, so silently
        ellipsis-clipping the ayah is worse than usual. The card only has a
        minHeight and sits in a ScrollView, so a long verse (e.g. Ayat
        al-Kursi) just makes the preview taller instead of losing text. */}
    <View style={styles.quoteContainer}>
      {showArabic && content.arabicText && (
        <Text style={[styles.previewArabic, { color: textColor }]}>{content.arabicText}</Text>
      )}
      {showTransliteration && content.transliteration && (
        <Text style={[styles.previewTransliteration, { color: subTextColor }]}>
          {content.transliteration}
        </Text>
      )}
      {showEnglish && (
        <Text
          style={[
            styles.previewQuote,
            {
              color: textColor,
              fontFamily: selectedFont.family,
              fontStyle: selectedFont.id === 'serif' ? 'italic' : 'normal',
            },
          ]}
        >
          "{content.text}"
        </Text>
      )}
    </View>

    <View style={styles.previewFooter}>
      <Text style={[styles.previewSurahName, { color: textColor }]}>
        {parsedSource.name.toUpperCase()}
      </Text>
      {parsedSource.ref !== '' && (
        <Text style={[styles.previewVerseRef, { color: subTextColor }]}>{parsedSource.ref}</Text>
      )}
    </View>
  </>
);

const ShareSheet = ({ isVisible, onClose, isPremium, onUpgrade, content }: ShareSheetProps) => {
```

- [ ] **Step 4: Add `selectedPhotoTheme`/`isPhotoPickerVisible` state and the downgrade guard**

Find:
```typescript
  // Personalization State
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>(CARD_THEMES[2]); // Default Purple
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const viewShotRef = useRef<ViewShot>(null);
```
Replace:
```typescript
  // Personalization State
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>(CARD_THEMES[2]); // Default Purple
  const [selectedFont, setSelectedFont] = useState(FONTS[0]);
  const [selectedPhotoTheme, setSelectedPhotoTheme] = useState<BackgroundTheme | null>(null);
  const [isPhotoPickerVisible, setIsPhotoPickerVisible] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  // A lapsed subscriber never gets stuck rendering a background they can no
  // longer pick — reset the moment isPremium turns false.
  useEffect(() => {
    if (!isPremium) setSelectedPhotoTheme(null);
  }, [isPremium]);
```

- [ ] **Step 5: Replace the manual textColor/subTextColor derivation with `resolveCardBackground`**

Find:
```typescript
  const textColor = selectedTheme.textColor || '#FFFFFF';
  const subTextColor = selectedTheme.textColor
    ? 'rgba(31, 41, 55, 0.7)'
    : 'rgba(255, 255, 255, 0.8)';

  const parsedSource = parseSource(content.source);
```
Replace:
```typescript
  const background = resolveCardBackground(selectedTheme, selectedPhotoTheme, isPremium);
  const { textColor, subTextColor } = background;

  const parsedSource = parseSource(content.source);
```

- [ ] **Step 6: Render the card as a photo or gradient background, using `CardContent` for the text layer**

Find:
```typescript
            {/* PREVIEW CARD */}
            <LinearGradient
              colors={selectedTheme.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewCard}
            >
              {/* ── Card top: app branding ── */}
              <View style={styles.cardHeader}>
                <Ionicons name="moon-outline" size={11} color={subTextColor} style={{ opacity: 0.65, marginRight: 5 }} />
                <Text style={[styles.moodLabel, { color: subTextColor }]}>Sakina app</Text>
              </View>

              {/* ── Verse content ──
                  No numberOfLines here: the user is looking at this preview
                  card right before sharing it (via the system share sheet,
                  a deep-link, or clipboard — there's no image capture in
                  this file, "Save Image" also routes through Share.share),
                  so silently ellipsis-clipping the ayah here is worse than
                  usual. The card only has a minHeight and sits in a
                  ScrollView, so a long verse (e.g. Ayat al-Kursi) just makes
                  the preview taller instead of losing text. */}
              <View style={styles.quoteContainer}>
                {showArabic && content.arabicText && (
                  <Text style={[styles.previewArabic, { color: textColor }]}>
                    {content.arabicText}
                  </Text>
                )}
                {showTransliteration && content.transliteration && (
                  <Text style={[styles.previewTransliteration, { color: subTextColor }]}>
                    {content.transliteration}
                  </Text>
                )}
                {showEnglish && (
                  <Text
                    style={[
                      styles.previewQuote,
                      {
                        color: textColor,
                        fontFamily: selectedFont.family,
                        fontStyle: selectedFont.id === 'serif' ? 'italic' : 'normal',
                      },
                    ]}
                  >
                    "{content.text}"
                  </Text>
                )}
              </View>

              {/* ── Card bottom: surah name + verse ref ── */}
              <View style={styles.previewFooter}>
                <Text style={[styles.previewSurahName, { color: textColor }]}>
                  {parsedSource.name.toUpperCase()}
                </Text>
                {parsedSource.ref !== '' && (
                  <Text style={[styles.previewVerseRef, { color: subTextColor }]}>
                    {parsedSource.ref}
                  </Text>
                )}
              </View>
            </LinearGradient>
```
Replace:
```typescript
            {/* PREVIEW CARD — captured verbatim by ViewShot for the real
                share/save image, so whatever renders here (gradient or
                premium photo) is exactly what gets sent. */}
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
              {background.kind === 'photo' ? (
                <ImageBackground
                  source={background.imageSource}
                  style={styles.previewCard}
                  imageStyle={styles.previewCardImage}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.65)']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <CardContent
                    textColor={textColor}
                    subTextColor={subTextColor}
                    content={content}
                    parsedSource={parsedSource}
                    selectedFont={selectedFont}
                    showArabic={showArabic}
                    showTransliteration={showTransliteration}
                    showEnglish={showEnglish}
                  />
                </ImageBackground>
              ) : (
                <LinearGradient
                  colors={background.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.previewCard}
                >
                  <CardContent
                    textColor={textColor}
                    subTextColor={subTextColor}
                    content={content}
                    parsedSource={parsedSource}
                    selectedFont={selectedFont}
                    showArabic={showArabic}
                    showTransliteration={showTransliteration}
                    showEnglish={showEnglish}
                  />
                </LinearGradient>
              )}
            </ViewShot>
```

- [ ] **Step 7: Add the "Nature Photos" tile to the Style row**

Find:
```typescript
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.themeSelector}
              >
                {CARD_THEMES.map((theme) => (
                  <TouchableOpacity
                    key={theme.id}
                    style={[
                      styles.themeOption,
                      selectedTheme.id === theme.id && styles.themeOptionSelected,
                    ]}
                    onPress={() => setSelectedTheme(theme)}
                    accessibilityRole="button"
                    accessibilityLabel={theme.label}
                    accessibilityState={{ selected: selectedTheme.id === theme.id }}
                  >
                    <LinearGradient
                      colors={theme.colors}
                      style={styles.themeCircle}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
```
Replace:
```typescript
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.themeSelector}
              >
                {CARD_THEMES.map((theme) => (
                  <TouchableOpacity
                    key={theme.id}
                    style={[
                      styles.themeOption,
                      selectedTheme.id === theme.id && !selectedPhotoTheme && styles.themeOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedTheme(theme);
                      setSelectedPhotoTheme(null);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={theme.label}
                    accessibilityState={{ selected: selectedTheme.id === theme.id && !selectedPhotoTheme }}
                  >
                    <LinearGradient
                      colors={theme.colors}
                      style={styles.themeCircle}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.themeOption, !!selectedPhotoTheme && styles.themeOptionSelected]}
                  onPress={() => setIsPhotoPickerVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isPremium ? 'Nature photo background' : 'Nature photo background, premium'
                  }
                  accessibilityState={{ selected: !!selectedPhotoTheme }}
                >
                  <View style={styles.photoThemeCircle}>
                    {selectedPhotoTheme ? (
                      <Image source={selectedPhotoTheme.imageSource} style={styles.photoThemeThumb} />
                    ) : (
                      <Ionicons name="image-outline" size={20} color="rgba(255,255,255,0.6)" />
                    )}
                    {!isPremium && (
                      <View style={styles.photoThemeLock}>
                        <Ionicons name="lock-closed" size={9} color="#FFF" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </ScrollView>
```

- [ ] **Step 8: Add the nested `BackgroundThemePicker` modal**

Find:
```typescript
        </Animated.View>
      </View>
    </Modal>
  );
};
```
Replace:
```typescript
        </Animated.View>

        <BackgroundThemePicker
          isVisible={isPhotoPickerVisible}
          onClose={() => setIsPhotoPickerVisible(false)}
          isPremium={isPremium}
          selectedThemeId={selectedPhotoTheme?.id ?? null}
          onSelectTheme={(themeId) => {
            setSelectedPhotoTheme(
              themeId ? BACKGROUND_THEMES.find((t) => t.id === themeId) ?? null : null,
            );
          }}
          onUpgrade={() => {
            setIsPhotoPickerVisible(false);
            onClose();
            onUpgrade();
          }}
        />
      </View>
    </Modal>
  );
};
```

- [ ] **Step 9: Add the new styles**

Find:
```typescript
  previewCard: {
    width: '100%',
    minHeight: 300,
    borderRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
```
Replace:
```typescript
  previewCard: {
    width: '100%',
    minHeight: 300,
    borderRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  previewCardImage: {
    borderRadius: 24,
  },
```

Find:
```typescript
  themeCircle: {
    flex: 1,
    borderRadius: 22,
  },
```
Replace:
```typescript
  themeCircle: {
    flex: 1,
    borderRadius: 22,
  },
  photoThemeCircle: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoThemeThumb: {
    width: '100%',
    height: '100%',
  },
  photoThemeLock: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
```

- [ ] **Step 10: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: errors at every call site that hasn't been updated yet — `GuidanceScreen.tsx` and `SurahReaderScreen.tsx` are both missing the now-required `isPremium`/`onUpgrade` props. That's expected; Tasks 5 and 6 fix them. Confirm the *only* errors are those two missing-prop errors (nothing inside `ShareSheet.tsx` itself).

- [ ] **Step 11: Commit**

```bash
git add src/components/ShareSheet.tsx
git commit -m "feat: add premium nature-photo card backgrounds to the share sheet"
```

---

### Task 5: Wire `GuidanceScreen.tsx`

**Files:**
- Modify: `src/screens/GuidanceScreen.tsx:400-409`

`isPremium`, `freemium`, and `navigation` are already in scope in this screen (lines 41-47) — no new imports needed.

- [ ] **Step 1: Pass `isPremium`/`onUpgrade` to `ShareSheet`**

Find:
```typescript
      <ShareSheet
        isVisible={isShareSheetVisible}
        onClose={() => setIsShareSheetVisible(false)}
        content={{
          text: shareContent.text,
          source: shareContent.source,
          arabicText: shareContent.arabicText,
          transliteration: shareContent.transliteration,
        }}
      />
```
Replace:
```typescript
      <ShareSheet
        isVisible={isShareSheetVisible}
        onClose={() => setIsShareSheetVisible(false)}
        isPremium={isPremium}
        onUpgrade={() => {
          freemium.recordUpgradeAsk('theme_pick');
          navigation.navigate('Support');
        }}
        content={{
          text: shareContent.text,
          source: shareContent.source,
          arabicText: shareContent.arabicText,
          transliteration: shareContent.transliteration,
        }}
      />
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: the `GuidanceScreen.tsx` prop errors from Task 4 are gone; only `SurahReaderScreen.tsx` errors remain.

- [ ] **Step 3: Commit**

```bash
git add src/screens/GuidanceScreen.tsx
git commit -m "feat: wire premium background gating into GuidanceScreen's share sheet"
```

---

### Task 6: Wire `SurahReaderScreen.tsx`

**Files:**
- Modify: `src/screens/SurahReaderScreen.tsx`

This screen has no premium awareness today — add the same `isPremium` pattern `GuidanceScreen.tsx` already uses.

- [ ] **Step 1: Add imports**

Find:
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Typography, Animations } from '../theme/DesignSystem';
import { dbQuery } from '../database/schema';
import {
  getCachedSurah,
  fetchAndCacheSurah,
  QuranVerse,
} from '../services/quranService';
import { CornerFrame } from '../components/CornerFrame';
import ArabicText from '../components/ArabicText';
import AudioPlayerButton from '../components/AudioPlayerButton';
import ShareSheet from '../components/ShareSheet';
import ReadingViewModal from '../components/ReadingViewModal';
import { HapticsService } from '../services/hapticsService';
import { StackScreenProps } from '@react-navigation/stack';
```
Replace:
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing, BorderRadius, Typography, Animations } from '../theme/DesignSystem';
import { dbQuery } from '../database/schema';
import {
  getCachedSurah,
  fetchAndCacheSurah,
  QuranVerse,
} from '../services/quranService';
import { CornerFrame } from '../components/CornerFrame';
import ArabicText from '../components/ArabicText';
import AudioPlayerButton from '../components/AudioPlayerButton';
import ShareSheet from '../components/ShareSheet';
import ReadingViewModal from '../components/ReadingViewModal';
import { HapticsService } from '../services/hapticsService';
import { SubscriptionService } from '../services/subscriptionService';
import { FreemiumService } from '../services/freemiumService';
import { StackScreenProps } from '@react-navigation/stack';
```

- [ ] **Step 2: Add `isPremium` state**

Find:
```typescript
  // Share sheet
  const [shareVisible, setShareVisible] = useState(false);
  const [shareContent, setShareContent] = useState({
    text: '', source: '', arabicText: '', transliteration: '',
  });
```
Replace:
```typescript
  // Share sheet
  const [shareVisible, setShareVisible] = useState(false);
  const [shareContent, setShareContent] = useState({
    text: '', source: '', arabicText: '', transliteration: '',
  });
  const [isPremium, setIsPremium] = useState(() => SubscriptionService.getInstance().isPremium());
  useFocusEffect(useCallback(() => {
    setIsPremium(SubscriptionService.getInstance().isPremium());
  }, []));
```

- [ ] **Step 3: Pass `isPremium`/`onUpgrade` to `ShareSheet`**

Find:
```typescript
      <ShareSheet
        isVisible={shareVisible}
        onClose={() => setShareVisible(false)}
        content={{
          text: shareContent.text,
          source: shareContent.source,
          arabicText: shareContent.arabicText,
          transliteration: shareContent.transliteration,
        }}
      />
```
Replace:
```typescript
      <ShareSheet
        isVisible={shareVisible}
        onClose={() => setShareVisible(false)}
        isPremium={isPremium}
        onUpgrade={() => {
          FreemiumService.getInstance().recordUpgradeAsk('theme_pick');
          navigation.navigate('Support');
        }}
        content={{
          text: shareContent.text,
          source: shareContent.source,
          arabicText: shareContent.arabicText,
          transliteration: shareContent.transliteration,
        }}
      />
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: PASS — no errors anywhere.

- [ ] **Step 5: Commit**

```bash
git add src/screens/SurahReaderScreen.tsx
git commit -m "feat: wire premium background gating into SurahReaderScreen's share sheet"
```

---

### Task 7: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx jest`
Expected: PASS — all existing suites plus the new `shareCard.test.ts` (7 tests) green. No test file exercises `ShareSheet.tsx`, `GuidanceScreen.tsx`, or `SurahReaderScreen.tsx` directly (this codebase has no RN component-render tests — see `jest.config.js` / existing `__tests__` dirs, all service/hook/util-level), which is why Task 2's extraction into pure helpers is what carries the test coverage for this feature.

- [ ] **Step 2: Run the full typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: PASS — no errors.

- [ ] **Step 3: Record the on-device verification checklist**

This feature touches three new native modules (`react-native-view-shot`, `expo-sharing`, `expo-media-library`) that only run in a rebuilt `expo-dev-client` binary — none of it is exercised by Jest or `tsc`. Do not claim the feature works until it has been checked on-device, after the EAS rebuild that bundles these dependencies (see Task 1, Step 3 note) lands:

1. Free user: capture + share the card image to at least one app (WhatsApp or Messages) — confirm the *image* (not just text) arrives.
2. Free user: "Save Image" — confirm a PNG appears in the camera roll.
3. Free user: tap the "Nature Photos" tile — confirm the locked/"Upgrade Now" alert appears, and that tapping "Upgrade Now" closes the share sheet and navigates to the Support screen.
4. Premium user: pick a nature-photo background — confirm the card preview switches to the photo + dark overlay, and the text stays legible.
5. Premium user downgraded mid-session (or a fresh non-premium load with a previously-selected photo persisted in state) — confirm the card falls back to a gradient instead of showing a broken or locked image.

No commit for this task — it's a checklist, not a code change.
