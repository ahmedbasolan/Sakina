/**
 * Lock Screen Verses — setup.
 *
 * Premium-gated. See docs/superpowers/specs/2026-08-15-lockscreen-verses-design.md.
 *
 * Design intent, so a later edit does not flatten it back into a settings list:
 *
 *  - The hero is a LIVE PREVIEW of the lock screen, not a list header. The
 *    screen's job is "see what will appear, then shape it", and a background
 *    chosen from a thumbnail with no preview is a choice made blind.
 *  - The three windows are laid out on a TIME RAIL because they are not
 *    equivalent options — they are three moments in the passage of one night
 *    and day (deep night -> dawn -> dusk). The rail encodes that order; it is
 *    structure, not ornament.
 *  - Everything else stays quiet. Hairline separators rather than a glass card
 *    around every switch, and no eyebrow above a title that says the same
 *    thing.
 *
 * Background photos are IOS-ONLY, confirmed by reading expo-notifications'
 * native Android builder rather than assumed: a locally scheduled notification
 * on Android always renders BigTextStyle and its image hook only reads a
 * static manifest icon, never per-call content. There is no config fix — a
 * real photo on Android needs a native module. The preview and the background
 * picker are therefore gated to iOS; showing either on Android would promise a
 * result the platform cannot deliver.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  ImageBackground,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, BorderRadius, Animations } from '../theme/DesignSystem';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { HapticsService } from '../services/hapticsService';
import { SubscriptionService } from '../services/subscriptionService';
import NotificationService from '../services/notificationService';
import { BACKGROUND_THEMES } from '../services/backgroundThemeService';
import {
  SPIRITUAL_WINDOWS,
  SpiritualWindow,
  DailyVerse,
  getWindowVerse,
} from '../services/dailyVerseService';
import {
  LockscreenVersePrefs,
  DEFAULT_LOCKSCREEN_PREFS,
  loadLockscreenPrefs,
  saveLockscreenPrefs,
  WINDOW_TITLES,
} from '../services/lockscreenVerseService';
import { topUpScheduledNotifications } from '../services/notificationTopUpTask';
import { logServiceError } from '../services/errorLoggingService';

/**
 * Each window's place on the night-to-day arc. `when` is relational rather than
 * a computed clock time on purpose: prayer times shift daily and by location,
 * and printing a stale hour on a settings screen would be worse than printing
 * none. The relation is always true.
 */
const WINDOW_ARC: Record<
  SpiritualWindow,
  { label: string; when: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  tahajjud: { label: 'Tahajjud', when: 'An hour before Fajr', icon: 'moon-outline' },
  morning: { label: 'Morning adhkar', when: 'Just after Fajr', icon: 'partly-sunny-outline' },
  evening: { label: 'Evening adhkar', when: 'Before Maghrib', icon: 'cloudy-night-outline' },
};

const CAROUSEL_CARD_W = 108;

/**
 * The notification mockup, shared by the iOS (over-photo) and Android
 * (flat-surface) preview branches so the two never drift out of sync with
 * each other — a change to how the notification is worded only needs editing
 * once.
 */
function NotifCard({
  window,
  verse,
  showTransliteration,
}: {
  window: SpiritualWindow;
  verse: DailyVerse | null;
  showTransliteration: boolean;
}) {
  return (
    <View style={styles.notif}>
      <View style={styles.notifHead}>
        <Image source={require('../../assets/icon.png')} style={notifIconStyle} />
        <Text style={styles.notifApp}>SAKINA</Text>
        <Text style={styles.notifNow}>now</Text>
      </View>
      <Text style={styles.notifTitle}>{WINDOW_TITLES[window]}</Text>
      {/* No numberOfLines anywhere in here: clamping an ayah with no way to
          reach the rest is banned outright (CLAUDE.md §4). The card grows
          instead. */}
      {verse && (
        <>
          <Text style={styles.notifArabic}>{verse.arabic}</Text>
          {showTransliteration && (
            <Text style={styles.notifTranslit}>{verse.transliteration}</Text>
          )}
          <Text style={styles.notifBody}>{verse.translation}</Text>
          <Text style={styles.notifRef}>{verse.ref}</Text>
        </>
      )}
    </View>
  );
}

interface Props {
  onBack?: () => void;
}

