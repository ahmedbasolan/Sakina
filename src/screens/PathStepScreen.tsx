import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Share, View, PanResponder, StyleSheet } from 'react-native';
import { HapticsService } from '../services/hapticsService';
import { UserPathProgress, Content } from '../types';
import { PathsService } from '../services/pathsService';
import ImmersiveBackground from '../components/ImmersiveBackground';
import PathTopBar from '../components/PathTopBar';
import LayerContainer from '../components/LayerContainer';
import LayerPager from '../components/LayerPager';
import HadithLayer from '../components/HadithLayer';
import VerseLayer from '../components/VerseLayer';
import ContextLayer from '../components/ContextLayer';
import PracticeLayer, { PracticeStepData } from '../components/PracticeLayer';
import ReflectionLayer from '../components/ReflectionLayer';
import FloatingActionRow from '../components/FloatingActionRow';
import PathCompletionCelebration from '../components/PathCompletionCelebration';
import { SubscriptionService } from '../services/subscriptionService';
import { FreemiumService } from '../services/freemiumService';
import { logServiceError } from '../services/errorLoggingService';
import { useAppContext } from '../context/AppContext';

import { useRoute, useNavigation } from '@react-navigation/native';
import { extractVerseKey } from '../utils';
import { Colors } from '../theme/DesignSystem';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import SwipeNextOverlay from '../components/SwipeNextOverlay';

type LayerType = 'hadith' | 'verse' | 'context' | 'practice' | 'reflection';

