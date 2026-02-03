import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from '../screens/HomeScreen';
import GuidanceScreen from '../screens/GuidanceScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

import PremiumPaywallScreen from '../screens/PremiumPaywallScreen';
import PathsScreen from '../screens/PathsScreen';
import SavedScreen from '../screens/SavedScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { PathDetailScreen } from '../screens/PathDetailScreen';
import { PathStepScreen } from '../screens/PathStepScreen';
import { RotationEngine } from '../services/rotationEngine';
import { FreemiumService } from '../services/freemiumService';
import { PathsService } from '../services/pathsService';
import {
  Mood,
  GuidanceExperience,
  SpiritualPath,
  PathStep,
  UserPathProgress,
  ContentAngle,
} from '../types';
import { getMoodIslamicTerm } from '../data/constants';
import { initialContent } from '../data/initialContent';
import { quranContentAngles } from '../data/quranData';
import * as Haptics from 'expo-haptics';

type Screen =
  | 'onboarding'
  | 'main'
  | 'guidance'
  | 'paywall'
  | 'premium_paywall'
  | 'path_detail'
  | 'path_step';
type Tab = 'home' | 'paths' | 'saved' | 'settings';

interface MainNavigatorProps {
  rotationEngine: RotationEngine;
  freemiumService: FreemiumService;
}

