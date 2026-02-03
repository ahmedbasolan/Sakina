import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Platform,
  TouchableOpacity,
  Animated,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Grid, Colors } from '../theme/DesignSystem';
import ScrollProgressIndicator from './ScrollProgressIndicator';
import CardDecoration from './CardDecoration';
import GuidanceCardFace from './GuidanceCardFace';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLLAPSED_HEIGHT = SCREEN_HEIGHT * 0.75;

export type CardType = 'verse' | 'wisdom' | 'action';

interface GuidanceCardProps {
  type: CardType;
  title: string;
  primaryText: string;
  arabicText?: string;
  transliteration?: string;
  source?: string;
  audioKey?: string;
  isLocked?: boolean;
  isSaved?: boolean;
  onShare: () => void;
  onReflect: () => void;
  onSave: () => void;
  index: number;
  total: number;
  showTransliteration?: boolean;
  secondaryText?: string;
  actionReward?: string;
  actionHowTo?: string;
  // Flip Card props
  isFlippable?: boolean;
  backTitle?: string;
  backPrimaryText?: string;
  backArabicText?: string;
  backTransliteration?: string;
  backSource?: string;
  primaryLanguage?: 'english' | 'arabic';
  repeatCount?: number;
  backRepeatCount?: number;
  difficulty?: 1 | 2 | 3;
  whyThisWorks?: string;
  backWhyThisWorks?: string;
  scrollY?: Animated.Value;
}

