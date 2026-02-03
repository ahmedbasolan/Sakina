import { useState, useEffect, useRef } from 'react';
import { Animated, LayoutAnimation } from 'react-native';
import * as Haptics from 'expo-haptics';
import { FreemiumService } from '../services/freemiumService';
import { PreferencesService } from '../services/preferencesService';
import { GuidanceExperience, Mood, UserPreferences, LanguagePreference } from '../types';

export const useGuidanceLogic = (
    experience: GuidanceExperience,
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
        const canSave = await freemiumService.canSaveItem();
        if (!canSave && !savedStates[index]) {
            onShowPaywall('saved_limit');
            return;
        }
        setSavedStates((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
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
        const success = await freemiumService.useNextRefresh();
        if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            if (reflectionText.trim()) {
                onSaveReflection(reflectionText);
            }
            onNext();
            setRemainingRefreshes(freemiumService.getRemainingRefreshes());
            setActiveIndex(0);

            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: 0, animated: true });
            }

            nextButtonScale.setValue(0);
            nextButtonOpacity.setValue(0);
        } else {
            onShowPaywall('refresh_limit');
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
            Haptics.selectionAsync();
            setActiveIndex(index);
        }

        const isAtBottom = y + layoutHeight > contentHeight - 100;
        Animated.parallel([
            Animated.spring(nextButtonScale, {
                toValue: isAtBottom ? 1 : 0.9,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
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