export default function MainNavigator({ rotationEngine, freemiumService }: MainNavigatorProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = insets?.bottom ?? 0;
  const [currentScreen, setCurrentScreen] = useState<Screen>('onboarding');
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [currentExperience, setCurrentExperience] = useState<GuidanceExperience | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<SpiritualPath | null>(null);
  const [currentPathStep, setCurrentPathStep] = useState<PathStep | null>(null);
  const [userPathProgress, setUserPathProgress] = useState<UserPathProgress | null>(null);
  const [paywallType, setPaywallType] = useState<
    'daily_limit' | 'refresh_limit' | 'saved_limit' | 'conversion_trigger'
  >('daily_limit');
  const [isPremium, setIsPremium] = useState(false);
  const [unlockedBundleIds, setUnlockedBundleIds] = useState<string[]>([]);

  const pathsService = PathsService.getInstance();

  useEffect(() => {
    const syncMonetizationState = async () => {
      await freemiumService.waitForInitialization();
      setIsPremium(freemiumService.isPremium());
      setUnlockedBundleIds(freemiumService.getSubscriptionState()?.unlockedBundleIds || []);
    };
    syncMonetizationState();
  }, [freemiumService]);

  const handleMoodSelected = async (mood: Mood) => {
    setSelectedMood(mood);

    // Wait for freemium service to initialize
    await freemiumService.waitForInitialization();

    // Check if user can start a guidance session
    if (!freemiumService.canStartGuidanceSession()) {
      setPaywallType('daily_limit');
      setCurrentScreen('paywall');
      return;
    }

    // Start the guidance session
    const sessionStarted = await freemiumService.startGuidanceSession();
    if (!sessionStarted) {
      setPaywallType('daily_limit');
      setCurrentScreen('paywall');
      return;
    }

    // Get guidance directly from rotation engine (no tags)
    try {
      const experience = await rotationEngine.getGuidance(mood);
      if (experience) {
        setCurrentExperience(experience);
        setCurrentScreen('guidance');
      } else {
        Alert.alert('Content Not Available', 'Please try again or select a different mood.');
        setCurrentScreen('main');
      }
    } catch (error) {
      console.error('Error getting guidance:', error);
      Alert.alert('Error', 'Failed to load guidance. Please try again.');
      setCurrentScreen('main');
    }
  };

  const handleNext = async () => {
    if (!selectedMood) return;

    try {
      const experience = await rotationEngine.getGuidance(selectedMood);
      if (experience) {
        setCurrentExperience(experience);
      }
    } catch (error) {
      console.error('Error getting next guidance:', error);
    }
  };

  const handleShowPaywall = (
    type: 'daily_limit' | 'refresh_limit' | 'saved_limit' | 'conversion_trigger',
  ) => {
    setPaywallType(type);
    setCurrentScreen('paywall');
  };

  const handleUpgrade = async (type: 'monthly' | 'yearly') => {
    const success = await freemiumService.activatePremium(type);
    if (success) {
      setIsPremium(true);
      // Show welcome screen or go back to home
      setCurrentScreen('main');
    }
  };

  const handlePurchaseBundle = async (bundleId: string) => {
    const success = await freemiumService.purchaseBundle(bundleId);
    if (success) {
      setUnlockedBundleIds((prev) => [...prev, bundleId]);
      Alert.alert('Unlocked! 🎉', 'You now have permanent access to this special collection.');
    }
  };

  const handleRestore = async () => {
    const success = await freemiumService.restorePurchase();
    if (success) {
      Alert.alert('Restored', 'Your premium features have been restored.');
      setCurrentScreen('main');
    } else {
      Alert.alert('No Purchase Found', "We couldn't find any previous purchases to restore.");
    }
  };

  const handleMaybeLater = () => {
    // Go back to previous screen
    if (paywallType === 'daily_limit') {
      setCurrentScreen('main');
    } else {
      setCurrentScreen('guidance');
    }
  };

  const handleSaveReflection = async (reflection: string) => {
    if (!currentExperience || !selectedMood) return;

    try {
      await rotationEngine.saveReflection(
        currentExperience.content.id,
        currentExperience.angle.id,
        selectedMood,
        reflection,
      );
    } catch (error) {
      console.error('Error saving reflection:', error);
    }
  };

  const handleBack = () => {
    setCurrentScreen('main');
    setCurrentExperience(null);
    setSelectedMood(null);
  };

  const handleOnboardingComplete = async (plan?: 'free' | 'premium') => {
    if (plan === 'premium') {
      try {
        await freemiumService.startTrial();
        Alert.alert(
          'Trial Started! 🎉',
          'Welcome to Premium! You now have 7 days of unlimited access to find peace and clarity.',
          [{ text: "Let's Start", onPress: () => setCurrentScreen('main') }],
        );
      } catch (error) {
        console.error('Failed to start trial from onboarding:', error);
        setCurrentScreen('main');
      }
    } else {
      setCurrentScreen('main');
    }
  };

  const handlePathSelected = (pathId: string) => {
    const path = pathsService.getPathById(pathId);
    if (path) {
      setSelectedPath(path);
      setCurrentScreen('path_detail');
    }
  };

  const handleStartPath = async (pathId: string) => {
    const path = pathsService.getPathById(pathId);
    if (!path) return;

    const initialProgress: UserPathProgress = {
      pathId,
      currentDay: 1,
      startDate: Date.now(),
      completedDays: [],
      isCompleted: false,
    };

    setUserPathProgress(initialProgress);
    const step = path.dailySteps[0];
    setCurrentPathStep(step);

    // Fetch guidance for this step
    const content = initialContent.find((c) => c.id === step.contentId);
    const angle = quranContentAngles.find((a: any) => a.id === step.angleId);

    if (content && angle) {
      setCurrentExperience({ content, angle });
      setCurrentScreen('path_step');
    } else {
      Alert.alert('Error', 'Could not load path content. Please try again.');
    }
  };

  const handleContinuePath = async (pathId: string) => {
    if (!userPathProgress || userPathProgress.pathId !== pathId) return;

    const path = pathsService.getPathById(pathId);
    if (!path) return;

    const step = path.dailySteps.find((s: PathStep) => s.day === userPathProgress.currentDay);
    if (step) {
      setCurrentPathStep(step);
      const content = initialContent.find((c) => c.id === step.contentId);
      const angle = quranContentAngles.find((a: ContentAngle) => a.id === step.angleId);

      if (content && angle) {
        setCurrentExperience({ content, angle });
        setCurrentScreen('path_step');
      }
    }
  };

  const handleCompleteStep = (pathId: string, day: number) => {
    if (!userPathProgress || userPathProgress.pathId !== pathId) return;

    const newCompletedDays = [...userPathProgress.completedDays];
    if (!newCompletedDays.includes(day)) {
      newCompletedDays.push(day);
    }

    const isCompleted = newCompletedDays.length >= (selectedPath?.duration || 0);

    const updatedProgress = {
      ...userPathProgress,
      completedDays: newCompletedDays,
      isCompleted,
    };

    setUserPathProgress(updatedProgress);

    if (isCompleted) {
      Alert.alert('Path Completed!', 'Mubarak! You have completed this spiritual journey.', [
        { text: 'Alhamdulillah', onPress: () => setCurrentScreen('main') },
      ]);
    }
  };

  const handleNextPathStep = (pathId: string) => {
    if (!userPathProgress || userPathProgress.pathId !== pathId || !selectedPath) return;

    const nextDay = userPathProgress.currentDay + 1;
    if (nextDay > selectedPath.duration) {
      Alert.alert('Path Summary', 'You have reached the end of this journey.', [
        { text: 'Back to Journeys', onPress: () => setCurrentScreen('main') },
      ]);
      return;
    }

    const updatedProgress = {
      ...userPathProgress,
      currentDay: nextDay,
    };

    setUserPathProgress(updatedProgress);

    const nextStep = selectedPath.dailySteps.find((s: PathStep) => s.day === nextDay);
    if (nextStep) {
      setCurrentPathStep(nextStep);
      const content = initialContent.find((c) => c.id === nextStep.contentId);
      const angle = quranContentAngles.find((a: any) => a.id === nextStep.angleId);

      if (content && angle) {
        setCurrentExperience({ content, angle });
      }
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen onMoodSelected={handleMoodSelected} selectedMood={selectedMood} />;
      case 'paths':
        return (
          <PathsScreen
            onPathSelected={handlePathSelected}
            userProgress={userPathProgress || undefined}
            isPremium={isPremium}
            unlockedBundleIds={unlockedBundleIds}
          />
        );
      case 'saved':
        return <SavedScreen />;
      case 'settings':
        return <SettingsScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {currentScreen === 'onboarding' ? (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      ) : currentScreen === 'path_detail' && selectedPath ? (
        <PathDetailScreen
          path={selectedPath}
          userProgress={userPathProgress || undefined}
          onStartPath={handleStartPath}
          onContinuePath={handleContinuePath}
          onBack={() => setCurrentScreen('main')}
          onShowPaywall={() => handleShowPaywall('daily_limit')}
          onPurchaseBundle={handlePurchaseBundle}
        />
      ) : currentScreen === 'path_step' && selectedPath && currentPathStep && currentExperience ? (
        <PathStepScreen
          path={selectedPath}
          step={currentPathStep}
          userProgress={userPathProgress!}
          guidanceExperience={currentExperience}
          onCompleteStep={handleCompleteStep}
          onNextStep={handleNextPathStep}
          onBack={() => setCurrentScreen('main')}
        />
      ) : currentScreen === 'main' ? (
        <View style={styles.mainContainer}>
          {renderTabContent()}
          <View
            style={[
              styles.bottomTabBar,
              {
                paddingBottom: Math.max(bottomInset, 16),
                height: 56 + Math.max(bottomInset, 16),
              },
            ]}
          >
            <TabButton
              label="Home"
              icon="🏠"
              isActive={activeTab === 'home'}
              onPress={() => setActiveTab('home')}
            />
            <TabButton
              label="Paths"
              icon="🌱"
              isActive={activeTab === 'paths'}
              onPress={() => setActiveTab('paths')}
            />
            <TabButton
              label="Saved"
              icon="💾"
              isActive={activeTab === 'saved'}
              onPress={() => setActiveTab('saved')}
            />
            <TabButton
              label="Settings"
              icon="⚙️"
              isActive={activeTab === 'settings'}
              onPress={() => setActiveTab('settings')}
            />
          </View>
        </View>
      ) : currentScreen === 'guidance' ? (
        currentExperience &&
        selectedMood && (
          <GuidanceScreen
            experience={currentExperience}
            mood={selectedMood}
            islamicTerm={getMoodIslamicTerm(selectedMood)}
            onSaveReflection={handleSaveReflection}
            onBack={handleBack}
            onNext={handleNext}
            onShowPaywall={handleShowPaywall}
          />
        )
      ) : (
        <PremiumPaywallScreen
          paywallType={{ type: paywallType, remainingTime: freemiumService.getHoursUntilReset() }}
          onUpgrade={handleUpgrade}
          onRestore={handleRestore}
          onMaybeLater={handleMaybeLater}
          onBack={() => setCurrentScreen('main')}
        />
      )}
      <StatusBar style="light" />
    </View>
  );
}

interface TabButtonProps {
  label: string;
  icon: string;
  isActive: boolean;
  onPress: () => void;
}

const TabButton = ({ label, icon, isActive, onPress }: TabButtonProps) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity style={styles.tabButton} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.tabContent}>
        <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{icon}</Text>
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
        {isActive && <View style={styles.tabUnderline} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F12',
  },
  mainContainer: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#121A1F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 72,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  tabUnderline: {
    width: 24,
    height: 2,
    backgroundColor: '#2ED3C6',
    borderRadius: 1,
    marginTop: 4,
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#2ED3C6',
    fontWeight: '600',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B0F12',
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '500',
  },
});
