/**
 * MoodCheckInModal
 *
 * Immersive, emotionally tuned twice-daily check-in sanctuary (Post-Fajr & Post-Isha).
 * Designed with Islamic psychology and calming celestial aesthetics:
 * - Ambient celestial wash with animated starry backdrop & sacred mandala
 * - Empathetic contextual time-of-day greeting
 * - Harmonious 2-column bento mood layout with a dedicated full-width Tawbah card
 * - Tactile spring feedback and glowing mood accents
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  MoodColors,
  Animations,
  Elevation,
} from '../../theme/DesignSystem';
import { Mood } from '../../types';
import { CheckInWindow } from '../../services/moodCheckinPromptService';
import { HapticsService } from '../../services/hapticsService';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { JourneyMandalaBackdrop } from '../JourneyMandalaBackdrop';
import { MOOD_VISUALS, MOOD_VISUAL_MAP } from '../../constants/moodData';

interface MoodCheckInModalProps {
  visible: boolean;
  window: CheckInWindow;
  onSelectMood: (mood: Mood) => Promise<void>;
  onDismiss: () => void;
}

interface MoodItem {
  id: Mood;
  label: string;
  sublabel: string;
  arabic: string;
  icon: keyof typeof Ionicons.glyphMap;
}

// Both tables come from constants/moodData.ts. This file used to hold its own
// nine-row copy; see that file’s header for the four ways the copies had
// drifted apart by the time they were consolidated.
//
// The modal shows `theme` — the emotional one-liner — where the Home grid
// shows the transliteration. Those are different fields on purpose.
const GRID_MOODS: MoodItem[] = MOOD_VISUALS.filter((m) => m.key !== 'Guilty').map((m) => ({
  id: m.key,
  label: m.label,
  sublabel: m.theme,
  arabic: m.arabic,
  icon: m.ionicon as keyof typeof Ionicons.glyphMap,
}));

// Tawbah gets a full-width card of its own rather than one tile among eight —
// deliberate, and the reason moodData carries wideLabel/wideArabic. The
// fallbacks are not decoration: they keep this rendering something sane if a
// future edit drops the wide copy.
const GUILTY = MOOD_VISUAL_MAP.get('Guilty')!;
const TAWBAH_MOOD: MoodItem = {
  id: 'Guilty',
  label: GUILTY.wideLabel ?? GUILTY.label,
  sublabel: GUILTY.theme,
  arabic: GUILTY.wideArabic ?? GUILTY.arabic,
  icon: GUILTY.ionicon as keyof typeof Ionicons.glyphMap,
};

export const MoodCheckInModal: React.FC<MoodCheckInModalProps> = ({
  visible,
  window,
  onSelectMood,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [loading, setLoading] = useState(false);

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  // Staggered card animations
  const cardAnims = useRef(
    Array.from({ length: 9 }, () => new Animated.Value(0)),
  ).current;

  const cardWidth = (screenWidth - Spacing.xl * 2 - Spacing.md) / 2;

  useEffect(() => {
    if (visible) {
      setSelectedMood(null);
      setLoading(false);
      if (reduceMotion) {
        fadeAnim.setValue(1);
        slideAnim.setValue(0);
        scaleAnim.setValue(1);
        cardAnims.forEach((anim) => anim.setValue(1));
      } else {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 7,
            tension: 45,
            useNativeDriver: true,
          }),
        ]).start();

        // Staggered appearance for emotional elegance
        const staggerList = cardAnims.map((anim, index) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 350,
            delay: 100 + index * 45,
            useNativeDriver: true,
          }),
        );
        Animated.parallel(staggerList).start();
      }
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      scaleAnim.setValue(0.96);
      cardAnims.forEach((anim) => anim.setValue(0));
    }
  }, [visible, reduceMotion]);

  const handlePress = async (mood: Mood) => {
    if (loading) return;
    setSelectedMood(mood);
    setLoading(true);
    HapticsService.impactAsync('LIGHT');
    try {
      await onSelectMood(mood);
    } finally {
      setLoading(false);
    }
  };

  const isMorning = window === 'morning';
  const subtitle = isMorning
    ? 'DAYTIME REFLECTION · MORNING LIGHT'
    : 'ISHA SOLACE · NIGHT PEACE';
  const title = isMorning
    ? 'How is your heart today?'
    : 'How does your soul feel tonight?';
  const quote = isMorning
    ? 'Pause for a quiet moment. Name your emotion and receive verified divine solace for whatever lies ahead.'
    : 'Release the burdens of the day. Return your heart to tranquility in Allah’s boundless mercy.';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <LinearGradient
          colors={['#040914', '#081220', '#0E1D30']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={styles.gradient}
        >
          {/* Subtle celestial sacred mandala aura in the background */}
          <JourneyMandalaBackdrop color={Colors.accent.glow} opacity={0.08} size={420} />

          {/* Glowing orbital wash */}
          <View pointerEvents="none" style={styles.ambientGlow} />

          {/* Close button with subtle glass touch */}
          <TouchableOpacity
            style={[styles.closeButton, { top: insets.top + Spacing.sm }]}
            onPress={onDismiss}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss check-in"
          >
            <Ionicons name="close" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={[
              styles.scrollContainer,
              {
                paddingTop: insets.top + Spacing.xl + 4,
                paddingBottom: insets.bottom + Spacing.xl,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.content,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                },
              ]}
            >
              {/* Header Badge */}
              <View style={styles.headerBadge}>
                <Ionicons
                  name={isMorning ? 'sunny-outline' : 'moon-outline'}
                  size={14}
                  color={Colors.accent.primary}
                />
                <Text style={styles.headerBadgeText}>{subtitle}</Text>
              </View>

              {/* Title & Empathy Prompt */}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.quote}>{quote}</Text>

              {/* 2-Column Bento Grid */}
              <View style={styles.grid}>
                {GRID_MOODS.map((item, index) => {
                  const moodColor = MoodColors[item.id];
                  const isSelected = selectedMood === item.id;
                  const isCurrentLoading = loading && isSelected;
                  const itemAnim = cardAnims[index] || new Animated.Value(1);

                  const translateY = itemAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  });

                  return (
                    <Animated.View
                      key={item.id}
                      style={{
                        width: cardWidth,
                        opacity: itemAnim,
                        transform: [{ translateY }],
                      }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.moodCard,
                          {
                            borderColor: isSelected
                              ? moodColor.accent
                              : `${moodColor.accent}33`,
                          },
                        ]}
                        onPress={() => handlePress(item.id)}
                        activeOpacity={0.82}
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel={`${item.label}, ${item.arabic}`}
                      >
                        {/* Smooth Glass & Color Wash */}
                        <LinearGradient
                          colors={[
                            isSelected ? `${moodColor.accent}35` : `${moodColor.bgFill}F0`,
                            isSelected ? `${moodColor.accent}15` : '#0B1626D0',
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                        />

                        {/* Top Row: Icon + Arabic */}
                        <View style={styles.cardTopRow}>
                          <View
                            style={[
                              styles.iconWrap,
                              {
                                backgroundColor: isSelected
                                  ? moodColor.accent
                                  : `${moodColor.accent}20`,
                                borderColor: isSelected
                                  ? moodColor.accent
                                  : `${moodColor.accent}40`,
                              },
                            ]}
                          >
                            {isCurrentLoading ? (
                              <ActivityIndicator
                                size="small"
                                color={isSelected ? Colors.background.primary : moodColor.accent}
                              />
                            ) : (
                              <Ionicons
                                name={item.icon}
                                size={18}
                                color={isSelected ? Colors.background.primary : moodColor.accent}
                              />
                            )}
                          </View>
                          <Text style={[styles.arabicText, { color: moodColor.accent }]}>
                            {item.arabic}
                          </Text>
                        </View>

                        {/* Bottom Row: English Label & Sublabel */}
                        <View style={styles.cardBottom}>
                          <Text
                            style={[
                              styles.moodTitle,
                              isSelected && { color: moodColor.accent, fontWeight: '700' },
                            ]}
                          >
                            {item.label}
                          </Text>
                          <Text style={styles.moodSublabel}>{item.sublabel}</Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}

                {/* Wide Featured Tawbah / Forgiveness Card */}
                {(() => {
                  const item = TAWBAH_MOOD;
                  const moodColor = MoodColors[item.id];
                  const isSelected = selectedMood === item.id;
                  const isCurrentLoading = loading && isSelected;
                  const itemAnim = cardAnims[8] || new Animated.Value(1);

                  const translateY = itemAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  });

                  return (
                    <Animated.View
                      style={[
                        styles.wideCardWrapper,
                        {
                          opacity: itemAnim,
                          transform: [{ translateY }],
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.wideMoodCard,
                          {
                            borderColor: isSelected
                              ? moodColor.accent
                              : `${moodColor.accent}38`,
                          },
                        ]}
                        onPress={() => handlePress(item.id)}
                        activeOpacity={0.82}
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel={`${item.label}, ${item.arabic}`}
                      >
                        <LinearGradient
                          colors={[
                            isSelected ? `${moodColor.accent}35` : `${moodColor.bgFill}F0`,
                            isSelected ? `${moodColor.accent}15` : '#0B1626D0',
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                        />

                        <View style={styles.wideCardLeft}>
                          <View
                            style={[
                              styles.iconWrap,
                              {
                                backgroundColor: isSelected
                                  ? moodColor.accent
                                  : `${moodColor.accent}20`,
                                borderColor: isSelected
                                  ? moodColor.accent
                                  : `${moodColor.accent}40`,
                              },
                            ]}
                          >
                            {isCurrentLoading ? (
                              <ActivityIndicator
                                size="small"
                                color={isSelected ? Colors.background.primary : moodColor.accent}
                              />
                            ) : (
                              <Ionicons
                                name={item.icon}
                                size={20}
                                color={isSelected ? Colors.background.primary : moodColor.accent}
                              />
                            )}
                          </View>
                          <View style={styles.wideTextWrap}>
                            <Text
                              style={[
                                styles.moodTitle,
                                isSelected && { color: moodColor.accent, fontWeight: '700' },
                              ]}
                            >
                              Guilty · Seeking Forgiveness
                            </Text>
                            <Text style={styles.moodSublabel}>{item.sublabel}</Text>
                          </View>
                        </View>

                        <View style={styles.wideCardRight}>
                          <Text style={[styles.wideArabicText, { color: moodColor.accent }]}>
                            {item.arabic}
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={`${moodColor.accent}AA`}
                            style={{ marginTop: 2 }}
                          />
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })()}
              </View>

              {/* Gentle Dismissal Affordance */}
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={onDismiss}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="I will reflect later"
              >
                <Text style={styles.dismissText}>I’ll reflect later</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#040914',
  },
  gradient: {
    flex: 1,
  },
  ambientGlow: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 20,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212, 175, 55, 0.10)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    marginBottom: Spacing.sm + 4,
  },
  headerBadgeText: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.label,
    fontWeight: '700',
    letterSpacing: Typography.letterSpacing.wide,
    color: Colors.accent.primary,
  },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h1,
    color: '#F4EAD4',
    textAlign: 'center',
    letterSpacing: Typography.letterSpacing.normal,
    marginBottom: 6,
  },
  quote: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.small,
    lineHeight: Typography.sizes.small * 1.5,
    color: 'rgba(186, 207, 230, 0.75)',
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: Spacing.xl,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm + 2,
    marginBottom: Spacing.xl,
  },
  moodCard: {
    width: '100%',
    height: 94,
    borderRadius: BorderRadius.lg + 2,
    borderWidth: 1,
    padding: Spacing.md - 2,
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...Elevation.low,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arabicText: {
    fontFamily: Typography.fonts.arabic,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.95,
  },
  cardBottom: {
    gap: 1,
  },
  moodTitle: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.small,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  moodSublabel: {
    fontFamily: Typography.fonts.latin,
    fontSize: 11,
    color: 'rgba(186, 207, 230, 0.65)',
  },
  wideCardWrapper: {
    width: '100%',
    marginTop: 2,
  },
  wideMoodCard: {
    width: '100%',
    height: 76,
    borderRadius: BorderRadius.lg + 2,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    ...Elevation.low,
  },
  wideCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  wideTextWrap: {
    gap: 1,
    flex: 1,
  },
  wideCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  wideArabicText: {
    fontFamily: Typography.fonts.arabic,
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    paddingVertical: Spacing.sm + 3,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  dismissText: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.small,
    color: 'rgba(186, 207, 230, 0.65)',
    letterSpacing: 0.3,
  },
});

export default MoodCheckInModal;