export const PathStepScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const pathsService = PathsService.getInstance();
  const { rotationEngine } = useAppContext();
  const isPremium = SubscriptionService.getInstance().isPremium();
  const freemium = FreemiumService.getInstance();

  const {
    path,
    step,
    userProgress,
    guidanceExperience,
    accentColor: accentParam,
    hadithContent: hadithContentParam,
  } = route.params;

  // Journey identity color (passed from PathDetailScreen) + emotional register.
  const accentColor: string = accentParam || Colors.accent.primary;
  const tone =
    path.tone || (path.theme === 'Sad' || path.theme === 'Angry' ? 'refuge' : 'momentum');

  // Phase label for long, chunked journeys (e.g. "Week 1 — Foundations").
  const phaseLabel = path.phases?.find(
    (p: { startDay: number; endDay: number }) => step.day >= p.startDay && step.day <= p.endDay,
  )?.label;

  const onBack = () => navigation.goBack();

  /**
   * Persist this day's completion, then either carry the user straight into the
   * next day's lesson (keeping the immersive flow / momentum) or return to the
   * journey. Advancing uses navigation.replace so the back stack doesn't fill
   * up with completed steps.
   */
  const completeAndAdvance = async (toNext: boolean) => {
    const day = step.day;
    const updatedProgress: UserPathProgress = {
      ...userProgress,
      completedDays: userProgress.completedDays.includes(day)
        ? userProgress.completedDays
        : [...userProgress.completedDays, day],
      // Never move backward: revisiting/finishing an earlier day must not roll
      // the user's current position back and re-lock days they'd already reached.
      currentDay: Math.max(userProgress.currentDay, day + 1),
      isCompleted: day >= path.duration,
      completedAt: day >= path.duration ? Date.now() : undefined,
    };
    await pathsService.saveProgress(updatedProgress);

    if (toNext && !updatedProgress.isCompleted) {
      const nextStep = pathsService.getCurrentStep(path.id, updatedProgress);
      if (nextStep) {
        try {
          const [experience, hadithContent] = await Promise.all([
            rotationEngine.getGuidanceForStep(nextStep.contentId, nextStep.angleId),
            nextStep.hadithContentId
              ? rotationEngine.getHadithContent(nextStep.hadithContentId)
              : Promise.resolve(null),
          ]);
          if (experience) {
            // Clear this day's reflection before handing off. The completion
            // card now renders the text itself, so if `replace` ever reuses
            // this screen instance instead of remounting it, day N+1 would
            // show day N's words back to the user as if they'd just written
            // them. Cheap insurance against a wrong-content bug.
            setReflectionWritten(false);
            setReflectionText('');
            navigation.replace('PathStep', {
              path,
              step: nextStep,
              userProgress: updatedProgress,
              guidanceExperience: experience,
              accentColor,
              hadithContent: hadithContent ?? undefined,
            });
            return;
          }
        } catch (error) {
          logServiceError(
            'PathStepScreen',
            'completeAndAdvance',
            error instanceof Error ? error : new Error(String(error)),
          );
        }
      }
    }
    // Path complete, no next step, or content failed to load → back to journey.
    navigation.goBack();
  };
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  // Journey-end peak: whether to surface the gentle "support the mission" line
  // in the completion celebration. Decided once (gate + cooldown) on finish.
  const [offerUpgrade, setOfferUpgrade] = useState(false);

  // Hadith content is normally prefetched by PathDetailScreen and passed in via
  // route params (mirrors `guidanceExperience`). It's local state (not read
  // directly from route.params) so the fallback fetch below can populate it.
  const [hadithContent, setHadithContent] = useState<Content | null>(hadithContentParam ?? null);

  const hasHadith = !!(step.hadithContentId && hadithContent);
  const layerTypes: LayerType[] = hasHadith
    ? ['hadith', 'verse', 'context', 'practice', 'reflection']
    : ['verse', 'context', 'practice', 'reflection'];

  // Swipe right → advance to the next layer (mirrors swipe-up on LayerContainer).
  // Uses functional state update so it never reads stale currentLayerIndex.
  // Ref to layerTypes so the hook has access to the latest length
  const layerTypesRef = useRef(layerTypes);
  useEffect(() => {
    layerTypesRef.current = layerTypes;
  }, [layerTypes]);

  // Swipe left → next layer.
  // Uses a horizontal-dominant threshold so it never conflicts with
  // LayerContainer's vertical-swipe gesture.
  const { panHandlers: swipePanHandlers, swipeAnim: swipeOverlayAnim } = useSwipeGesture({
    onNext: () => {
      setCurrentLayerIndex((prev) => {
        const next = Math.min(prev + 1, layerTypesRef.current.length - 1);
        if (next !== prev) HapticsService.impactAsync('LIGHT');
        return next;
      });
    },
    threshold: 50,
  });
  const [reflectionWritten, setReflectionWritten] = useState(false);
  // The reflection text itself — the completion card echoes it back, which is
  // what makes writing one feel worth the effort next time.
  const [reflectionText, setReflectionText] = useState('');
  // Snapshot of progress with TODAY already appended — passed to the modal so
  // the ring/streak/next-day preview reflect the step just completed, not the
  // stale route.params snapshot (which is missing the current day).
  const [celebrationProgress, setCelebrationProgress] = useState(userProgress);

  // Safety net (mirrors GuidanceScreen's `experience` fallback fetch): if this
  // step has a hadithContentId but the prefetched content never arrived — a
  // failed prefetch, or a future caller that forgets to pass it — fetch it here
  // instead of leaving that layer stuck without content.
  useEffect(() => {
    if (!step.hadithContentId || hadithContent) return;
    let cancelled = false;
    (async () => {
      try {
        const content = await rotationEngine.getHadithContent(step.hadithContentId);
        if (!cancelled && content) {
          setHadithContent(content);
        }
      } catch (error) {
        logServiceError(
          'PathStepScreen',
          'fallbackFetchHadith',
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step.hadithContentId, hadithContent, rotationEngine]);

  const currentLayerType = layerTypes[currentLayerIndex];

  // currentLayerIndex is a raw numeric index into layerTypes, whose length
  // depends on hasHadith. The fallback fetch above can flip hasHadith from
  // false to true well after mount (a slow retry succeeding after the user
  // has already navigated a few layers in), which inserts 'hadith' at the
  // front and silently shifts every existing index — the user would suddenly
  // be looking at different content than a moment ago. Shift the index by
  // the same +1 the instant that insertion happens, so it keeps pointing at
  // the same layer the user was already reading.
  const hadHadithRef = useRef(hasHadith);
  useEffect(() => {
    if (hasHadith && !hadHadithRef.current) {
      setCurrentLayerIndex((prev) => prev + 1);
    }
    hadHadithRef.current = hasHadith;
  }, [hasHadith]);

  // Build structured practice steps from angle data
  const practiceSteps: PracticeStepData[] = useMemo(() => {
    const angle = guidanceExperience.angle;

    if (angle.practiceSteps) {
      try {
        return JSON.parse(angle.practiceSteps);
      } catch (e) {
        logServiceError(
          'PathStepScreen',
          'parsePracticeSteps',
          e instanceof Error ? e : new Error(String(e)),
        );
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

  /**
   * The single practice the user carries out of this session, shown as the hero
   * of the completion card.
   *
   * Verbal first, deliberately. A du'a is what a person actually carries
   * through a day — it needs no notebook, and it renders with its Arabic,
   * transliteration and translation. Physical steps in the current content are
   * overwhelmingly "write this down" (8 of 14 journey days use the same `pen`
   * icon), which is a desk activity belonging to the session that just ended,
   * and none of them carry a du'a — so a physical-first order would leave the
   * card's Arabic block dead code on every single day.
   *
   * Falls back to null so the card omits the block rather than rendering an
   * empty shell.
   */
  const carry = useMemo(() => {
    const byType = (t: PracticeStepData['type']) => practiceSteps.find((s) => s.type === t);
    return byType('verbal') || byType('physical') || byType('mindset') || null;
  }, [practiceSteps]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${guidanceExperience.content.englishTranslation}\n\n— ${guidanceExperience.content.source}\nReflect more on Sakina.`,
      });
    } catch (error) {
      logServiceError(
        'PathStepScreen',
        'handleShare',
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  };

  const handleComplete = (reflection: string) => {
    if (reflection && reflection.trim().length > 0) {
      setReflectionWritten(true);
      setReflectionText(reflection);
      // Journey reflections were never persisted — `saveReflection` was only
      // ever called from GuidanceScreen, so everything written inside a path
      // was discarded on navigate and never reached Reflection History. The
      // old card's "Reflection saved" badge was asserting something that had
      // not happened. Fire-and-forget: a storage failure must not block the
      // completion flow the user has already earned.
      rotationEngine
        .saveReflection(step.contentId, step.angleId, path.theme, reflection)
        .catch((error) =>
          logServiceError(
            'PathStepScreen',
            'saveReflection',
            error instanceof Error ? error : new Error(String(error)),
          ),
        );
    }
    // Build the updated snapshot eagerly so the celebration modal shows
    // today's day as already complete (correct %, streak, next-day preview).
    const day = step.day;
    const updatedForModal: typeof userProgress = {
      ...userProgress,
      completedDays: userProgress.completedDays.includes(day)
        ? userProgress.completedDays
        : [...userProgress.completedDays, day],
      currentDay: Math.max(userProgress.currentDay, day + 1),
      isCompleted: day >= path.duration,
    };
    setCelebrationProgress(updatedForModal);

    // Journey-end is a "peak" (spec §8): if the gate allows, offer a single soft
    // support line. Check before recording (recording flips the gate off).
    if (updatedForModal.isCompleted) {
      const willOffer = freemium.shouldOfferUpgrade('journey_complete');
      if (willOffer) freemium.recordUpgradeAsk('journey_complete');
      setOfferUpgrade(willOffer);
    } else {
      setOfferUpgrade(false);
    }

    setShowCelebration(true);
  };

  // Primary action: complete today and continue into the next day's lesson.
  const handleCelebrationContinue = () => {
    setShowCelebration(false);
    completeAndAdvance(true);
  };

  // Secondary action (and backdrop tap): complete today but return to the journey.
  const handleCelebrationClose = () => {
    setShowCelebration(false);
    completeAndAdvance(false);
  };

  // Journey-end peak: persist completion, then open the gentle Support screen.
  const handleCelebrationSupport = async () => {
    setShowCelebration(false);
    await completeAndAdvance(false); // save the finished journey + return to it
    navigation.navigate('Support');
  };

  const renderLayer = () => {
    switch (currentLayerType) {
      case 'hadith':
        return hadithContent ? (
          <HadithLayer hadith={hadithContent} accentColor={accentColor} />
        ) : null;
      case 'verse':
        return (
          <VerseLayer
            arabic={guidanceExperience.content.arabicText || ''}
            translation={guidanceExperience.content.englishTranslation}
            reference={guidanceExperience.content.source || ''}
            accentColor={accentColor}
            onShare={handleShare}
            onSave={() => setIsSaved(!isSaved)}
            isSaved={isSaved}
            audioKey={extractVerseKey(guidanceExperience.content.source || '')}
          />
        );
      case 'context':
        return (
          <ContextLayer
            attribution="Insightful Context"
            text={guidanceExperience.angle.angle}
            source={guidanceExperience.content.whyThis || 'Islamic Guidance'}
            accentColor={accentColor}
          />
        );
      case 'practice':
        return (
          <PracticeLayer
            steps={practiceSteps}
            onCheckAll={() => {
              // All Sunnah steps done → carry momentum forward into the
              // reflection layer (the final step before day completion).
              HapticsService.impactAsync('LIGHT');
              setCurrentLayerIndex((prev) => Math.min(prev + 1, layerTypes.length - 1));
            }}
            accentColor={accentColor}
          />
        );
      case 'reflection':
        return (
          <ReflectionLayer
            prompt={guidanceExperience.angle.reflection || 'How did this impact you today?'}
            onComplete={handleComplete}
            accentColor={accentColor}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ImmersiveBackground accentColor={accentColor} tone={tone} isPremium={isPremium}>
      <PathTopBar
        currentDay={step.day}
        totalDays={path.duration}
        completedDays={userProgress.completedDays.length}
        accentColor={accentColor}
        phaseLabel={phaseLabel}
        onBack={onBack}
      />

      <View style={{ flex: 1 }} {...swipePanHandlers}>
        {currentLayerIndex < layerTypes.length - 1 && (
          <SwipeNextOverlay
            animValue={swipeOverlayAnim}
            accentColor={accentColor}
            label={layerTypes[currentLayerIndex + 1] ? `NEXT: ${layerTypes[currentLayerIndex + 1].toUpperCase()}` : 'NEXT'}
          />
        )}
        <LayerContainer
          currentLayer={currentLayerIndex}
          totalLayers={layerTypes.length}
          onLayerChange={setCurrentLayerIndex}
        >
          {renderLayer()}
        </LayerContainer>

        {/* Verse, practice, and reflection layers own their controls (cinema-mode
            bar / check toggles / save-skip). Only the context layer lacks its own
            action surface, so the floating row is reserved for it. Anchored to
            the bottom of this flex:1 area (not a flow sibling of LayerPager
            below) so it floats just above the pager — matching VerseLayer's own
            absolutely-positioned footer instead of stacking under the tabs. */}
        {currentLayerType === 'context' && (
          <View style={styles.floatingActionWrap} pointerEvents="box-none">
            <FloatingActionRow
              layerType={currentLayerType}
              onShare={handleShare}
              onSave={() => setIsSaved(!isSaved)}
              isSaved={isSaved}
            />
          </View>
        )}
      </View>

      <LayerPager
        total={layerTypes.length}
        current={currentLayerIndex}
        labels={
          hasHadith
            ? ['Hadith', 'Verse', 'Context', 'Practice', 'Reflection']
            : ['Verse', 'Context', 'Practice', 'Reflection']
        }
        accentColor={accentColor}
        onLayerChange={setCurrentLayerIndex}
      />

      <PathCompletionCelebration
        visible={showCelebration}
        path={path}
        step={step}
        userProgress={celebrationProgress}
        reflectionWritten={reflectionWritten}
        reflectionText={reflectionText}
        carry={carry}
        accentColor={accentColor}
        onContinue={handleCelebrationContinue}
        onClose={handleCelebrationClose}
        onSupport={offerUpgrade ? handleCelebrationSupport : undefined}
      />
    </ImmersiveBackground>
  );
};

const styles = StyleSheet.create({
  floatingActionWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
