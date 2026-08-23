import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import { Mood } from '../types';
import { formatDateYMD } from '../utils/date';
import { STORAGE_KEYS } from '../constants';

/**
 * Moods where the app's own content already reaches for crisis-adjacent
 * framing — `path_hope_after_crisis` exists specifically for this register,
 * and two of its own day instructions point to findahelpline.com. But that
 * journey is only reachable if a user already knows to look for it; someone
 * who taps Sad or Overwhelmed on the home screen and goes straight to
 * Guidance instead gets ordinary verse content with no safety net at all.
 * This closes that gap at the one point every mood-tap path funnels through.
 *
 * Deliberately narrow — not Guilty, Lonely, Angry, or Tired. Those are real
 * states, but lower-signal for crisis specifically, and surfacing a
 * self-harm resource under an everyday "I feel guilty I missed a prayer" tap
 * would read as presumptuous rather than supportive. CLAUDE.md's "For Your
 * Heart" voice rule — never assert something that might be false for THIS
 * reader — applies here even more than to that section's own copy, because
 * getting it wrong here costs more than a flat sentence.
 */
const CRISIS_ELIGIBLE_MOODS: ReadonlySet<Mood> = new Set(['Sad', 'Overwhelmed']);

const HELPLINE_URL = 'https://findahelpline.com';

interface CrisisResourceLineProps {
  mood: Mood;
}

/**
 * A quiet, dismissible line pointing to a real, free, confidential resource.
 * Not a modal, does not block the verse. It surfaces at most once per local
 * calendar day for a qualifying mood tap (a safety net shouldn't nag on every
 * visit, but it also shouldn't be suppressed forever the way a marketing
 * prompt would be). The "last shown" date is persisted in AsyncStorage, so a
 * fresh app launch the same day does not re-show it; the next day it returns.
 */
export function CrisisResourceLine({ mood }: CrisisResourceLineProps) {
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const eligible = CRISIS_ELIGIBLE_MOODS.has(mood);

  useEffect(() => {
    if (!eligible) return;
    let mounted = true;
    (async () => {
      const today = formatDateYMD();
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.crisisLineLastShown);
      if (!mounted) return;
      if (stored === today) {
        setDismissed(true);
      } else {
        await AsyncStorage.setItem(STORAGE_KEYS.crisisLineLastShown, today);
      }
      setLoaded(true);
    })();
    return () => {
      mounted = false;
    };
  }, [eligible]);

  const handleDismiss = () => {
    setDismissed(true);
    AsyncStorage.setItem(STORAGE_KEYS.crisisLineLastShown, formatDateYMD()).catch(() => {});
  };

  if (dismissed || !eligible || !loaded) return null;

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={styles.tapArea}
        activeOpacity={0.7}
        onPress={() => Linking.openURL(HELPLINE_URL).catch(() => {})}
        accessibilityRole="link"
        accessibilityLabel="If today feels heavier than a verse can carry, findahelpline dot com has free, confidential support, any time."
      >
        <Ionicons name="information-circle-outline" size={15} color={`${Colors.text.primary}99`} />
        <Text style={styles.text} numberOfLines={2}>
          If today feels heavier than this can carry —{' '}
          <Text style={styles.link}>findahelpline.com</Text> is free and confidential.
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleDismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <Ionicons name="close" size={15} color={`${Colors.text.primary}66`} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tapArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  text: {
    flex: 1,
    fontSize: Typography.sizes.detail,
    fontFamily: Typography.fonts.latin,
    color: `${Colors.text.primary}B3`,
    lineHeight: 16,
  },
  link: {
    color: Colors.accent.primary,
    fontWeight: '600',
  },
});
