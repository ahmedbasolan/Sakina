import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import { HapticsService } from '../services/hapticsService';
import ImmersiveBackground from '../components/ImmersiveBackground';
import { GoldenMotes } from '../components/GoldenMotes';
import GuidanceHeader from '../components/GuidanceHeader';
import VerseLayer from '../components/VerseLayer';
import ContextLayer from '../components/ContextLayer';
import FloatingActionRow from '../components/FloatingActionRow';
import ShareSheet from '../components/ShareSheet';
import DisplayPreferencesModal from '../components/DisplayPreferencesModal';
import BackgroundThemePicker from '../components/BackgroundThemePicker';
import { backgroundThemeService } from '../services/backgroundThemeService';
import LayerContainer from '../components/LayerContainer';
import LayerPager from '../components/LayerPager';
import RestingPoint from '../components/RestingPoint';
import { useGuidanceLogic } from '../hooks/useGuidanceLogic';
import { Colors, Spacing, Typography, MoodColors } from '../theme/DesignSystem';
import { extractVerseKey } from '../utils';
import { logServiceError } from '../services/errorLoggingService';

import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { SubscriptionService } from '../services/subscriptionService';
import { FreemiumService } from '../services/freemiumService';

const GuidanceScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { rotationEngine } = useAppContext();
  const isPremium = SubscriptionService.getInstance().isPremium();
  const freemium = FreemiumService.getInstance();

  const { experience, mood, islamicTerm } = route.params;

  // Returns whether a new experience was actually delivered, so the caller
  // (useGuidanceLogic.requestNext) only spends a refresh on success — a
  // failed fetch used to consume the allowance and silently do nothing.
  const onNext = async (): Promise<boolean> => {
    try {
      const nextExp = await rotationEngine.getGuidance(mood);
      if (nextExp) {
        navigation.setParams({ experience: nextExp });
        return true;
      }
    } catch (error) {
      logServiceError(
        'GuidanceScreen',
        'handleNext',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
    HapticsService.notificationAsync('WARNING');
    return false;
  };

  const onSaveReflection = async (reflection: string) => {
    try {
      await rotationEngine.saveReflection(
        experience.content.id,
        experience.angle.id,
        mood,
        reflection,
      );
    } catch (error) {
      logServiceError(
        'GuidanceScreen',
        'handleSaveReflection',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  };

  const onBack = () => navigation.goBack();

  const [isPrefsModalVisible, setIsPrefsModalVisible] = useState(false);
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

  useEffect(() => {
    refreshSelectedTheme();
  }, [refreshSelectedTheme]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const [currentLayer, setCurrentLayer] = useState(0);

  // Ref so the PanResponder (created once) can read the latest layer index
  const currentLayerRef = useRef(currentLayer);
  useEffect(() => {
    currentLayerRef.current = currentLayer;
  }, [currentLayer]);

  // Ref to the hook's gated advance fn, kept fresh so the once-created
  // PanResponder always calls the current closure (mirrors currentLayerRef).
  const requestNextRef = useRef<() => void>(() => {});

  // Swipe right → next verse (only on the verse layer, layer 0).
  // Uses a horizontal-dominant threshold so it never conflicts with
  // LayerContainer's vertical-swipe gesture or the ScrollView inside VerseLayer.
  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) * 1.5 && Math.abs(g.dx) > 20,
      onPanResponderRelease: (_, g) => {
        if (g.dx > 50 && currentLayerRef.current === 0) {
          HapticsService.impactAsync('LIGHT');
          requestNextRef.current();
        }
      },
    }),
  ).current;

  // Reset to verse layer whenever a new experience loads
  useEffect(() => {
    setCurrentLayer(0);
    scrollY.setValue(0);
  }, [experience?.content?.id]);

  const hasContext = !!(experience.content.whyThis || experience.angle?.angle);
  const LAYER_TYPES: Array<'verse' | 'context'> = hasContext ? ['verse', 'context'] : ['verse'];

  const totalLayers = LAYER_TYPES.length;

  const {
    savedStates,
    isShareSheetVisible,
    setIsShareSheetVisible,
    shareContent,
    handleSave,
    handleShare,
    preferences,
    updatePreference,
    requestNext,
    isResting,
    isWindowExhausted,
    dismissResting,
  } = useGuidanceLogic(experience, mood, onNext, onSaveReflection, totalLayers);

  // Hide "→ next verse" only after the resting point has been seen and dismissed.
  // Before that point, even a spent window should show the button so pressing it
  // triggers the resting point modal rather than silently doing nothing.
  const canAdvance = isPremium || !isWindowExhausted;

  // Keep the PanResponder's ref pointed at the latest gated advance fn.
  useEffect(() => {
    requestNextRef.current = requestNext;
  }, [requestNext]);

  // The positive-mood pause is a peak (spec §8): when the rest point appears the
  // gate may add a single soft support line. Decide + record once per appearance.
  const [offerSupportAtRest, setOfferSupportAtRest] = useState(false);
  useEffect(() => {
    if (isResting) {
      const willOffer = freemium.shouldOfferUpgrade('positive_pause');
      if (willOffer) freemium.recordUpgradeAsk('positive_pause');
      setOfferSupportAtRest(willOffer);
    } else {
      setOfferSupportAtRest(false);
    }
  }, [isResting]);

  if (!experience) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background.primary} />
        <ActivityIndicator size="large" color={Colors.accent.primary} />
        <Text style={styles.loadingText}>Fetching divine guidance...</Text>
      </View>
    );
  }

  const handleShareVerse = () => {
    handleShare(
      experience.content.translation || experience.content.englishTranslation || '',
      experience.content.source || '',
      experience.content.arabicText,
      experience.content.transliteration,
    );
  };

  return (
    <ImmersiveBackground
      mood={mood}
      isPremium={isPremium}
      imageUri={selectedThemeUri ?? undefined}
      selfManageTheme={false}
    >
      <GoldenMotes />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header in the flex flow (same pattern as PathTopBar in PathStepScreen).
          On the verse layer GuidanceHeader renders without the CONTEXT/PRACTICE
          label so it stays compact. On non-verse layers the label shows and the
          content below it starts with proper clearance — no more content buried
          under the floating overlay. */}
      <GuidanceHeader
        mood={mood}
        islamicTerm={islamicTerm}
        onBack={onBack}
        onOptionsPress={() => setIsPrefsModalVisible(true)}
        activeIndex={currentLayer}
        totalCards={totalLayers}
        scrollY={scrollY}
      />

      {/* Layer content — wrapped in swipe-right detector for "next verse" gesture */}
      <View style={styles.gestureWrap} {...swipeResponder.panHandlers}>
        <LayerContainer
          currentLayer={currentLayer}
          totalLayers={totalLayers}
          onLayerChange={(layerIndex) => {
            scrollY.setValue(0);
            setCurrentLayer(layerIndex);
            if (layerIndex >= totalLayers) {
              requestNext();
              setCurrentLayer(0);
            }
          }}
        >
          {currentLayer === 0 && (
            <VerseLayer
              arabic={experience.content.arabicText || ''}
              translation={experience.content.translation || experience.content.englishTranslation}
              reference={experience.content.source || ''}
              transliteration={experience.content.transliteration}
              showTransliteration={preferences.showTransliteration}
              autoPlayAudio={preferences.autoPlayAudio}
              primaryLanguage={preferences.primaryLanguage}
              scrollY={scrollY}
              accentColor={(MoodColors[mood] || MoodColors.Calm).accent}
              hasContext={hasContext}
              onNextVerse={
                canAdvance
                  ? () => {
                      scrollY.setValue(0);
                      requestNext();
                      setCurrentLayer(0);
                    }
                  : undefined
              }
              onShare={handleShareVerse}
              onSave={() => handleSave(0)}
              isSaved={!!savedStates[0]}
              audioKey={extractVerseKey(experience.content.source)}
            />
          )}

          {currentLayer === 1 && hasContext && (
            <ContextLayer
              attribution={experience.angle?.angleSource || 'Scholarly Context'}
              text={experience.content.whyThis || ''}
              source={experience.content.source || ''}
              angle={experience.angle?.angle}
              angleSource={experience.angle?.angleSource}
              scrollY={scrollY}
              topInset={Spacing.lg}
            />
          )}
        </LayerContainer>
      </View>

      {/* Tappable layer nav — prev/next buttons + dot track. Replaces the old
          purely-decorative swipe hint so users can navigate without swiping. */}
      <LayerPager
        total={totalLayers}
        current={currentLayer}
        labels={LAYER_TYPES.map((t) => (t === 'verse' ? 'Verse' : t === 'context' ? 'Context' : t))}
        accentColor={(MoodColors[mood] || MoodColors.Calm).accent}
        onLayerChange={(idx) => {
          scrollY.setValue(0);
          setCurrentLayer(idx);
        }}
        onNextVerse={
          canAdvance
            ? () => {
                scrollY.setValue(0);
                requestNext();
                setCurrentLayer(0);
              }
            : undefined
        }
      />

      {/* FloatingActionRow — verse-action buttons only; not shown on context layer */}
      {currentLayer !== 0 && LAYER_TYPES[currentLayer] !== 'context' && (
        <View style={styles.floatingFooter} pointerEvents="box-none">
          <FloatingActionRow
            layerType={LAYER_TYPES[currentLayer] || 'verse'}
            onShare={handleShareVerse}
            onSave={() => handleSave(0)}
            isSaved={!!savedStates[0]}
            audioKey={extractVerseKey(experience.content.source)}
            onSaveReflection={() => {}}
          />
        </View>
      )}

      <ShareSheet
        isVisible={isShareSheetVisible}
        onClose={() => setIsShareSheetVisible(false)}
        content={{
          text: shareContent.text,
          source: shareContent.source,
          arabicText: shareContent.arabicText,
          transliteration: shareContent.transliteration,
          translation: mood,
        }}
      />

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
        onClose={() => {
          setIsThemePickerVisible(false);
          refreshSelectedTheme();
        }}
        isPremium={isPremium}
        selectedThemeId={selectedThemeId}
        onSelectTheme={async (themeId) => {
          await backgroundThemeService.setSelectedTheme(themeId);
          await refreshSelectedTheme();
        }}
        onUpgrade={() => {
          setIsThemePickerVisible(false);
          // Tapping "Upgrade Now" on a locked theme is a peak (spec §8): record
          // it so the theme-driven Support visit counts toward the anti-nag
          // cooldown and won't be immediately followed by another peak ask.
          freemium.recordUpgradeAsk('theme_pick');
          navigation.navigate('Support');
        }}
      />

      {/* Gentle resting point once the window's free refreshes are spent.
          Mercy moods & premium never reach here (the hook gate grants them
          unlimited). Dismiss returns to the saved reflections. */}
      {isResting && (
        <RestingPoint
          onDismiss={dismissResting}
          accentColor={(MoodColors[mood] || MoodColors.Calm).accent}
          onSupport={
            offerSupportAtRest
              ? () => {
                  dismissResting();
                  navigation.navigate('Support');
                }
              : undefined
          }
        />
      )}
    </ImmersiveBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.lg,
    color: Colors.text.secondary,
    fontSize: Typography.sizes.body,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  gestureWrap: {
    flex: 1,
  },
  floatingFooter: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GuidanceScreen;
