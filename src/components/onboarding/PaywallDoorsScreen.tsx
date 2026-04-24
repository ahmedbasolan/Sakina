/**
 * Screen 8: Paywall 2 — What's Inside
 *
 * 3 horizontal cards with lock icon + title + description.
 * Each card has an accent border tint. Tap to reveal the
 * content behind. Unlock + Maybe later buttons always visible.
 * Bottom chip. Matches reference design.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Colors } from '../../theme/DesignSystem';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useStaggerEntry } from '../../hooks/useStaggerEntry';

const { width, height } = Dimensions.get('window');
const CARD_W = width - 56;

// Lock icon
function LockIcon({ size = 22, color = 'rgba(245, 237, 227, 0.35)' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="11" width="18" height="11" rx="2" fill="none" stroke={color} strokeWidth={1.8} />
      <Path
        d="M7,11 L7,7 C7,4.2 9.2,2 12,2 C14.8,2 17,4.2 17,7 L17,11"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Unlocked icon
function UnlockedIcon({ size = 22, color = Colors.accent.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="3" y="11" width="18" height="11" rx="2" fill="none" stroke={color} strokeWidth={1.8} />
      <Path
        d="M7,11 L7,7 C7,4.2 9.2,2 12,2 C14.8,2 17,4.2 17,7"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

interface DoorData {
  id: number;
  title: string;
  lockedDesc: string;
  peek: string;
  accentColor: string;
}

const DOORS: DoorData[] = [
  {
    id: 0,
    title: 'Mood Verse Matching',
    lockedDesc: 'Limited to 3 moods',
    peek: 'Unlimited mood-based Quranic verses matched to how you feel.',
    accentColor: '#F472B6',
  },
  {
    id: 1,
    title: 'Sacred Journeys',
    lockedDesc: '1 journey available',
    peek: 'All 14-day guided paths that transform your Quran relationship.',
    accentColor: '#E5B162',
  },
  {
    id: 2,
    title: 'Verse Library',
    lockedDesc: 'Basic collection',
    peek: 'Full Quran with tafsir, audio recitation, and personal bookmarks.',
    accentColor: '#7ECEC0',
  },
];

interface Props {
  isActive: boolean;
  onContinue: () => void;
}

export default function PaywallDoorsScreen({ isActive, onContinue }: Props) {
  const [revealedDoors, setRevealedDoors] = useState<Set<number>>(new Set());
  const doorAnims = useRef(DOORS.map(() => ({
    revealed: new Animated.Value(0),
  }))).current;

  // [0] title, [1] subtitle, [2] card0, [3] card1, [4] card2, [5] CTA, [6] skip, [7] chip
  const s = useStaggerEntry(isActive, 8, { baseDelay: 200, stagger: 90 });

  useEffect(() => {
    if (!isActive) return;
    setRevealedDoors(new Set());
    doorAnims.forEach((d) => d.revealed.setValue(0));
  }, [isActive]);

  const handleDoorTap = (index: number) => {
    if (revealedDoors.has(index)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newSet = new Set(revealedDoors);
    newSet.add(index);
    setRevealedDoors(newSet);

    Animated.timing(doorAnims[index].revealed, {
      toValue: 1, duration: 400, useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentArea}>
        {/* Title */}
        <Animated.Text style={[styles.title, s[0]]}>
          What's Inside
        </Animated.Text>
        <Animated.Text style={[styles.subtitle, s[1]]}>
          Tap to peek behind the doors
        </Animated.Text>

        {/* Cards */}
        <View style={styles.cardList}>
          {DOORS.map((door, i) => {
            const isRevealed = revealedDoors.has(i);
            const lockedOpacity = doorAnims[i].revealed.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            });
            const revealedOpacity = doorAnims[i].revealed;

            return (
              <Animated.View key={door.id} style={[s[i + 2]]}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleDoorTap(i)}
                  disabled={isRevealed}
                  style={[
                    styles.card,
                    { borderColor: isRevealed ? door.accentColor + '40' : 'rgba(245, 237, 227, 0.10)' },
                  ]}
                >
                  {/* Accent left line */}
                  <View
                    style={[
                      styles.accentLine,
                      { backgroundColor: isRevealed ? door.accentColor : 'rgba(245, 237, 227, 0.06)' },
                    ]}
                  />

                  {/* Icon */}
                  <View style={[
                    styles.iconWrap,
                    { borderColor: isRevealed ? door.accentColor + '30' : 'rgba(245, 237, 227, 0.08)' },
                  ]}>
                    {isRevealed
                      ? <UnlockedIcon color={door.accentColor} />
                      : <LockIcon />
                    }
                  </View>

                  {/* Text */}
                  <View style={styles.textWrap}>
                    {/* Locked state */}
                    <Animated.View style={{ opacity: lockedOpacity, position: isRevealed ? 'absolute' : 'relative' }}>
                      <Text style={styles.cardTitle}>{door.title}</Text>
                      <Text style={styles.cardDesc}>{door.lockedDesc}</Text>
                    </Animated.View>

                    {/* Revealed state */}
                    {isRevealed && (
                      <Animated.View style={{ opacity: revealedOpacity }}>
                        <Text style={[styles.cardTitle, { color: door.accentColor }]}>{door.title}</Text>
                        <Text style={styles.cardDescReveal}>{door.peek}</Text>
                      </Animated.View>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Unlock button */}
        <Animated.View style={[styles.ctaWrap, s[5]]}>
          <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={onContinue}>
            <Text style={styles.ctaText}>Unlock Everything</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Maybe later */}
        <Animated.View style={[styles.skipWrap, s[6]]}>
          <TouchableOpacity activeOpacity={0.7} onPress={onContinue}>
            <Text style={styles.skipText}>Maybe later</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Chip */}
        <Animated.View style={[styles.chip, s[7]]}>
          <Text style={styles.chipText}>
            Unlock your full spiritual potential
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 24,
    color: '#F5EDE3',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(245, 237, 227, 0.45)',
    textAlign: 'center',
    marginBottom: 28,
  },
  cardList: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    width: CARD_W,
    alignSelf: 'center',
    backgroundColor: 'rgba(20, 28, 50, 0.50)',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    overflow: 'hidden',
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 237, 227, 0.03)',
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: 'serif',
    fontSize: 16,
    color: '#F5EDE3',
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  cardDesc: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.35)',
    letterSpacing: 0.2,
  },
  cardDescReveal: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.55)',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: height * 0.10,
    alignItems: 'center',
    gap: 10,
  },
  ctaWrap: {
    width: '100%',
  },
  ctaBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: 'serif',
    fontSize: 17,
    color: '#14100C',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  skipWrap: {
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 14,
    color: 'rgba(245, 237, 227, 0.35)',
    letterSpacing: 0.3,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 245, 220, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 245, 220, 0.08)',
    width: '100%',
  },
  chipText: {
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.55)',
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
  },
});