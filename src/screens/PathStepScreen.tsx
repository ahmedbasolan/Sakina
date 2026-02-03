import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpiritualPath, PathStep, UserPathProgress, GuidanceExperience } from '../types';
import { PathsService } from '../services/pathsService';
import { RotationEngine } from '../services/rotationEngine';

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
  const pathsService = PathsService.getInstance();
  const rotationEngine = new RotationEngine();

  const handleCompleteStep = () => {
    Alert.alert(
      "Complete Today's Step",
      `Mark Day ${step.day} as complete?\n\nYou can continue to the next step or come back tomorrow.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Complete',
          onPress: () => onCompleteStep(path.id, step.day),
        },
      ],
    );
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

  const isStepCompleted = userProgress.completedDays.includes(step.day);
  const progressPercentage = pathsService.getProgressPercentage(userProgress);
  const isLastStep = step.day === path.duration;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Day {step.day} of {path.duration}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Step Header */}
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepFocus}>{step.focus}</Text>

          {isStepCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✓ Completed</Text>
            </View>
          )}
        </View>

        {/* Guidance Content */}
        <View style={styles.guidanceSection}>
          <Text style={styles.sectionTitle}>Today's Guidance</Text>

          <View style={styles.contentCard}>
            {/* Primary Text */}
            <View style={styles.contentBlock}>
              <Text style={styles.contentLabel}>Qur'an & Sunnah</Text>
              <Text style={styles.primaryText}>{guidanceExperience.content.primaryText}</Text>

              {guidanceExperience.content.arabicText && (
                <Text style={styles.arabicText}>{guidanceExperience.content.arabicText}</Text>
              )}

              <Text style={styles.translationText}>
                {guidanceExperience.content.englishTranslation}
              </Text>

              <Text style={styles.sourceText}>{guidanceExperience.content.source}</Text>
            </View>

            {/* Why This */}
            <View style={styles.contentBlock}>
              <Text style={styles.contentLabel}>Why This Matters</Text>
              <Text style={styles.whyThisText}>{guidanceExperience.content.whyThis}</Text>
            </View>

            {/* Prophetic Practice */}
            {guidanceExperience.content.propheticPractice && (
              <View style={styles.contentBlock}>
                <Text style={styles.contentLabel}>Prophetic Practice</Text>
                <Text style={styles.propheticText}>
                  {guidanceExperience.content.propheticPractice.description}
                </Text>
                <Text style={styles.sourceText}>
                  {guidanceExperience.content.propheticPractice.source}
                </Text>
              </View>
            )}

            {/* The Angle */}
            <View style={styles.contentBlock}>
              <Text style={styles.contentLabel}>Today's Focus</Text>
              <Text style={styles.angleText}>{guidanceExperience.angle.angle}</Text>
            </View>

            {/* Action */}
            {guidanceExperience.angle.action && (
              <View style={styles.contentBlock}>
                <Text style={styles.contentLabel}>Today's Practice</Text>
                <Text style={styles.actionText}>{guidanceExperience.angle.action}</Text>
              </View>
            )}

            {/* Reflection */}
            {guidanceExperience.angle.reflection && (
              <View style={[styles.contentBlock, styles.contentBlockLastChild]}>
                <Text style={styles.contentLabel}>Reflection</Text>
                <Text style={styles.reflectionText}>{guidanceExperience.angle.reflection}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Motivation */}
        <View style={styles.motivationSection}>
          <Text style={styles.motivationText}>{pathsService.getStepMotivation(step)}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          {!isStepCompleted ? (
            <TouchableOpacity style={styles.completeButton} onPress={handleCompleteStep}>
              <Text style={styles.completeButtonText}>Mark Day Complete</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.completeButton, styles.nextButton]}
              onPress={handleNextStep}
            >
              <Text style={styles.completeButtonText}>
                {isLastStep ? 'View Path Summary' : 'Next Day →'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
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
    marginLeft: -12, // Align with padding
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

  // Step Header
  stepHeader: {
    marginBottom: 32,
    position: 'relative',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  stepFocus: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.70)',
    lineHeight: 24,
  },
  completedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Guidance Section
  guidanceSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  contentCard: {
    backgroundColor: '#1A1F23',
    borderRadius: 16,
    padding: 20,
  },
  contentBlock: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  contentBlockLastChild: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  contentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2ED3C6',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  primaryText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 26,
    marginBottom: 12,
  },
  arabicText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 32,
    marginBottom: 12,
    textAlign: 'right',
    fontFamily: 'Arabic', // Would need Arabic font
  },
  translationText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.80)',
    lineHeight: 24,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  sourceText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.60)',
  },
  whyThisText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.80)',
    lineHeight: 24,
  },
  propheticText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.80)',
    lineHeight: 24,
    marginBottom: 8,
  },
  angleText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    fontWeight: '500',
  },
  actionText: {
    fontSize: 16,
    color: '#2ED3C6',
    lineHeight: 24,
    fontWeight: '500',
  },
  reflectionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.80)',
    lineHeight: 24,
    fontStyle: 'italic',
  },

  // Motivation Section
  motivationSection: {
    backgroundColor: 'rgba(46,211,198,0.10)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(46,211,198,0.20)',
  },
  motivationText: {
    fontSize: 16,
    color: '#2ED3C6',
    lineHeight: 24,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Action Section
  actionSection: {
    marginBottom: 40,
  },
  completeButton: {
    backgroundColor: '#2ED3C6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B0F12',
  },
});
