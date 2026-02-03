import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpiritualPath, UserPathProgress } from '../types';
import { PathsService } from '../services/pathsService';
import { FreemiumService } from '../services/freemiumService';
import { SPECIAL_EDITION_BUNDLES } from '../data/staticPaths';

interface PathDetailScreenProps {
  path: SpiritualPath;
  userProgress?: UserPathProgress;
  onStartPath: (pathId: string) => void;
  onContinuePath: (pathId: string) => void;
  onBack: () => void;
  onShowPaywall: () => void;
  onPurchaseBundle: (bundleId: string) => void;
}

export const PathDetailScreen: React.FC<PathDetailScreenProps> = ({
  path,
  userProgress,
  onStartPath,
  onContinuePath,
  onBack,
  onShowPaywall,
  onPurchaseBundle,
}) => {
  const pathsService = PathsService.getInstance();
  const freemiumService = FreemiumService.getInstance();
  const isPremium = freemiumService.isPremium();
  const isUnlocked = path.isSpecialEdition
    ? path.bundleId && freemiumService.hasUnlockedBundle(path.bundleId)
    : isPremium;

  const handleStartPress = () => {
    if (path.isSpecialEdition && !isUnlocked) {
      if (path.bundleId) {
        onPurchaseBundle(path.bundleId);
      }
      return;
    }

    if (!isPremium && path.isPremium) {
      onShowPaywall();
      return;
    }

    if (userProgress) {
      onContinuePath(path.id);
    } else {
      Alert.alert(
        path.isSpecialEdition ? 'Start Special Edition' : 'Start Spiritual Path',
        `Begin your ${path.title} journey?\n\nThis path takes ${path.duration} days to complete.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Start Path', onPress: () => onStartPath(path.id) },
        ],
      );
    }
  };

  const getCurrentStep = () => {
    if (!userProgress) return null;
    return pathsService.getCurrentStep(path.id, userProgress);
  };

  const getProgressPercentage = () => {
    if (!userProgress) return 0;
    return pathsService.getProgressPercentage(userProgress);
  };

  const completedSteps = userProgress ? pathsService.getCompletedSteps(path.id, userProgress) : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Path Overview */}
        <View style={styles.overviewSection}>
          <Text style={styles.pathTitle}>{path.title}</Text>
          <Text style={styles.pathDescription}>{path.description}</Text>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Duration</Text>
              <Text style={styles.metaValue}>{path.duration} days</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Starting Point</Text>
              <Text style={styles.metaValue}>{path.theme}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Destination</Text>
              <Text style={styles.metaValue}>{path.target}</Text>
            </View>
          </View>

          {path.isSpecialEdition && !isUnlocked && (
            <View style={[styles.premiumNotice, styles.specialNotice]}>
              <Text style={styles.specialNoticeText}>🌙 Special Edition Collection</Text>
            </View>
          )}

          {!path.isSpecialEdition && !isPremium && (
            <View style={styles.premiumNotice}>
              <Text style={styles.premiumNoticeText}>👑 Premium Path</Text>
            </View>
          )}

          {path.id === 'path_forced_marriage' && (
            <View style={styles.safetyDisclaimer}>
              <Text style={styles.safetyTitle}>⚠️ Safety First</Text>
              <Text style={styles.safetyText}>
                If you are in immediate danger or fear physical harm for refusing a marriage, please
                contact local authorities or crisis support immediately. This path provides
                spiritual guidance and communication scripts, but safety is paramount.
              </Text>
            </View>
          )}
        </View>

        {/* Progress Section */}
        {userProgress && (
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>Your Progress</Text>
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressText}>
                  Day {userProgress.currentDay} of {path.duration}
                </Text>
                <Text style={styles.progressPercentage}>
                  {Math.round(getProgressPercentage())}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
              </View>

              {getCurrentStep() && (
                <View style={styles.currentStepCard}>
                  <Text style={styles.currentStepLabel}>Current Step</Text>
                  <Text style={styles.currentStepTitle}>{getCurrentStep()!.title}</Text>
                  <Text style={styles.currentStepFocus}>{getCurrentStep()!.focus}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Curriculum Overview */}
        <View style={styles.curriculumSection}>
          <Text style={styles.sectionTitle}>Path Curriculum</Text>
          <Text style={styles.curriculumDescription}>
            A structured journey through {path.duration} days of guided spiritual growth.
          </Text>

          <View style={styles.stepsContainer}>
            {path.dailySteps.map((step, index) => {
              const isCompleted = completedSteps.some((cs) => cs.day === step.day);
              const isCurrent = userProgress?.currentDay === step.day;

              return (
                <View key={step.id} style={styles.stepItem}>
                  <View style={styles.stepNumberContainer}>
                    <View
                      style={[
                        styles.stepNumber,
                        isCompleted && styles.completedStep,
                        isCurrent && styles.currentStep,
                      ]}
                    >
                      <Text
                        style={[
                          styles.stepNumberText,
                          isCompleted && styles.completedStepText,
                          isCurrent && styles.currentStepText,
                        ]}
                      >
                        {isCompleted ? '✓' : step.day}
                      </Text>
                    </View>
                    {index < path.dailySteps.length - 1 && (
                      <View
                        style={[styles.stepConnector, isCompleted && styles.completedConnector]}
                      />
                    )}
                  </View>

                  <View style={styles.stepContent}>
                    <Text
                      style={[
                        styles.stepTitle,
                        isCompleted && styles.completedStepTitle,
                        isCurrent && styles.currentStepTitle,
                      ]}
                    >
                      Day {step.day}: {step.title}
                    </Text>
                    <Text style={[styles.stepFocus, isCompleted && styles.completedStepFocus]}>
                      {step.focus}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              path.isSpecialEdition && !isUnlocked && styles.specialButton,
              !path.isSpecialEdition && !isPremium && styles.premiumButton,
              userProgress && styles.continueButton,
            ]}
            onPress={handleStartPress}
          >
            <Text
              style={[
                styles.actionButtonText,
                path.isSpecialEdition && !isUnlocked && styles.specialButtonText,
                !path.isSpecialEdition && !isPremium && styles.premiumButtonText,
                userProgress && styles.continueButtonText,
              ]}
            >
              {path.isSpecialEdition && !isUnlocked
                ? (() => {
                    const bundle = SPECIAL_EDITION_BUNDLES.find((b) => b.id === path.bundleId);
                    const basePrice = bundle?.priceAED || 47.99;
                    const finalPrice = isPremium
                      ? (basePrice / 2).toFixed(2)
                      : basePrice.toFixed(2);
                    return `Unlock Collection • AED ${finalPrice}`;
                  })()
                : !isPremium && path.isPremium
                  ? '👑 Upgrade to Premium'
                  : userProgress
                    ? 'Continue Path'
                    : 'Start Path'}
            </Text>
          </TouchableOpacity>
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
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12, // Align with content since it has padding
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Overview Section
  overviewSection: {
    marginBottom: 32,
  },
  pathTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  pathDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.70)',
    lineHeight: 24,
    marginBottom: 24,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  metaLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.60)',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  premiumNotice: {
    backgroundColor: 'rgba(255,215,0,0.20)',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  premiumNoticeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  specialNotice: {
    backgroundColor: 'rgba(212, 175, 55, 0.20)',
    borderColor: '#D4AF37',
  },
  specialNoticeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D4AF37',
  },
  safetyDisclaimer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderWidth: 1,
    borderColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },

  // Progress Section
  progressSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  progressCard: {
    backgroundColor: '#1A1F23',
    borderRadius: 16,
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2ED3C6',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2ED3C6',
    borderRadius: 4,
  },
  currentStepCard: {
    backgroundColor: 'rgba(46,211,198,0.10)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(46,211,198,0.30)',
  },
  currentStepLabel: {
    fontSize: 12,
    color: '#2ED3C6',
    fontWeight: '600',
    marginBottom: 4,
  },
  currentStepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2ED3C6',
    marginBottom: 4,
  },
  currentStepFocus: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.70)',
    lineHeight: 20,
  },

  // Curriculum Section
  curriculumSection: {
    marginBottom: 32,
  },
  curriculumDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.70)',
    lineHeight: 20,
    marginBottom: 20,
  },
  stepsContainer: {
    backgroundColor: '#1A1F23',
    borderRadius: 16,
    padding: 20,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumberContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedStep: {
    backgroundColor: '#4CAF50',
  },
  currentStep: {
    backgroundColor: '#2ED3C6',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completedStepText: {
    color: '#FFFFFF',
  },
  currentStepText: {
    color: '#0B0F12',
  },
  stepConnector: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginTop: 4,
  },
  completedConnector: {
    backgroundColor: '#4CAF50',
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  completedStepTitle: {
    color: 'rgba(255,255,255,0.80)',
  },
  stepFocus: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.60)',
    lineHeight: 16,
  },
  completedStepFocus: {
    color: 'rgba(255,255,255,0.40)',
  },

  // Action Section
  actionSection: {
    marginBottom: 40,
  },
  actionButton: {
    backgroundColor: '#2ED3C6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  premiumButton: {
    backgroundColor: '#FFD700',
  },
  specialButton: {
    backgroundColor: '#D4AF37',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0B0F12',
  },
  premiumButtonText: {
    color: '#0B0F12',
  },
  specialButtonText: {
    color: '#0B0F12',
  },
  continueButtonText: {
    color: '#FFFFFF',
  },
});