export default function LockscreenVersesScreen({ onBack }: Props) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  const [isPremium, setIsPremium] = useState(false);
  const [prefs, setPrefs] = useState<LockscreenVersePrefs>(DEFAULT_LOCKSCREEN_PREFS);
  const [verse, setVerse] = useState<DailyVerse | null>(null);
  const [loading, setLoading] = useState(true);
  // Lock screen verses are entirely a payload change on the "Spiritual
  // Windows" notification category (Daily Reminders screen) — with that
  // category off, nothing schedules no matter what this screen's toggle
  // says. Re-checked on focus, not just mount, so leaving for Daily
  // Reminders and coming back reflects the real state immediately.
  const [spiritualWindowsEnabled, setSpiritualWindowsEnabled] = useState(true);

  const fade = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);

  const handleBack = onBack || (() => navigation.goBack());

  const supportsPhotoBackground = Platform.OS === 'ios';

  /** The preview shows the first window still switched on — the next one they'd actually receive. */
  const previewWindow = useMemo<SpiritualWindow>(
    () => SPIRITUAL_WINDOWS.find((w) => prefs.windows[w]) ?? 'morning',
    [prefs.windows],
  );

  const previewTheme = useMemo(
    () =>
      (prefs.themeId ? BACKGROUND_THEMES.find((t) => t.id === prefs.themeId) : null) ??
      BACKGROUND_THEMES[0],
    [prefs.themeId],
  );

  useEffect(() => {
    isMounted.current = true;
    (async () => {
      const [stored, spiritualOn] = await Promise.all([
        loadLockscreenPrefs(),
        NotificationService.getInstance().getSpiritualEnabled(),
      ]);
      if (!isMounted.current) return;
      setIsPremium(SubscriptionService.getInstance().isPremium());
      setPrefs(stored);
      setSpiritualWindowsEnabled(spiritualOn);
      setLoading(false);
    })();
    return () => {
      isMounted.current = false;
    };
  }, []);

  // The mount effect above only runs once, so a trip to Daily Reminders and
  // back would otherwise leave this screen showing a stale "Arriving at 3 of
  // 3 windows" even after the user switched Spiritual Windows off there.
  useFocusEffect(
    useCallback(() => {
      NotificationService.getInstance()
        .getSpiritualEnabled()
        .then((enabled) => {
          if (isMounted.current) setSpiritualWindowsEnabled(enabled);
        })
        .catch(() => {});
    }, []),
  );

  // Re-read whenever the previewed window changes so the card shows that
  // window's actual verse, not a stand-in.
  useEffect(() => {
    let active = true;
    getWindowVerse(previewWindow)
      .then((v) => {
        if (active && isMounted.current) setVerse(v);
      })
      .catch(() => {
        /* preview degrades to background-only; the notification itself is unaffected */
      });
    return () => {
      active = false;
    };
  }, [previewWindow]);

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
   * Persist, then re-run the scheduler. The verse lives in the notification
   * payload, so saving alone would leave already-queued notifications showing
   * the previous choice.
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

  const activeCount = SPIRITUAL_WINDOWS.filter((w) => prefs.windows[w]).length;

  // Computed once per mount rather than ticking: a live-updating clock on a
  // settings preview is motion with no purpose, and would defeat reduce-motion.
  const clock = useMemo(
    () =>
      new Date().toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).replace(/\s?[AP]M$/i, ''),
    [],
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.celestialWash} style={StyleSheet.absoluteFill} pointerEvents="none" />

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
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl }]}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>A verse where you'll see it</Text>

            {!isPremium ? (
              <View style={styles.lockedCard}>
                <Text style={styles.lockedTitle}>Part of Sakina Pro</Text>
                <Text style={styles.lockedBody}>
                  Lock screen verses arrive at each spiritual window, over a background you
                  choose.
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
                {/* ---- Hero: live lock screen preview ----
                    Photo background is iOS-only — see the file header for why.
                    The Android branch shows exactly what Android actually
                    delivers: the same card, on a flat surface, no photo. */}
                <View style={styles.previewFrame}>
                  {supportsPhotoBackground ? (
                    <ImageBackground
                      source={previewTheme.imageSource}
                      style={styles.previewImage}
                      imageStyle={previewImageRadius}
                    >
                      <LinearGradient
                        colors={['rgba(7,17,30,0.15)', 'rgba(7,17,30,0.85)']}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                      />
                      {/* Real current time, not a mocked one — the preview reads
                          as "your lock screen" rather than a stock illustration. */}
                      <Text style={styles.previewClock}>{clock}</Text>
                      <NotifCard window={previewWindow} verse={verse} showTransliteration={prefs.showTransliteration} />
                    </ImageBackground>
                  ) : (
                    <View style={[styles.previewImage, styles.previewImageFlat]}>
                      <Text style={styles.previewClock}>{clock}</Text>
                      <NotifCard window={previewWindow} verse={verse} showTransliteration={prefs.showTransliteration} />
                    </View>
                  )}
                </View>

                {!supportsPhotoBackground && (
                  <Text style={styles.androidNote}>
                    Backgrounds are shown on iPhone. On Android, verses arrive with the text above
                    — no photo.
                  </Text>
                )}

                {prefs.enabled && !spiritualWindowsEnabled ? (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('DailyReminders')}
                    accessibilityRole="button"
                    accessibilityLabel="Spiritual window reminders are off, so nothing will arrive. Open Daily Reminders to turn them on."
                  >
                    <Text style={[styles.previewCaption, styles.previewCaptionWarn]}>
                      Spiritual window reminders are off, so nothing will arrive. Turn them on in
                      Daily Reminders →
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.previewCaption}>
                    {prefs.enabled
                      ? `Arriving at ${activeCount} of 3 windows`
                      : 'Preview only. Not delivering yet.'}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.masterRow}
                  onPress={() => apply({ enabled: !prefs.enabled })}
                  accessibilityRole="switch"
                  accessibilityLabel="Lock screen verses"
                  accessibilityState={{ checked: prefs.enabled }}
                >
                  <Text style={styles.masterLabel}>Lock screen verses</Text>
                  <View style={[styles.switch, prefs.enabled && styles.switchActive]}>
                    <View style={[styles.knob, prefs.enabled && styles.knobActive]} />
                  </View>
                </TouchableOpacity>

                {prefs.enabled && (
                  <>
                    {/* ---- Time rail ---- */}
                    <Text style={styles.sectionLabel}>Through the night and day</Text>
                    <View style={styles.rail}>
                      <View style={styles.railLine} pointerEvents="none" />
                      {SPIRITUAL_WINDOWS.map((w) => {
                        const on = prefs.windows[w];
                        return (
                          <TouchableOpacity
                            key={w}
                            style={styles.railStop}
                            onPress={() =>
                              apply({ windows: { ...prefs.windows, [w]: !prefs.windows[w] } })
                            }
                            accessibilityRole="switch"
                            accessibilityLabel={WINDOW_ARC[w].label}
                            accessibilityState={{ checked: on }}
                          >
                            <View style={[styles.railNode, on && styles.railNodeOn]}>
                              <Ionicons
                                name={WINDOW_ARC[w].icon}
                                size={14}
                                color={on ? Colors.background.primary : Colors.text.steel}
                              />
                            </View>
                            <View style={styles.railText}>
                              <Text style={[styles.railLabel, !on && styles.railLabelOff]}>
                                {WINDOW_ARC[w].label}
                              </Text>
                              <Text style={styles.railWhen}>{WINDOW_ARC[w].when}</Text>
                            </View>
                            <Ionicons
                              name={on ? 'checkmark' : 'add'}
                              size={16}
                              color={on ? Colors.accent.primary : Colors.text.steel}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* ---- Backgrounds ----
                        iOS only. Rendering this on Android would offer a
                        choice with no observable effect — see the file
                        header. */}
                    {supportsPhotoBackground && (
                      <>
                        <Text style={styles.sectionLabel}>Background</Text>
                        <FlatList
                          data={BACKGROUND_THEMES}
                          keyExtractor={(item) => item.id}
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          snapToInterval={CAROUSEL_CARD_W + Spacing.sm}
                          decelerationRate="fast"
                          contentContainerStyle={styles.carousel}
                          renderItem={({ item }) => {
                            const selected = previewTheme.id === item.id;
                            return (
                              <TouchableOpacity
                                style={[styles.swatch, selected && styles.swatchSelected]}
                                onPress={() => apply({ themeId: item.id })}
                                accessibilityRole="button"
                                accessibilityLabel={item.name}
                                accessibilityState={{ selected }}
                              >
                                <Image source={item.imageSource} style={swatchImageStyle} />
                              </TouchableOpacity>
                            );
                          }}
                        />
                      </>
                    )}

                    {/* ---- Reading ---- */}
                    <TouchableOpacity
                      style={styles.plainRow}
                      onPress={() => apply({ showTransliteration: !prefs.showTransliteration })}
                      accessibilityRole="switch"
                      accessibilityLabel="Show transliteration"
                      accessibilityState={{ checked: prefs.showTransliteration }}
                    >
                      <View style={styles.plainRowText}>
                        <Text style={styles.plainLabel}>Show transliteration</Text>
                        <Text style={styles.plainHint}>Latin reading, above the translation</Text>
                      </View>
                      <View style={[styles.switch, prefs.showTransliteration && styles.switchActive]}>
                        <View
                          style={[styles.knob, prefs.showTransliteration && styles.knobActive]}
                        />
                      </View>
                    </TouchableOpacity>
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

// Image styles live outside StyleSheet.create: that call widens entries to a
// ViewStyle | TextStyle | ImageStyle union, which <Image style> rejects.
const notifIconStyle: ImageStyle = { width: 14, height: 14, borderRadius: 3 };
const swatchImageStyle: ImageStyle = { width: '100%', height: '100%' };
const previewImageRadius: ImageStyle = { borderRadius: BorderRadius.xxl };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.primary },
  header: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },

  title: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.h1,
    color: Colors.text.primary,
    marginBottom: Spacing.xl,
  },

  // ---- Preview ----
  previewFrame: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glass.border,
  },
  previewImage: {
    width: '100%',
    minHeight: 300,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
    justifyContent: 'flex-start',
  },
  // Android's honest preview: same card, no photo — matches what the
  // platform actually delivers rather than the iOS mockup's wallpaper.
  previewImageFlat: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.xxl,
  },
  previewClock: {
    fontFamily: Typography.fonts.latin,
    fontSize: 44,
    fontWeight: '300',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  notif: {
    backgroundColor: 'rgba(12,26,46,0.72)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    padding: Spacing.md,
  },
  notifHead: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  notifApp: {
    flex: 1,
    marginLeft: Spacing.xs,
    fontFamily: Typography.fonts.latin,
    fontSize: 10,
    letterSpacing: 1.2,
    color: Colors.text.secondary,
  },
  notifNow: {
    fontFamily: Typography.fonts.latin,
    fontSize: 10,
    color: Colors.text.steel,
  },
  notifTitle: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.small,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  notifArabic: {
    fontFamily: Typography.fonts.arabic,
    fontSize: 17,
    lineHeight: 30,
    color: Colors.text.primary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: Spacing.sm,
  },
  notifTranslit: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    fontStyle: 'italic',
    lineHeight: Typography.sizes.detail * 1.5,
    color: Colors.accent.light,
    marginBottom: Spacing.xs,
  },
  notifBody: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    lineHeight: Typography.sizes.detail * 1.5,
    color: Colors.text.secondary,
  },
  notifRef: {
    fontFamily: Typography.fonts.latin,
    fontSize: 10,
    letterSpacing: 0.6,
    color: Colors.accent.primary,
    marginTop: Spacing.sm,
  },
  previewCaption: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    color: Colors.text.steel,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  previewCaptionWarn: {
    color: Colors.status.error,
  },
  androidNote: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    lineHeight: Typography.sizes.detail * 1.5,
    color: Colors.text.steel,
    textAlign: 'center',
    marginTop: Spacing.md,
  },

  // ---- Rows ----
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.glass.border,
  },
  masterLabel: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
  },
  sectionLabel: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: Colors.text.steel,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.lg,
  },

  // ---- Time rail ----
  rail: { position: 'relative' },
  railLine: {
    position: 'absolute',
    left: 15,
    top: Spacing.lg,
    bottom: Spacing.lg,
    width: StyleSheet.hairlineWidth,
    backgroundColor: Colors.glass.border,
  },
  railStop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  railNode: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railNodeOn: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  railText: { flex: 1, marginLeft: Spacing.lg },
  railLabel: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
  },
  railLabelOff: { color: Colors.text.muted },
  railWhen: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    color: Colors.text.steel,
    marginTop: 2,
  },

  // ---- Backgrounds ----
  carousel: { paddingRight: Spacing.xl },
  swatch: {
    width: CAROUSEL_CARD_W,
    height: 148,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginRight: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchSelected: { borderColor: Colors.accent.primary },

  plainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.xxl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.glass.border,
  },
  plainRowText: { flex: 1, paddingRight: Spacing.md },
  plainLabel: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
  },
  plainHint: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.detail,
    color: Colors.text.steel,
    marginTop: 2,
  },

  // ---- Switch ----
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

  // ---- Locked ----
  lockedCard: {
    backgroundColor: Colors.glass.medium,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    padding: Spacing.xl,
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
    marginBottom: Spacing.xl,
  },
  cta: {
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: Typography.fonts.latin,
    fontSize: Typography.sizes.body,
    color: Colors.background.primary,
  },
});