const GuidanceCard: React.FC<GuidanceCardProps> = ({
  type, title, primaryText, arabicText, transliteration, source, audioKey,
  isLocked = false, isSaved = false, onShare, onReflect, onSave, index,
  showTransliteration = true, secondaryText, actionReward, actionHowTo,
  isFlippable = false, backTitle, backPrimaryText, backArabicText,
  backTransliteration, backSource, primaryLanguage = 'english',
  repeatCount = 0, backRepeatCount = 0, difficulty, whyThisWorks,
  backWhyThisWorks, scrollY,
}) => {
  const saveScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentCount, setCurrentCount] = useState(0);

  const [frontHeight, setFrontHeight] = useState(0);
  const [backHeight, setBackHeight] = useState(0);

  const currentContentHeight = isFlipped ? backHeight : frontHeight;
  const hasOverflow = currentContentHeight > COLLAPSED_HEIGHT - Grid.space40;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    setCurrentCount(0);
  }, [index, isFlipped]);

  const handleTasbihTap = React.useCallback(() => {
    const target = isFlipped ? backRepeatCount : repeatCount;
    if (currentCount >= target && target > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextCount = currentCount + 1;
    setCurrentCount(nextCount);
    if (nextCount === target) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [currentCount, isFlipped, backRepeatCount, repeatCount]);

  const handleTasbihReset = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentCount(0);
  }, []);

  const handleSaveWithAnim = React.useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(saveScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.spring(saveScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onSave();
  }, [onSave, saveScale]);

  const handleFlip = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFlipped(!isFlipped);
  }, [isFlipped, flipAnim]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const getBackgroundColors = (cardType: CardType) => {
    switch (cardType) {
      case 'verse': return Colors.verseGradient;
      case 'wisdom': return Colors.wisdomGradient;
      case 'action': return Colors.actionGradient;
      default: return [Colors.surface, Colors.background] as const;
    }
  };

  return (
    <Animated.View style={[{ opacity: fadeAnim }, styles.cardWrapper]}>
      <View style={styles.shadowContainer}>
        <View style={[
          styles.container,
          !isExpanded && (hasOverflow ? { height: COLLAPSED_HEIGHT } : { maxHeight: COLLAPSED_HEIGHT })
        ]}>
          {scrollY && (
            <ScrollProgressIndicator
              scrollY={scrollY}
              cardY={index * 600}
              cardHeight={isExpanded ? (isFlipped ? backHeight : frontHeight) || 600 : COLLAPSED_HEIGHT}
              isExpanded={isExpanded}
            />
          )}
          <LinearGradient
            colors={getBackgroundColors(type)}
            style={[StyleSheet.absoluteFill, { borderRadius: Grid.borderRadius }]}
          />

          <CardDecoration type={type} />

          {/* FRONT FACE */}
          <Animated.View
            style={[
              styles.cardSide,
              { transform: [{ rotateY: frontInterpolate }] },
              !isExpanded && (hasOverflow ? { height: COLLAPSED_HEIGHT } : { maxHeight: COLLAPSED_HEIGHT })
            ]}
            pointerEvents={isFlipped ? 'none' : 'auto'}
          >
            <GuidanceCardFace
              type={type}
              title={title}
              primaryText={primaryText}
              arabicText={arabicText}
              transliteration={transliteration}
              source={source}
              audioKey={audioKey}
              isSaved={isSaved}
              isLocked={isLocked}
              index={index}
              showTransliteration={showTransliteration}
              primaryLanguage={primaryLanguage}
              difficulty={difficulty}
              whyThisWorks={whyThisWorks}
              actionHowTo={actionHowTo}
              actionReward={actionReward}
              isBack={false}
              isFlippable={isFlippable}
              onFlip={handleFlip}
              onSave={handleSaveWithAnim}
              onShare={onShare}
              onReflect={onReflect}
              onTasbihTap={handleTasbihTap}
              onTasbihReset={handleTasbihReset}
              currentTasbihCount={currentCount}
              tasbihTarget={repeatCount}
              saveScale={saveScale}
              onLayout={(e) => setFrontHeight(e.nativeEvent.layout.height)}
              isExpanded={isExpanded}
            />
          </Animated.View>

          {/* BACK FACE */}
          {isFlippable && (
            <Animated.View
              style={[
                styles.cardSide,
                styles.cardBack,
                { transform: [{ rotateY: backInterpolate }] },
                !isExpanded && (hasOverflow ? { height: COLLAPSED_HEIGHT } : { maxHeight: COLLAPSED_HEIGHT })
              ]}
              pointerEvents={isFlipped ? 'auto' : 'none'}
            >
              <GuidanceCardFace
                type="action"
                title={backTitle || 'PRACTICAL GUIDANCE'}
                primaryText={backPrimaryText || ''}
                arabicText={backArabicText}
                transliteration={backTransliteration}
                source={backSource}
                isSaved={isSaved}
                isLocked={isLocked}
                index={index}
                showTransliteration={showTransliteration}
                primaryLanguage={primaryLanguage}
                difficulty={difficulty}
                whyThisWorks={backWhyThisWorks}
                secondaryText={secondaryText}
                isBack={true}
                isFlippable={isFlippable}
                onFlip={handleFlip}
                onSave={handleSaveWithAnim}
                onShare={onShare}
                onReflect={onReflect}
                onTasbihTap={handleTasbihTap}
                onTasbihReset={handleTasbihReset}
                currentTasbihCount={currentCount}
                tasbihTarget={backRepeatCount || repeatCount}
                saveScale={saveScale}
                onLayout={(e) => setBackHeight(e.nativeEvent.layout.height)}
                isExpanded={isExpanded}
              />
            </Animated.View>
          )}

          {hasOverflow && !isExpanded && (
            <LinearGradient
              colors={['transparent', 'rgba(11, 15, 18, 0.5)', 'rgba(11, 15, 18, 0.95)', '#0B0F12']}
              style={styles.bottomFadeOverlay}
              pointerEvents="none"
            />
          )}
        </View>
      </View>

      {hasOverflow && (
        <TouchableOpacity
          style={styles.externalExpandButton}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsExpanded(!isExpanded);
          }}
        >
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={40}
            color={Colors.teal}
            style={styles.wideVIconExternal}
          />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: SCREEN_WIDTH,
  },
  shadowContainer: {
    backgroundColor: 'transparent',
    elevation: 12,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    borderRadius: Grid.borderRadius,
    marginHorizontal: Grid.contentPadding,
    marginVertical: Grid.space16,
  },
  container: {
    width: '100%',
    minHeight: 500,
    backgroundColor: Colors.surface,
    borderRadius: Grid.borderRadius,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(46, 211, 198, 0.15)',
  },
  bottomFadeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 5,
  },
  cardSide: {
    backfaceVisibility: 'hidden',
    width: '100%',
  },
  cardBack: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  externalExpandButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Grid.space12,
    width: '100%',
  },
  wideVIconExternal: {
    opacity: 0.9,
    transform: [{ scaleX: 2.5 }],
    marginTop: -Grid.space20,
  },
});

export default GuidanceCard;
