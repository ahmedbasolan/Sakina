import React, { useState, useMemo, useEffect } from 'react';
import { Alert, Share, Dimensions } from 'react-native';
const { height } = Dimensions.get('window');
import { SpiritualPath, PathStep, UserPathProgress, GuidanceExperience } from '../types';
import { PathsService } from '../services/pathsService';
import ImmersiveBackground from '../components/ImmersiveBackground';
import PathTopBar from '../components/PathTopBar';
import LayerContainer from '../components/LayerContainer';
import VerseLayer from '../components/VerseLayer';
import ContextLayer from '../components/ContextLayer';
import PracticeLayer, { PracticeStepData } from '../components/PracticeLayer';
import ReflectionLayer from '../components/ReflectionLayer';
import FloatingActionRow from '../components/FloatingActionRow';
import PathCompletionCelebration from '../components/PathCompletionCelebration';
import { SubscriptionService } from '../services/subscriptionService';
import { logServiceError } from '../services/errorLoggingService';

import { useRoute, useNavigation } from '@react-navigation/native';

interface PathStepScreenProps {
  path: SpiritualPath;
  step: PathStep;
  userProgress: UserPathProgress;
  guidanceExperience: GuidanceExperience;
  onCompleteStep: (pathId: string, day: number) => void;
  onNextStep: (pathId: string) => void;
  onBack: () => void;
}

type LayerType = 'verse' | 'context' | 'practice' | 'reflection';

export const PathStepScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const pathsService = PathsService.getInstance();
  const isPremium = SubscriptionService.getInstance().isPremium();

  const { path, step, userProgress, guidanceExperience } = route.params;

  const onBack = () => navigation.goBack();

  const onCompleteStep = async (pathId: string, day: number) => {
    const updatedProgress: UserPathProgress = {
      ...userProgress,
      completedDays: [...userProgress.completedDays, day],
      currentDay: day + 1,
      isCompleted: day >= path.duration,
      completedAt: day >= path.duration ? Date.now() : undefined,
    };
    await pathsService.saveProgress(updatedProgress);
    // Refresh params for next step if needed or navigate back
    navigation.goBack();
  };
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [reflectionWritten, setReflectionWritten] = useState(false);

  const layerTypes: LayerType[] = ['verse', 'context', 'practice', 'reflection'];
  const currentLayerType = layerTypes[currentLayerIndex];

  // Build structured practice steps from angle data
  const practiceSteps: PracticeStepData[] = useMemo(() => {
    const angle = guidanceExperience.angle;

    if (angle.practiceSteps) {
      try {
        return JSON.parse(angle.practiceSteps);
      } catch (e) {
        logServiceError('PathStepScreen', 'parsePracticeSteps', e instanceof Error ? e : new Error(String(e)));
      }
    }

    // Fallback: build from existing individual angle fields if practiceSteps not available
    const steps: PracticeStepData[] = [];
    if (angle.action) {
      steps.push({
        type: 'physical',
        icon: 'hands-prayer',
        title: 'Practice',
        instruction: angle.action,
        arabicText: angle.actionArabicText,
        transliteration: angle.actionTransliteration,
        translation: angle.actionTranslation,
        source: angle.actionSource || guidanceExperience.content.source || 'Sunnah',
        sourceType: 'sunnah_action',
      });
    }

    if (angle.actionHowTo && steps.length > 0) {
      // Append how-to to the first step if it exists
      steps[0].instruction = `${steps[0].instruction}\n\nHow to: ${angle.actionHowTo}`;
    }

    return steps;
  }, [guidanceExperience]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${guidanceExperience.content.englishTranslation}\n\n— ${guidanceExperience.content.source}\nReflect more on Guidance App.`,
      });
    } catch (error) {
      logServiceError('PathStepScreen', 'handleShare', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleComplete = (reflection: string) => {
    // Track if user wrote a reflection
    if (reflection && reflection.trim().length > 0) {
      setReflectionWritten(true);
    }
    // Show celebration modal instead of immediately completing
    setShowCelebration(true);
  };

  const handleCelebrationContinue = () => {
    setShowCelebration(false);
    onCompleteStep(path.id, step.day);
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    onCompleteStep(path.id, step.day);
  };

  const renderLayer = () => {
    switch (currentLayerType) {
      case 'verse':
        return (
          <VerseLayer
            arabic={guidanceExperience.content.arabicText || ''}
            translation={guidanceExperience.content.englishTranslation}
            reference={guidanceExperience.content.source || ''}
          />
        );
      case 'context':
        return (
          <ContextLayer
            blocks={
              guidanceExperience.angle.contextBlocks && guidanceExperience.angle.contextBlocks.length > 0
                ? guidanceExperience.angle.contextBlocks
                : [
                    {
                      kind: 'tafsir' as const,
                      text: guidanceExperience.angle.angle,
                      source: {
                        label: guidanceExperience.content.whyThis || 'Islamic Guidance',
                        url: '',
                      },
                    },
                  ]
            }
          />
        );
      case 'practice':
        return <PracticeLayer steps={practiceSteps} onCheckAll={() => { }} />;
      case 'reflection':
        return (
          <ReflectionLayer
            prompt={guidanceExperience.angle.reflection || 'How did this impact you today?'}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ImmersiveBackground theme="sand" isPremium={isPremium}>
      <PathTopBar
        currentDay={step.day}
        totalDays={path.duration}
        onSettingsPress={() => Alert.alert('Customize', 'Background selector coming soon.')}
        onBack={onBack}
      />

      <LayerContainer
        currentLayer={currentLayerIndex}
        totalLayers={layerTypes.length}
        onLayerChange={setCurrentLayerIndex}
      >
        {renderLayer()}
      </LayerContainer>

      <FloatingActionRow
        layerType={currentLayerType}
        onShare={handleShare}
        onSave={() => setIsSaved(!isSaved)}
        isSaved={isSaved}
        onCheckAll={() => Alert.alert('Barakah!', 'You have completed all items.')}
        onSaveReflection={() => Alert.alert('Saved', 'Your reflection has been saved as a draft.')}
      />

      <PathCompletionCelebration
        visible={showCelebration}
        path={path}
        step={step}
        userProgress={userProgress}
        reflectionWritten={reflectionWritten}
        onContinue={handleCelebrationContinue}
        onClose={handleCelebrationClose}
      />
    </ImmersiveBackground>
  );
};
