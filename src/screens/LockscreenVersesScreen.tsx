/**
 * Lock Screen Verses — setup.
 *
 * Premium-gated. Lets the user turn on verse delivery at the three spiritual
 * windows, choose which windows, pick a background photo, and toggle
 * transliteration. See docs/superpowers/specs/2026-08-15-lockscreen-verses-design.md.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  Animated,
  ActivityIndicator,
  ImageStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius, Animations } from '../theme/DesignSystem';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { HapticsService } from '../services/hapticsService';
import { SubscriptionService } from '../services/subscriptionService';
import { BACKGROUND_THEMES } from '../services/backgroundThemeService';
import { SPIRITUAL_WINDOWS, SpiritualWindow } from '../services/dailyVerseService';
import {
  LockscreenVersePrefs,
  DEFAULT_LOCKSCREEN_PREFS,
  loadLockscreenPrefs,
  saveLockscreenPrefs,
} from '../services/lockscreenVerseService';
import { topUpScheduledNotifications } from '../services/notificationTopUpTask';
import { logServiceError } from '../services/errorLoggingService';

const WINDOW_COPY: Record<SpiritualWindow, { title: string; subtitle: string }> = {
  tahajjud: { title: 'Tahajjud', subtitle: 'The silent hour, about an hour before Fajr.' },
  morning: { title: 'Morning Adhkar', subtitle: 'Shortly after Fajr, as the day opens.' },
  evening: { title: 'Evening Adhkar', subtitle: 'Before Maghrib, as the day closes.' },
};

const THEME_COLUMNS = 3;

interface Props {
  onBack?: () => void;
}

export default function LockscreenVersesScreen({ onBack }: Props) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  const [isPremium, setIsPremium] = useState(false);
  const [prefs, setPrefs] = useState<LockscreenVersePrefs>(DEFAULT_LOCKSCREEN_PREFS);
  const [loading, setLoading] = useState(true);

  const fade = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);

  const handleBack = onBack || (() => navigation.goBack());

  useEffect(() => {
    isMounted.current = true;
    (async () => {
      const [premium, stored] = await Promise.all([
        Promise.resolve(SubscriptionService.getInstance().isPremium()),
        loadLockscreenPrefs(),
      ]);
      if (!isMounted.current) return;
      setIsPremium(premium);
      setPrefs(stored);
      setLoading(false);
    })();
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (reduceMotion) {
      fade.setValue(1);
      return;
    }
    Animated.timing(fade, {
      toValue: 1,
      duration: Animations.timing.normal,
      useNativeDriver: true,
    }).start();
  }, [loading, reduceMotion, fade]);

  /**
   * Persist and re-schedule. Notifications carry the verse in their payload, so
   * any preference change has to re-run the scheduler — editing prefs alone
   * would leave the already-queued notifications showing the old choice.
   */
  const apply = useCallback(async (patch: Partial<LockscreenVersePrefs>) => {
    HapticsService.selectionAsync();
    const next = await saveLockscreenPrefs(patch);
    if (isMounted.current) setPrefs(next);
    topUpScheduledNotifications().catch((error) =>
      logServiceError(
        'LockscreenVersesScreen',
        'apply',
        error instanceof Error ? error : new Error(String(error)),
      ),
    );
  }, []);

  const toggleWindow = useCallback(
    (window: SpiritualWindow) => {
      apply({ windows: { ...prefs.windows, [window]: !prefs.windows[window] } });
    },
    [apply, prefs.windows],
  );

  const renderToggle = (
    label: string,
    subtitle: string,
    value: boolean,
    onPress: () => void,
  ) => (
    <View style={styles.panel} key={label}>
      <View style={styles.panelText}>
        <Text style={styles.panelTitle}>{label}</Text>
        <Text style={styles.panelSubtitle}>{subtitle}</Text>
      </View>
      <TouchableOpacity
        style={[styles.switch, value && styles.switchActive]}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value }}
      >
        <View style={[styles.knob, value && styles.knobActive]} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={Colors.celestialWash}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.lg) }]}>
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={22} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Colors.accent.primary} />
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fade }}>
          <ScrollView
            contentContainerStyle={[
              styles.content,
              { paddingBottom: insets.bottom + Spacing.xxxl },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.eyebrow}>LOCK SCREEN VERSES</Text>
            <Text style={styles.title}>A verse where you'll see it</Text>
            <Text style={styles.intro}>
              At each spiritual window, Sakina sends the complete ayah for that moment
              over a background you choose.
            </Text>

            {!isPremium ? (
              <View style={styles.lockedCard}>
                <Ionicons
                  name="lock-closed-outline"
                  size={24}
                  color={Colors.accent.primary}
                  style={{ marginBottom: Spacing.md }}
                />
                <Text style={styles.lockedTitle}>Part of Sakina Pro</Text>
                <Text style={styles.lockedBody}>
                  Lock screen verses come with Pro, alongside unlimited refreshes and
                  saved verses.
                </Text>
                <TouchableOpacity
                  style={styles.cta}
                  onPress={() => navigation.navigate('Support')}
                  accessibilityRole="button"
                  accessibilityLabel="See Sakina Pro"
                >
                  <Text style={styles.ctaText}>See Sakina Pro</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {renderToggle(
                  'Lock Screen Verses',
                  'Deliver a verse at each window you keep on below.',
                  prefs.enabled,
                  () => apply({ enabled: !prefs.enabled }),
                )}

                {prefs.enabled && (
                  <>
                    <Text style={styles.sectionHeader}>WINDOWS</Text>
                    {SPIRITUAL_WINDOWS.map((w) =>
                      renderToggle(
                        WINDOW_COPY[w].title,
                        WINDOW_COPY[w].subtitle,
                        prefs.windows[w],
                        () => toggleWindow(w),
                      ),
                    )}

                    <Text style={styles.sectionHeader}>READING</Text>
                    {renderToggle(
                      'Show Transliteration',
                      'Adds the Latin reading between the Arabic and the translation.',
                      prefs.showTransliteration,
                      () => apply({ showTransliteration: !prefs.showTransliteration }),
                    )}

                    <Text style={styles.sectionHeader}>BACKGROUND</Text>
                    <FlatList
                      data={BACKGROUND_THEMES}
                      keyExtractor={(item) => item.id}
                      numColumns={THEME_COLUMNS}
                      scrollEnabled={false}
                      columnWrapperStyle={styles.themeRow}
                      renderItem={({ item }) => {
                        const selected = prefs.themeId === item.id;
                        return (
                          <TouchableOpacity
                            style={[styles.themeTile, selected && styles.themeTileSelected]}
                            onPress={() => apply({ themeId: item.id })}
                            accessibilityRole="button"
                            accessibilityLabel={item.name}
                            accessibilityState={{ selected }}
                          >
                            <Image source={item.imageSource} style={themeThumbStyle} />
                            {selected && (
                              <View style={styles.themeCheck}>
                                <Ionicons name="checkmark" size={14} color={Colors.background.primary} />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </>
                )}
              </>
            )}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

// Kept out of StyleSheet.create's object: that call widens every entry to a
// ViewStyle | TextStyle | ImageStyle union, which <Image style> rejects.
const themeThumbStyle: ImageStyle = { width: '100%', height: '100%' };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  eyebrow: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    letterSpacing: 1.5,
    color: Colors.accent.primary,
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h1,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  intro: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.small,
    lineHeight: Typography.sizes.small * 1.5,
    color: Colors.text.secondary,
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    letterSpacing: 1.2,
    color: Colors.text.muted,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass.medium,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  panelText: { flex: 1, paddingRight: Spacing.md },
  panelTitle: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  panelSubtitle: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    lineHeight: Typography.sizes.detail * 1.4,
    color: Colors.text.secondary,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.glass.border,
    padding: 3,
    justifyContent: 'center',
  },
  switchActive: { backgroundColor: Colors.accent.primary },
  knob: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.text.secondary,
  },
  knobActive: { backgroundColor: Colors.background.primary, alignSelf: 'flex-end' },
  lockedCard: {
    backgroundColor: Colors.glass.medium,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  lockedTitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  lockedBody: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.small,
    lineHeight: Typography.sizes.small * 1.5,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  cta: {
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
  },
  ctaText: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    color: Colors.background.primary,
  },
  themeRow: { justifyContent: 'space-between', marginBottom: Spacing.sm },
  themeTile: {
    flex: 1 / THEME_COLUMNS,
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeTileSelected: { borderColor: Colors.accent.primary },
  themeCheck: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
