import { useState, useEffect, useRef } from 'react';
import { Animated, LayoutAnimation } from 'react-native';
import { HapticsService } from '../services/hapticsService';
import { FreemiumService } from '../services/freemiumService';
import { PreferencesService } from '../services/preferencesService';
import { GuidanceExperience, Mood, UserPreferences } from '../types';
import { dbQuery } from '../database/schema';

// ─── Helper: parse "Surah Al-Baqarah 2:255" → surah metadata ─────────────────
function parseQuranSource(
  source: string,
): { surahName: string; surahNumber: number; verseNumber: number } | null {
  const m = source.match(/^Surah\s+(.+?)\s+(\d+):(\d+)/);
  if (!m) return null;
  return {
    surahName: m[1],
    surahNumber: parseInt(m[2], 10),
    verseNumber: parseInt(m[3], 10),
  };
}

export const useGuidanceLogic = (
  experience: GuidanceExperience,
  mood: Mood,
  onNext: () => void,
  onSaveReflection: (reflection: string) => void,
  cardsCount: number,
) => {
  const [savedStates, setSavedStates] = useState<Record<number, boolean>>({});
  const [showReflectionInput, setShowReflectionInput] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [isShareSheetVisible, setIsShareSheetVisible] = useState(false);
  const [shareContent, setShareContent] = useState({
    text: '',
    source: '',
    arabicText: '',
    transliteration: '',
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
    primaryLanguage: 'english',
    showTransliteration: true,
    autoPlayAudio: false,
  });
  const [remainingRefreshes, setRemainingRefreshes] = useState(3);
  // Gentle "resting point": true once a free user has spent the window's
  // refresh allowance. The screen reads this to show a calm pause instead of
  // silently doing nothing. Mercy moods & premium never reach it (the service
  // grants unlimited there). Cleared on a new window/mood or by dismissResting.
  const [isResting, setIsResting] = useState(false);

  const freemiumService = FreemiumService.getInstance();
  const preferencesService = PreferencesService.getInstance();
  const nextButtonScale = useRef(new Animated.Value(0)).current;
  const nextButtonOpacity = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);

  // Reset heart state whenever a new piece of content loads
  useEffect(() => {
    setSavedStates({});
  }, [experience?.content?.id]);

  // Sync the per-prayer-window allowance, then reflect the (mercy-aware) remaining
  // count. Re-runs if the active mood changes in-session; syncPrayerWindow is
  // idempotent (only writes when the window actually changed).
  useEffect(() => {
    const syncRefreshes = async () => {
      await freemiumService.syncPrayerWindow();
      const remaining = freemiumService.getRemainingRefreshes(mood);
      setRemainingRefreshes(remaining);
      if (remaining > 0) setIsResting(false); // new window/mood reopened the door
    };
    syncRefreshes();
  }, [mood]);

  // One-time: load user preferences (not mood-dependent).
  useEffect(() => {
    preferencesService.initialize().then(setPreferences);
  }, []);

  const updatePreference = async (newPrefs: Partial<UserPreferences>) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    await preferencesService.savePreferences(updated);
  };

  const handleSave = async (index: number) => {
    const isCurrentlySaved = !!savedStates[index];
    const newSaved = !isCurrentlySaved;

    setSavedStates((prev) => ({
      ...prev,
      [index]: newSaved,
    }));

    HapticsService.impactAsync('LIGHT');

    // If the source is a Quran verse we also mirror to bookmarked_verses so
    // it appears in LibraryScreen's "Saved Verses" tab alongside SurahReader bookmarks.
    const quranInfo = parseQuranSource(experience.content.source || '');

    try {
      if (newSaved) {
        const id = `${experience.content.id}_${experience.angle.id}_${Date.now()}`;
        await dbQuery(async (db) => {
          await db.runAsync(
            `INSERT OR REPLACE INTO saved_reflections (id, contentId, angleId, mood, reflection, timestamp)
                         VALUES (?, ?, ?, ?, ?, ?)`,
            [id, experience.content.id, experience.angle.id, mood, '', Date.now()],
          );
          if (quranInfo) {
            // Deterministic ID (no timestamp) so re-saving the same verse stays idempotent
            const bmId = `bv_guidance_${quranInfo.surahNumber}_${quranInfo.verseNumber}`;
            await db.runAsync(
              `INSERT OR IGNORE INTO bookmarked_verses
                 (id, surahNumber, verseNumber, arabicText, translation, surahName, bookmarkedAt)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                bmId,
                quranInfo.surahNumber,
                quranInfo.verseNumber,
                experience.content.arabicText || '',
                experience.content.englishTranslation || '',
                quranInfo.surahName,
                Date.now(),
              ],
            );
          }
          return null;
        });
      } else {
        await dbQuery(async (db) => {
          await db.runAsync(`DELETE FROM saved_reflections WHERE contentId = ? AND angleId = ?`, [
            experience.content.id,
            experience.angle.id,
          ]);
          if (quranInfo) {
            const bmId = `bv_guidance_${quranInfo.surahNumber}_${quranInfo.verseNumber}`;
            await db.runAsync(`DELETE FROM bookmarked_verses WHERE id = ?`, [bmId]);
          }
          return null;
        });
      }
    } catch (error) {
      console.error('Error saving guidance:', error);
      // Revert UI on failure
      setSavedStates((prev) => ({
        ...prev,
        [index]: isCurrentlySaved,
      }));
    }
  };

  const handleShare = (
    text: string,
    source: string,
    arabicText?: string,
    transliteration?: string,
  ) => {
    setShareContent({
      text,
      source,
      arabicText: arabicText || '',
      transliteration: transliteration || '',
    });
    setIsShareSheetVisible(true);
  };

  // Single gated entry point for advancing to the next piece of guidance.
  // Atomically spends one refresh (the service no-ops the decrement for premium
  // and mercy moods). If the allowance is gone, we stop at a resting point
  // instead of fetching. Returns whether we advanced.
  const requestNext = async (): Promise<boolean> => {
    const allowed = await freemiumService.useNextRefresh(mood);
    if (!allowed) {
      setIsResting(true);
      return false;
    }
    setRemainingRefreshes(freemiumService.getRemainingRefreshes(mood));
    onNext();
    return true;
  };

  const dismissResting = () => setIsResting(false);

  const handlePrimaryAction = async () => {
    HapticsService.notificationAsync('SUCCESS');
    if (reflectionText.trim()) {
      onSaveReflection(reflectionText);
    }
    const advanced = await requestNext();
    if (!advanced) return; // resting — don't reset scroll/buttons

    setActiveIndex(0);

    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }

    nextButtonScale.setValue(0);
    nextButtonOpacity.setValue(0);
  };

  const onScroll = (event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    scrollY.setValue(y);
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;

    const scrollPercent = Math.min(Math.max(y / (contentHeight - layoutHeight), 0.1), 1);
    const index = Math.min(Math.floor(scrollPercent * cardsCount), cardsCount - 1);

    if (index !== activeIndex) {
      HapticsService.selectionAsync();
      setActiveIndex(index);
    }

    const isAtBottom = y + layoutHeight > contentHeight - 100;
    Animated.parallel([
      Animated.spring(nextButtonScale, {
        toValue: isAtBottom ? 1 : 0.9,
        useNativeDriver: true,
        damping: 12,
        stiffness: 120,
      }),
      Animated.timing(nextButtonOpacity, {
        toValue: isAtBottom ? 1 : 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return {
    savedStates,
    showReflectionInput,
    setShowReflectionInput,
    reflectionText,
    setReflectionText,
    isShareSheetVisible,
    setIsShareSheetVisible,
    shareContent,
    activeIndex,
    remainingRefreshes,
    isResting,
    requestNext,
    dismissResting,
    nextButtonScale,
    nextButtonOpacity,
    scrollY,
    scrollViewRef,
    handleSave,
    handleShare,
    handlePrimaryAction,
    onScroll,
    preferences,
    updatePreference,
    isPremium: freemiumService.isPremium(),
  };
};
