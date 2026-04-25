import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  StatusBar,
  Animated,
} from 'react-native';
import ImmersiveBackground from '../components/ImmersiveBackground';
import GuidanceHeader from '../components/GuidanceHeader';
import VerseLayer from '../components/VerseLayer';
import ContextLayer from '../components/ContextLayer';
import PracticeLayer from '../components/PracticeLayer';
import ReflectionLayer from '../components/ReflectionLayer';
import ShareSheet from '../components/ShareSheet';
import DisplayPreferencesModal from '../components/DisplayPreferencesModal';
import LayerContainer from '../components/LayerContainer';
import { useGuidanceLogic } from '../hooks/useGuidanceLogic';
import { buildLayerConfig, nextLayerLabelFor, parsePracticeSteps } from '../hooks/useLayerConfig';
import { Colors, Spacing, Typography, MoodColors } from '../theme/DesignSystem';
import { logServiceError } from '../services/errorLoggingService';

import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { SubscriptionService } from '../services/subscriptionService';

const GuidanceScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { rotationEngine } = useAppContext();
  const isPremium = SubscriptionService.getInstance().isPremium();

  const { experience, mood, islamicTerm } = route.params;

  const onNext = async () => {
    try {
      const nextExp = await rotationEngine.getGuidance(mood);
      if (nextExp) {
        navigation.setParams({ experience: nextExp });
      }
    } catch (error) {
      logServiceError('GuidanceScreen', 'handleNext', error instanceof Error ? error : new Error(String(error)));
    }
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
      logServiceError('GuidanceScreen', 'handleSaveReflection', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const onBack = () => navigation.goBack();

  const [isPrefsModalVisible, setIsPrefsModalVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [currentLayer, setCurrentLayer] = useState(0);

  const layers = React.useMemo(
    () => experience ? buildLayerConfig(experience) : ['verse' as const],
    [experience],
  );
  const totalLayers = layers.length;
  const nextLayerLabel = nextLayerLabelFor(layers, currentLayer);
  const practiceSteps = React.useMemo(
    () => parsePracticeSteps(experience?.angle?.practiceSteps),
    [experience?.angle?.practiceSteps],
  );

  const {
    savedStates,
    isShareSheetVisible,
    setIsShareSheetVisible,
    shareContent,
    handleSave,
    handleShare,
    preferences,
    updatePreference,
  } = useGuidanceLogic(experience, mood, onNext, onSaveReflection, () => { }, totalLayers);

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
    <ImmersiveBackground mood={mood} isPremium={isPremium}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-bleed layer container */}
      <View style={StyleSheet.absoluteFill}>
        <LayerContainer
          currentLayer={currentLayer}
          totalLayers={totalLayers}
          onLayerChange={(layerIndex) => {
            scrollY.setValue(0);
            setCurrentLayer(layerIndex);
            if (layerIndex >= totalLayers) {
              onNext();
              setCurrentLayer(0);
            }
          }}
        >
        {layers[currentLayer] === 'verse' && (
          <VerseLayer
            arabic={experience.content.arabicText || ''}
            translation={experience.content.translation || experience.content.englishTranslation}
            reference={experience.content.source || ''}
            transliteration={experience.content.transliteration}
            showTransliteration={preferences.showTransliteration}
            primaryLanguage={preferences.primaryLanguage}
            scrollY={scrollY}
            accentColor={(MoodColors[mood] || MoodColors.Calm).accent}
            onNextVerse={() => {
              scrollY.setValue(0);
              onNext();
              setCurrentLayer(0);
            }}
            onShare={handleShareVerse}
            onSave={() => handleSave(0)}
            isSaved={!!savedStates[0]}
            audioKey={experience.content.audioKey}
            nextLayerLabel={nextLayerLabel}
          />
        )}
        {layers[currentLayer] === 'context' && experience.angle.contextBlocks && (
          <ContextLayer blocks={experience.angle.contextBlocks} scrollY={scrollY} />
        )}
        {layers[currentLayer] === 'practice' && (
          <PracticeLayer
            steps={practiceSteps}
            onCheckAll={() => setCurrentLayer(currentLayer + 1)}
            scrollY={scrollY}
            nextLayerLabel={nextLayerLabel}
          />
        )}
        {layers[currentLayer] === 'reflection' && experience.angle.reflection && (
          <ReflectionLayer
            prompt={experience.angle.reflection}
            onComplete={(reflection) => {
              onSaveReflection(reflection);
              onNext();
              setCurrentLayer(0);
            }}
            scrollY={scrollY}
          />
        )}
      </LayerContainer>
      </View>

      {/* Floating Header Overlay */}
      <View style={[styles.floatingHeader, { zIndex: 100 }]} pointerEvents="box-none">
        <GuidanceHeader
          mood={mood}
          islamicTerm={islamicTerm}
          onBack={onBack}
          onOptionsPress={() => setIsPrefsModalVisible(true)}
          activeIndex={currentLayer}
          totalCards={totalLayers}
          scrollY={scrollY}
        />
      </View>


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
      />
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
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});

export default GuidanceScreen;
