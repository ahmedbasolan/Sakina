import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SpiritualPath, PathStep, UserPathProgress, GuidanceExperience } from '../types';
import { PathsService } from '../services/pathsService';
import CardDecoration from '../components/CardDecoration';

interface PathStepScreenProps {
  path: SpiritualPath;
  step: PathStep;
  userProgress: UserPathProgress;
  guidanceExperience: GuidanceExperience;
  onCompleteStep: (pathId: string, day: number) => void;
  onNextStep: (pathId: string) => void;
  onBack: () => void;
}

export const PathStepScreen: React.FC<PathStepScreenProps> = ({
  path,
  step,
  userProgress,
  guidanceExperience,
  onCompleteStep,
  onNextStep,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = insets?.bottom ?? 0;
  const pathsService = PathsService.getInstance();
  const [showContext, setShowContext] = React.useState(false);
  const [showPractice, setShowPractice] = React.useState(false);
  const [showReflection, setShowReflection] = React.useState(false);
  const [checkedItems, setCheckedItems] = React.useState<string[]>([]);
  const [reflectionText, setReflectionText] = React.useState('');
  const [isSaved, setIsSaved] = React.useState(false);

  // Animated values
  const fadeAnim1 = React.useRef(new Animated.Value(0)).current;
  const slideAnim1 = React.useRef(new Animated.Value(20)).current;
  const fadeAnim2 = React.useRef(new Animated.Value(0)).current;
  const slideAnim2 = React.useRef(new Animated.Value(20)).current;
  const fadeAnim3 = React.useRef(new Animated.Value(0)).current;
  const slideAnim3 = React.useRef(new Animated.Value(20)).current;
  const fadeAnim4 = React.useRef(new Animated.Value(0)).current;
  const slideAnim4 = React.useRef(new Animated.Value(20)).current;

  const progressAnim = React.useRef(new Animated.Value(0)).current;

  // Initial animation
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim1, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim1, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  // Animate progress bar
  React.useEffect(() => {
    const progressPercentage = Math.round((step.day / path.duration) * 100);
    Animated.timing(progressAnim, {
      toValue: progressPercentage,
      duration: 1000,
      useNativeDriver: false, // width cannot use native driver
    }).start();
  }, [step.day, path.duration]);

  // Animate card entries
  React.useEffect(() => {
    if (showContext) {
      Animated.parallel([
        Animated.timing(fadeAnim2, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim2, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [showContext]);

  React.useEffect(() => {
    if (showPractice) {
      Animated.parallel([
        Animated.timing(fadeAnim3, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim3, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [showPractice]);

  React.useEffect(() => {
    if (showReflection) {
      Animated.parallel([
        Animated.timing(fadeAnim4, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim4, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [showReflection]);

  const handleCompleteStep = () => {
    onCompleteStep(path.id, step.day);
  };

  const handleNextStep = () => {
    const nextStep = pathsService.getNextStep(path.id, userProgress);
    if (nextStep) {
      onNextStep(path.id);
    } else {
      Alert.alert(
        'Path Completed!',
        `🎉 Congratulations! You've completed the ${path.title} path.`,
        [{ text: 'Awesome!', onPress: onBack }],
      );
    }
  };

  const toggleItem = (item: string) => {
    if (checkedItems.includes(item)) {
      setCheckedItems(checkedItems.filter((i) => i !== item));
    } else {
      setCheckedItems([...checkedItems, item]);
    }
  };

  const isStepCompleted = userProgress.completedDays.includes(step.day);
  const progressPercentage = Math.round((step.day / path.duration) * 100);
  const isLastStep = step.day === path.duration;

  // Split multi-line actions into bullet points if they exist
  const practiceItems = guidanceExperience.angle.action
    ? guidanceExperience.angle.action.split('\n').filter(line => line.trim().length > 0)
    : [];

  const isReflectionValid = reflectionText.trim().length >= 10;
  const canMarkComplete = showReflection && isReflectionValid && isSaved;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="close-outline" size={28} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Day {step.day} of {path.duration} • {progressPercentage}%
          </Text>
          <View style={styles.progressBar}>
            <Animated.View style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                })
              }
            ]} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Card 1: Quran & Sunnah */}
        <Animated.View style={[
          styles.contentCard,
          { opacity: fadeAnim1, transform: [{ translateY: slideAnim1 }] }
        ]}>
          <CardDecoration type="verse" />
          <Text style={styles.cardLabel}>Quran & Sunnah</Text>
          <View style={styles.divider} />

          {guidanceExperience.content.arabicText && (
            <Text style={[styles.arabicText, styles.largeArabic]}>
              {guidanceExperience.content.arabicText}
            </Text>
          )}

          <Text style={styles.translationText}>
            "{guidanceExperience.content.englishTranslation}"
          </Text>
          <Text style={styles.sourceText}>{guidanceExperience.content.source}</Text>

          {!showContext && (
            <TouchableOpacity
              style={styles.revealButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowContext(true);
              }}
            >
              <Text style={styles.revealButtonText}>Read Scholarly Context ↓</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Card 2: Scholarly Context */}
        {showContext && (
          <Animated.View style={[
            styles.contentCard,
            styles.revealedCard,
            { opacity: fadeAnim2, transform: [{ translateY: slideAnim2 }] }
          ]}>
            <CardDecoration type="wisdom" />
            <Text style={styles.cardLabel}>Scholarly Context</Text>
            <View style={styles.divider} />

            {guidanceExperience.content.whyThis && (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxLabel}>Why This Matters</Text>
                <Text style={styles.infoBoxText}>{guidanceExperience.content.whyThis}</Text>
              </View>
            )}

            <Text style={styles.contextText}>
              {guidanceExperience.angle.angle}
            </Text>

            {!showPractice && (
              <TouchableOpacity
                style={styles.revealButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowPractice(true);
                }}
              >
                <Text style={styles.revealButtonText}>Today's Practice ↓</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* Card 3: Today's Practice Checklist */}
        {showPractice && (
          <Animated.View style={[
            styles.contentCard,
            styles.revealedCard,
            { opacity: fadeAnim3, transform: [{ translateY: slideAnim3 }] }
          ]}>
            <CardDecoration type="action" />
            <Text style={styles.cardLabel}>Today's Practice</Text>
            <View style={styles.divider} />

            <View style={styles.checklist}>
              {practiceItems.length > 0 ? (
                practiceItems.map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.checkItem}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      toggleItem(item);
                    }}
                  >
                    <Ionicons
                      name={checkedItems.includes(item) ? "checkbox" : "square-outline"}
                      size={24}
                      color={checkedItems.includes(item) ? "#2ED3C6" : "rgba(255,255,255,0.3)"}
                    />
                    <Text style={[
                      styles.checkText,
                      checkedItems.includes(item) && styles.checkTextCompleted
                    ]}>
                      {item.replace(/^[0-9.]+\s*/, '')}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.actionText}>{guidanceExperience.angle.action}</Text>
              )}
            </View>

            {guidanceExperience.angle.actionHowTo && (
              <View style={styles.howToBox}>
                <Text style={styles.howToLabel}>How to practice:</Text>
                <Text style={styles.howToText}>{guidanceExperience.angle.actionHowTo}</Text>
              </View>
            )}

            {guidanceExperience.angle.actionReward && (
              <View style={styles.rewardBox}>
                <Ionicons name="sparkles" size={16} color="#FFD700" style={styles.rewardIcon} />
                <Text style={styles.rewardText}>{guidanceExperience.angle.actionReward}</Text>
              </View>
            )}

            {!showReflection && (
              <TouchableOpacity
                style={styles.revealButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowReflection(true);
                }}
              >
                <Text style={styles.revealButtonText}>Daily Reflection ↓</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* Card 4: Reflection Input */}
        {showReflection && (
          <Animated.View style={[
            styles.contentCard,
            styles.revealedCard,
            { marginBottom: 32, opacity: fadeAnim4, transform: [{ translateY: slideAnim4 }] }
          ]}>
            <CardDecoration type="wisdom" />
            <Text style={styles.cardLabel}>Your Reflection</Text>
            <View style={styles.divider} />

            <Text style={styles.reflectionPrompt}>
              {guidanceExperience.angle.reflection}
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tap to Write</Text>
              <TextInput
                style={styles.textArea}
                multiline
                placeholder="How did this verse change your perspective today?"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={reflectionText}
                onChangeText={(text) => {
                  setReflectionText(text);
                  setIsSaved(false);
                }}
              />
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaved && styles.savedButton,
                  !isReflectionValid && styles.disabledSaveButton
                ]}
                onPress={() => {
                  if (isReflectionValid) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setIsSaved(true);
                  }
                }}
                disabled={!isReflectionValid}
              >
                <Text style={styles.saveButtonText}>
                  {isSaved ? "✓ Saved to Profile" : "Securely Save Reflection"}
                </Text>
              </TouchableOpacity>
              {!isReflectionValid && reflectionText.length > 0 && (
                <Text style={styles.errorText}>Please write at least 10 characters.</Text>
              )}
            </View>
          </Animated.View>
        )}

        {/* Motivation Footer */}
        {showReflection && (
          <View style={styles.motivationSection}>
            <Text style={styles.motivationText}>{pathsService.getStepMotivation(step)}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={[styles.actionSection, { marginBottom: Math.max(40, bottomInset + 20) }]}>
          {!isStepCompleted ? (
            <TouchableOpacity
              style={[styles.completeButton, !canMarkComplete && styles.disabledButton]}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                handleCompleteStep();
              }}
              disabled={!canMarkComplete}
            >
              <Text style={[styles.completeButtonText, !canMarkComplete && styles.disabledButtonText]}>
                {canMarkComplete ? "Mark Day Complete" : "Complete Reflection to Finish"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.completeButton, styles.nextButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                handleNextStep();
              }}
            >
              <Text style={styles.completeButtonText}>
                {isLastStep ? 'View Path Summary' : 'Next Day →'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F12',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12,
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.70)',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2ED3C6',
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentCard: {
    backgroundColor: '#1A1F23',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  revealedCard: {
    backgroundColor: '#1E2428',
    borderColor: 'rgba(46,211,198,0.3)',
    shadowColor: '#2ED3C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2ED3C6',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
    width: '40%',
  },
  arabicText: {
    fontSize: 24,
    lineHeight: 44,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Amiri-Regular',
  },
  largeArabic: {
    fontSize: 32,
    lineHeight: 52,
  },
  translationText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 28,
    marginBottom: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  sourceText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginBottom: 20,
  },
  contextText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 26,
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: 'rgba(46,211,198,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#2ED3C6',
  },
  infoBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2ED3C6',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  revealButton: {
    backgroundColor: 'rgba(46,211,198,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  revealButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2ED3C6',
  },
  checklist: {
    marginTop: 8,
    marginBottom: 16,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  checkText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  checkTextCompleted: {
    color: 'rgba(46,211,198,0.6)',
    textDecorationLine: 'line-through',
  },
  howToBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  howToLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
  },
  howToText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  rewardBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,215,0,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  rewardIcon: {
    marginRight: 10,
  },
  rewardText: {
    flex: 1,
    fontSize: 13,
    color: '#FFD700',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actionText: {
    fontSize: 16,
    color: '#2ED3C6',
    lineHeight: 24,
    fontWeight: '500',
  },
  reflectionPrompt: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 26,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  inputContainer: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
    color: '#FFFFFF',
    fontSize: 16,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  savedButton: {
    backgroundColor: '#2ED3C6',
  },
  disabledSaveButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 12,
    color: '#FF5252',
    marginTop: 8,
    textAlign: 'center',
  },
  motivationSection: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 40,
    backgroundColor: 'rgba(46,211,198,0.03)',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: 'rgba(46,211,198,0.3)',
  },
  motivationText: {
    fontSize: 18,
    color: '#2ED3C6',
    lineHeight: 28,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionSection: {
    marginBottom: 60,
  },
  completeButton: {
    backgroundColor: '#2ED3C6',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#2ED3C6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledButtonText: {
    color: 'rgba(255,255,255,0.3)',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0B0F12',
  },
});
