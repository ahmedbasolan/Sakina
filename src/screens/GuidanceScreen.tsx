import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GuidanceExperience, Mood } from '../types';
import GuidanceHeader from '../components/GuidanceHeader';
import GuidanceCard from '../components/GuidanceCard';
import ShareSheet from '../components/ShareSheet';
import { useGuidanceLogic } from '../hooks/useGuidanceLogic';
import { Grid, Colors, Typography } from '../theme/DesignSystem';
import DisplayPreferencesModal from '../components/DisplayPreferencesModal';

interface GuidanceScreenProps {
  experience: GuidanceExperience;
  mood: Mood;
  islamicTerm: string;
  onSaveReflection: (reflection: string) => void;
  onBack: () => void;
  onNext: () => void;
  onShowPaywall: (type: 'refresh_limit' | 'daily_limit' | 'saved_limit') => void;
}

const GuidanceScreen: React.FC<GuidanceScreenProps> = ({
  experience,
  mood,
  islamicTerm,
  onSaveReflection,
  onBack,
  onNext,
  onShowPaywall,
}) => {
  const {
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
    scrollViewRef,
    handleSave,
    handleShare,
    handlePrimaryAction,
    onScroll,
    preferences,
    updatePreference,
    isPremium,
    scrollY,
  } = useGuidanceLogic(experience, onNext, onSaveReflection, onShowPaywall, 2);

  const [isPrefsModalVisible, setIsPrefsModalVisible] = useState(false);

  if (!experience) {
    return (
      <View style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <ActivityIndicator size="large" color={Colors.teal} />
        <Text style={styles.loadingText}>Fetching divine guidance...</Text>
      </View>
    );
  }

  // Define the cards for the story experience
  const cards = [
    {
      type: 'verse' as const,
      title: experience.content.type === 'Quran' ? 'THE REVELATION' : 'AUTHENTIC WISDOM',
      primaryText: experience.content.englishTranslation || experience.content.primaryText,
      arabicText: experience.content.arabicText,
      transliteration: experience.content.transliteration,
      source: experience.content.source,
      audioKey: experience.content.audioKey || extractVerseKey(experience.content.source),
      repeatCount: experience.content.repeatCount,
      difficulty: experience.content.difficulty,
      whyThisWorks: experience.content.whyThisWorks,
    },
    {
      type: 'action' as const,
      isFlippable: true,
      title: 'CONTEXTUAL SUMMARY',
      primaryText: experience.angle.angle || 'Reflect on this guidance.',
      actionHowTo: experience.angle.actionHowTo,
      actionReward: experience.angle.actionReward,
      // Back side
      backTitle: 'PRACTICAL GUIDANCE',
      backPrimaryText: experience.angle.action || experience.content.optionalAction,
      backArabicText: experience.angle.actionArabicText,
      backTransliteration: experience.angle.actionTransliteration,
      backSource: experience.angle.actionSource || 'Practical Path',
      audioKey: experience.angle.actionAudioKey,
      secondaryText: experience.angle.actionTranslation,
      backRepeatCount: experience.angle.actionRepeatCount,
      repeatCount: experience.content.repeatCount,
      difficulty: experience.angle.actionDifficulty || experience.content.difficulty,
      whyThisWorks: experience.content.whyThisWorks,
      backWhyThisWorks: experience.angle.actionWhyThisWorks,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <GuidanceHeader
        mood={mood}
        islamicTerm={islamicTerm}
        onBack={() => {
          if (reflectionText.trim()) onSaveReflection(reflectionText);
          onBack();
        }}
        onOptionsPress={() => setIsPrefsModalVisible(true)}
        activeIndex={activeIndex}
        totalCards={cards.length}
      />

      <Animated.ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {cards.map((card, index) => (
          <GuidanceCard
            key={index}
            index={index}
            total={cards.length}
            type={card.type}
            title={card.title}
            primaryText={card.primaryText}
            arabicText={card.arabicText}
            transliteration={card.transliteration}
            source={card.source}
            audioKey={card.audioKey}
            actionHowTo={card.actionHowTo}
            actionReward={card.actionReward}
            isLocked={!isPremium}
            isSaved={!!savedStates[index]}
            showTransliteration={preferences.showTransliteration}
            primaryLanguage={preferences.primaryLanguage}
            onShare={() =>
              handleShare(
                card.primaryText,
                card.source || '',
                card.arabicText,
                card.transliteration,
              )
            }
            onReflect={() => setShowReflectionInput(true)}
            onSave={() => handleSave(index)}
            isFlippable={card.isFlippable}
            backTitle={card.backTitle}
            backPrimaryText={card.backPrimaryText}
            backArabicText={card.backArabicText}
            backTransliteration={card.backTransliteration}
            backSource={card.backSource}
            secondaryText={card.secondaryText}
            repeatCount={card.repeatCount}
            backRepeatCount={card.backRepeatCount}
            difficulty={card.difficulty}
            whyThisWorks={card.whyThisWorks}
            backWhyThisWorks={card.backWhyThisWorks}
            scrollY={scrollY}
          />
        ))}

        <View style={styles.listFooter}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handlePrimaryAction}
            accessibilityRole="button"
            accessibilityLabel="Next Guidance"
          >
            <View style={styles.nextButtonInner}>
              <Text style={styles.nextButtonLabel}>NEXT GUIDANCE</Text>
              {!isPremium && (
                <View style={styles.refreshBadge}>
                  <Text style={styles.refreshText}>{remainingRefreshes}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>

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

      {/* REFLECTION OVERLAY */}
      {showReflectionInput && (
        <TouchableOpacity
          style={styles.reflectionOverlay}
          activeOpacity={1}
          onPress={() => setShowReflectionInput(false)}
          accessibilityRole="none"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.reflectionKeyboardContainer}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <View style={styles.reflectionSheet}>
              <View style={styles.reflectionHeader}>
                <Text style={styles.reflectionTitle}>PERSONAL REFLECTION</Text>
                <TouchableOpacity
                  onPress={() => setShowReflectionInput(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Close reflection"
                >
                  <Ionicons name="close" size={24} color={Colors.white} />
                </TouchableOpacity>
              </View>

              {/* Dynamic Reflection Prompt */}
              <View style={styles.reflectionPromptContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.teal} />
                <Text style={styles.reflectionPromptText}>
                  {experience.angle.reflection ||
                    experience.content.optionalReflection ||
                    'What does this mean for you?'}
                </Text>
              </View>
              <TextInput
                style={styles.reflectionInput}
                placeholder="Write your thoughts here..."
                placeholderTextColor={Colors.whiteMuted}
                multiline
                autoFocus
                value={reflectionText}
                onChangeText={setReflectionText}
                onBlur={() => onSaveReflection(reflectionText)}
              />
              <TouchableOpacity
                style={styles.saveReflectionButton}
                onPress={() => setShowReflectionInput(false)}
                accessibilityRole="button"
                accessibilityLabel="Save reflection"
              >
                <Text style={styles.saveReflectionText}>DONE</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      )}

      <DisplayPreferencesModal
        isVisible={isPrefsModalVisible}
        onClose={() => setIsPrefsModalVisible(false)}
        preferences={preferences}
        onUpdatePreference={updatePreference}
      />
    </View>
  );
};

// Helper function to extract verse key from source string
function extractVerseKey(source: string): string {
  const match = source.match(/(\d+):(\d+)/);
  if (match) {
    return `${match[1]}:${match[2]}`;
  }
  return '1:1'; // Fallback
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Grid.space16,
    color: Colors.whiteDim,
    fontSize: Typography.sizeBody,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 150,
    paddingBottom: 60,
  },
  reflectionInput: {
    color: Colors.white,
    fontSize: 15,
    lineHeight: 22,
    marginTop: Grid.space12,
    minHeight: 120,
    textAlignVertical: 'top',
    padding: 0,
  },
  listFooter: {
    marginTop: Grid.space24,
    paddingHorizontal: Grid.contentPadding,
    paddingBottom: Grid.space40,
  },
  nextButton: {
    backgroundColor: Colors.teal,
    borderRadius: Grid.borderRadiusInner,
    height: 60,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Grid.space12,
  },
  nextButtonLabel: {
    color: Colors.background,
    fontSize: Typography.sizeSmall + 2,
    fontWeight: '800',
    letterSpacing: 2,
  },
  refreshBadge: {
    backgroundColor: 'rgba(11, 15, 18, 0.15)',
    paddingHorizontal: Grid.space8,
    paddingVertical: Grid.space4,
    borderRadius: Grid.space8,
  },
  refreshText: {
    color: Colors.background,
    fontSize: Typography.sizeSmall,
    fontWeight: '800',
  },
  reflectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    zIndex: 2000,
    justifyContent: 'flex-end',
  },
  reflectionKeyboardContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-end',
  },
  reflectionSheet: {
    backgroundColor: Colors.surfaceSheet,
    borderTopLeftRadius: Grid.space32,
    borderTopRightRadius: Grid.space32,
    padding: Grid.space32,
    paddingBottom: Platform.OS === 'ios' ? 50 : Grid.space32,
  },
  reflectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Grid.space24,
  },
  reflectionTitle: {
    fontSize: Typography.sizeSmall,
    fontWeight: '700',
    color: Colors.teal,
    letterSpacing: 2,
  },
  saveReflectionButton: {
    backgroundColor: Colors.teal,
    borderRadius: Grid.borderRadiusInner,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Grid.space24,
  },
  saveReflectionText: {
    fontWeight: '800',
    letterSpacing: 1,
  },
  reflectionPromptContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(46, 211, 198, 0.05)',
    padding: Grid.space16,
    borderRadius: Grid.borderRadiusInner,
    marginBottom: Grid.space20,
    gap: Grid.space12,
  },
  reflectionPromptText: {
    flex: 1,
    color: Colors.whiteDim,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default GuidanceScreen;
