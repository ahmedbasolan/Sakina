import { useState, useEffect, useRef } from 'react';
import { Animated, LayoutAnimation } from 'react-native';
import { HapticsService } from '../services/hapticsService';
import { FreemiumService } from '../services/freemiumService';
import { PreferencesService } from '../services/preferencesService';
import { GuidanceExperience, Mood, UserPreferences } from '../types';
import { dbQuery } from '../database/schema';

export const useGuidanceLogic = (
  experience: GuidanceExperience,
  mood: Mood,
  onNext: () => void,
  onSaveReflection: (reflection: string) => void,
  onShowPaywall: (type: 'refresh_limit' | 'daily_limit' | 'saved_limit') => void,
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
  });
  const [remainingRefreshes, setRemainingRefreshes] = useState(3);

  const freemiumService = FreemiumService.getInstance();
  const preferencesService = PreferencesService.getInstance();
  const nextButtonScale = useRef(new Animated.Value(0)).current;
  const nextButtonOpacity = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);

  useEffect(() => {
    setRemainingRefreshes(freemiumService.getRemainingRefreshes());
    const initPrefs = async () => {
      const prefs = await preferencesService.initialize();
      setPreferences(prefs);
    };
    initPrefs();
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

    try {
      if (newSaved) {
        const id = `${experience.content.id}_${experience.angle.id}_${Date.now()}`;
        await dbQuery(async (db) => {
          await db.runAsync(
            `INSERT OR REPLACE INTO saved_reflections (id, contentId, angleId, mood, reflection, timestamp)
                         VALUES (?, ?, ?, ?, ?, ?)`,
            [id, experience.content.id, experience.angle.id, mood, '', Date.now()],
          );
          return null;
        });
      } else {
        await dbQuery(async (db) => {
          await db.runAsync(`DELETE FROM saved_reflections WHERE contentId = ? AND angleId = ?`, [
            experience.content.id,
            experience.angle.id,
          ]);
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

  const handlePrimaryAction = async () => {
    HapticsService.notificationAsync('SUCCESS');
    if (reflectionText.trim()) {
      onSaveReflection(reflectionText);
    }
    onNext();
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
