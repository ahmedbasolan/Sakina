import { useState, useEffect, useRef } from 'react';
import { Animated, LayoutAnimation } from 'react-native';
import { HapticsService } from '../services/hapticsService';
import { FreemiumService } from '../services/freemiumService';
import { PreferencesService } from '../services/preferencesService';
import { GuidanceExperience, Mood, UserPreferences } from '../types';
import { saveBookmarkMarker, deleteBookmarkMarker } from '../services/reflectionRepository';
import { deleteLegacyGuidanceBookmark } from '../services/readerRepository';

export const useGuidanceLogic = (
  experience: GuidanceExperience,
  mood: Mood,
  onNext: () => void | boolean | Promise<void | boolean>,
  onSaveReflection: (reflection: string) => void | boolean | Promise<void | boolean>,
  cardsCount: number,
) => {
  const [savedStates, setSavedStates] = useState<Record<number, boolean>>({});
  const [reflectionText, setReflectionTextState] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);

  // Any edit — including editing back to the previously-saved text — marks
  // the reflection dirty again. Simpler and more predictable than diffing
  // against the last-saved string.
  const setReflectionText = (text: string) => {
    setReflectionTextState(text);
    setReflectionSaved(false);
  };

  const reflectionStatus: 'empty' | 'dirty' | 'saved' = !reflectionText.trim()
    ? 'empty'
    : reflectionSaved
      ? 'saved'
      : 'dirty';

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
    asrMadhab: 'standard',
  });
  // Initialized synchronously from the service so premium reads Infinity on
  // first render (no flash of budget dots before the async sync).
  const [remainingRefreshes, setRemainingRefreshes] = useState(() =>
    FreemiumService.getInstance().getRemainingRefreshes(),
  );
  // Gentle "resting point": true once a free user has spent the window's
  // refresh allowance. The screen reads this to show a calm pause instead of
  // silently doing nothing. Premium never reaches it (the service grants
  // unlimited there). Cleared on a new window/mood or by dismissResting.
  const [isResting, setIsResting] = useState(false);
  // Tracks whether the user has already seen and dismissed the resting point
  // for this prayer window. Prevents the modal from re-appearing every time
  // they press "next verse" after dismissal. Reset when a new window opens.
  const hasRestingBeenDismissed = useRef(false);
  // True only after the resting point has been explicitly dismissed. Used by
  // the screen to hide "next verse" — distinct from remainingRefreshes === 0
  // so the button still appears when entering a spent window for the first time
  // (pressing it should trigger the resting point, not silently do nothing).
  const [isWindowExhausted, setIsWindowExhausted] = useState(false);

  const freemiumService = FreemiumService.getInstance();
  const preferencesService = PreferencesService.getInstance();
  const nextButtonScale = useRef(new Animated.Value(0)).current;
  const nextButtonOpacity = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<any>(null);

  // Reset heart state whenever a new piece of content loads. Keyed on both
  // content.id and angle.id — content_angles holds multiple angles per verse
  // and session dedup only excludes angle ids already shown, so the same
  // content.id can recur later under a different angle. Resetting on
  // content.id alone left a prior angle's unsaved reflection text sitting in
  // the input under the new angle's prompt.
  useEffect(() => {
    setSavedStates({});
    setReflectionTextState('');
    setReflectionSaved(false);
  }, [experience?.content?.id, experience?.angle?.id]);

  // Sync the per-prayer-window allowance, then reflect the remaining count.
  // Re-runs if the active mood changes in-session; syncPrayerWindow is
  // idempotent (only writes when the window actually changed).
  useEffect(() => {
    let mounted = true;
    const syncRefreshes = async () => {
      await freemiumService.syncPrayerWindow();
      if (!mounted) return;
      const remaining = freemiumService.getRemainingRefreshes();
      setRemainingRefreshes(remaining);
      if (remaining > 0) {
        setIsResting(false);
        setIsWindowExhausted(false);
        hasRestingBeenDismissed.current = false; // new window reopens the gate
      }
    };
    syncRefreshes();
    return () => { mounted = false; };
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

    // This still only ever writes to saved_reflections (never mirrors into
    // bookmarked_verses — an earlier version of this comment described a
    // write-time mirror that was removed because it created duplicate/
    // orphaned rows). LibraryScreen's Saved Verses tab now merges the two
    // tables at read time instead: this empty-reflection bookmark-marker row
    // (below) shows up there alongside SurahReaderScreen's own bookmarks,
    // without either table needing to know the other exists.
    try {
      if (newSaved) {
        const id = `${experience.content.id}_${experience.angle.id}_${Date.now()}`;
        await saveBookmarkMarker(id, experience.content.id, experience.angle.id, mood);
      } else {
        // Only the empty-reflection bookmark-marker row created by the
        // `newSaved` branch above — a real written reflection (non-empty
        // text) at the same contentId/angleId must survive an un-bookmark.
        await deleteBookmarkMarker(experience.content.id, experience.angle.id);
        // Also clean up a legacy `bv_guidance_*` bookmarked_verses row if one
        // exists from before the mirror-write was removed — otherwise a verse
        // saved on an older build could never be un-bookmarked again.
        await deleteLegacyGuidanceBookmark(experience.content.source || '');
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

  // Serialises requestNext so a double-tap can't fetch or spend twice.
  const isAdvancing = useRef(false);

  // Single gated entry point for advancing to the next piece of guidance.
  // Order matters: sync the window, check the allowance, FETCH, and only
  // spend a refresh once a new experience was actually delivered. The old
  // spend-then-fetch order consumed the allowance even when the fetch
  // failed, leaving the user with a silently swallowed tap. Returns whether
  // we advanced.
  const requestNext = async (): Promise<boolean> => {
    if (isAdvancing.current) return false;
    isAdvancing.current = true;
    try {
      // Idempotent — picks up a new prayer window if one opened mid-session.
      await freemiumService.syncPrayerWindow();
      if (freemiumService.getRemainingRefreshes() <= 0) {
        // Only show the resting point the first time per window; subsequent
        // presses after dismissal are silently swallowed (modal won't re-appear).
        if (!hasRestingBeenDismissed.current) {
          setIsResting(true);
        }
        return false;
      }

      const delivered = (await onNext()) !== false;
      if (!delivered) return false;

      // Spends one refresh (the service no-ops for premium).
      await freemiumService.useNextRefresh();
      setRemainingRefreshes(freemiumService.getRemainingRefreshes());
      return true;
    } finally {
      isAdvancing.current = false;
    }
  };

  const dismissResting = () => {
    hasRestingBeenDismissed.current = true;
    setIsWindowExhausted(true);
    setIsResting(false);
  };

  // Guards saveReflection the same way isAdvancing guards requestNext — a
  // double-tap on Save shouldn't write two rows (the underlying insert isn't
  // idempotent).
  const isSaving = useRef(false);

  // Explicit, deliberate save — the user taps "Save reflection" rather than
  // this firing automatically on advance/leave. Optimistic UI (mirrors
  // handleSave's bookmark toggle above): flip to "saved" immediately for
  // instant feedback, then revert + warn only if the save actually failed —
  // including a rejected promise, not just an explicit `false` return.
  const saveReflection = async () => {
    const text = reflectionText;
    if (!text.trim() || isSaving.current) return;
    isSaving.current = true;
    try {
      HapticsService.notificationAsync('SUCCESS');
      setReflectionSaved(true);
      let succeeded = true;
      try {
        succeeded = (await onSaveReflection(text)) !== false;
      } catch {
        succeeded = false;
      }
      if (!succeeded) {
        setReflectionSaved(false);
        HapticsService.notificationAsync('WARNING');
      }
    } finally {
      isSaving.current = false;
    }
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
    reflectionText,
    setReflectionText,
    reflectionStatus,
    saveReflection,
    isShareSheetVisible,
    setIsShareSheetVisible,
    shareContent,
    activeIndex,
    remainingRefreshes,
    isResting,
    isWindowExhausted,
    requestNext,
    dismissResting,
    nextButtonScale,
    nextButtonOpacity,
    scrollY,
    scrollViewRef,
    handleSave,
    handleShare,
    onScroll,
    preferences,
    updatePreference,
    isPremium: freemiumService.isPremium(),
  };
};
