import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList, MainTabParamList } from '../navigation/types';
import { logServiceError } from '../services/errorLoggingService';
import { AuthService } from '../services/authService';
import Icon from '../components/Icon';
import { SubscriptionService } from '../services/subscriptionService';
import { SupabaseDataService } from '../services/supabaseDataService';
import { PreferencesService } from '../services/preferencesService';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import { getAnalyticsConsent, setAnalyticsConsent } from '../config/posthog';
import { LEGAL_URLS } from '../constants';
import { moodHistoryService } from '../services/moodHistoryService';
import { dbQuery } from '../database/schema';

// Fill in your Apple App Store numeric ID after submission.
// Format: https://apps.apple.com/app/id<YOUR_ID>?action=write-review
const APP_STORE_REVIEW_URL = '';

const SUPPORT_EMAIL = 'support@sakinaapp.com';

type SettingsNavProp = CompositeNavigationProp<
  StackNavigationProp<RootStackParamList, 'Settings'>,
  BottomTabNavigationProp<MainTabParamList>
>;

// ─── Reusable row ────────────────────────────────────────────────────────────

interface SettingRowProps {
  label: string;
  value?: string;
  icon?: string;
  onPress?: () => void;
  showToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  isDestructive?: boolean;
  disabled?: boolean;
}

const SettingRow = ({
  label,
  value,
  icon,
  onPress,
  showToggle,
  toggleValue,
  onToggle,
  isDestructive,
  disabled,
}: SettingRowProps) => (
  <TouchableOpacity
    style={[styles.row, disabled && styles.rowDisabled]}
    onPress={onPress}
    activeOpacity={onPress && !disabled ? 0.7 : 1}
    disabled={disabled}
    accessibilityRole={showToggle ? undefined : 'button'}
    accessibilityLabel={label}
    accessibilityState={{ disabled: !!disabled }}
  >
    <View style={styles.rowLeft}>
      {icon && (
        <Ionicons
          name={icon as any}
          size={17}
          color={isDestructive ? 'rgba(255, 80, 80, 0.6)' : 'rgba(240, 220, 190, 0.50)'}
          style={styles.rowIconGap}
        />
      )}
      <Text style={[styles.rowLabel, isDestructive && styles.destructiveText, disabled && styles.disabledText]}>
        {label}
      </Text>
    </View>
    <View style={styles.rowRight}>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {showToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: 'rgba(255,255,255,0.12)', true: Colors.accent.primary }}
          thumbColor="#f4f3f4"
        />
      ) : onPress && !disabled ? (
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.18)" />
      ) : null}
    </View>
  </TouchableOpacity>
);

// ─── Section header ───────────────────────────────────────────────────────────

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

// ─── Profile card ─────────────────────────────────────────────────────────────

interface ProfileCardProps {
  name: string | null;
  email: string | null;
  isGuest: boolean;
  onSignIn: () => void;
}

const ProfileCard = ({ name, email, isGuest, onSignIn }: ProfileCardProps) => {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : email
    ? email[0].toUpperCase()
    : '?';

  if (isGuest) {
    return (
      <TouchableOpacity
        style={styles.profileCard}
        onPress={onSignIn}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Guest mode — sign in to sync your progress"
      >
        <View style={[styles.avatar, styles.avatarGuest]}>
          <Ionicons name="person-outline" size={24} color="rgba(240,220,190,0.45)" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Guest Mode</Text>
          <Text style={styles.profileEmail}>Sign in to sync your progress</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.profileCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.profileInfo}>
        {name ? <Text style={styles.profileName}>{name}</Text> : null}
        <Text style={[styles.profileEmail, !name && styles.profileEmailOnly]}>
          {email ?? 'No email'}
        </Text>
      </View>
    </View>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavProp>();
  const { user, signOut, isGuest } = useAuth();
  const insets = useSafeAreaInsets();

  const [streakDays, setStreakDays]         = useState(0);
  const [reflectionCount, setReflectionCount] = useState(0);
  const [totalSessions, setTotalSessions]   = useState(0);
  const [isPremium, setIsPremium]           = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [autoPlayAudio, setAutoPlayAudio]   = useState(false);
  const [restoring, setRestoring]           = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
      setIsPremium(SubscriptionService.getInstance().isPremium());
      getAnalyticsConsent().then(setAnalyticsEnabled).catch(() => {});
      const prefs = PreferencesService.getInstance().getPreferences();
      setShowTransliteration(prefs.showTransliteration);
      setAutoPlayAudio(prefs.autoPlayAudio);
    }, []),
  );

  // ── Loaders ────────────────────────────────────────────────────────────────

  const loadStats = async () => {
    try {
      const [moodStats, count] = await Promise.all([
        moodHistoryService.getStats(),
        dbQuery(async (db) => {
          const res = await db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM saved_reflections',
          );
          return res?.count ?? 0;
        }),
      ]);
      setReflectionCount(count);
      setTotalSessions(moodStats.totalDaysTracked);
      setStreakDays(moodStats.currentStreak);
    } catch (error) {
      logServiceError('SettingsScreen', 'loadStats', error instanceof Error ? error : new Error(String(error)));
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openURL = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Could not open link', 'Please try again later.'),
    );
  };

  const handleRestorePurchases = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const sub = SubscriptionService.getInstance();
      const restored = await sub.restorePurchases();
      setIsPremium(sub.isPremium());
      Alert.alert(
        restored ? 'Purchases Restored' : 'Nothing to Restore',
        restored
          ? 'Your Sakina Pro subscription is active. Welcome back!'
          : 'No active subscription found for this store account.',
      );
    } catch (error) {
      logServiceError('SettingsScreen', 'restorePurchases', error instanceof Error ? error : new Error(String(error)));
      Alert.alert('Error', 'Could not restore purchases. Please check your connection and try again.');
    } finally {
      setRestoring(false);
    }
  };

  const handleToggleTransliteration = async (val: boolean) => {
    setShowTransliteration(val);
    await PreferencesService.getInstance().setShowTransliteration(val);
  };

  const handleToggleAudio = async (val: boolean) => {
    setAutoPlayAudio(val);
    await PreferencesService.getInstance().setAutoPlayAudio(val);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Mood History',
      'This permanently deletes all your mood check-ins and guidance history. Your journal entries will NOT be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear History',
          style: 'destructive',
          onPress: async () => {
            try {
              await SupabaseDataService.getInstance().clearHistory();
              setStreakDays(0);
              setTotalSessions(0);
              Alert.alert('Done', 'Your mood history has been cleared.');
            } catch (error) {
              logServiceError('SettingsScreen', 'clearHistory', error instanceof Error ? error : new Error(String(error)));
              Alert.alert('Error', 'Could not clear history. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleSignIn = () => {
    navigation.navigate('Login');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data associated with it. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Are you absolutely sure?',
              'Your account, mood history, and spiritual journey progress will be deleted forever.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    if (deletingAccount) return;
                    setDeletingAccount(true);
                    try {
                      await AuthService.getInstance().deleteAccount();
                      // Success — the auth listener navigates away; component unmounts.
                      // Do NOT reset deletingAccount here: the component is gone.
                    } catch (error) {
                      logServiceError('SettingsScreen', 'deleteAccount', error instanceof Error ? error : new Error(String(error)));
                      const msg = error instanceof Error ? error.message : String(error);
                      Alert.alert(
                        'Error',
                        msg.includes('sign in again')
                          ? msg
                          : 'Could not delete account. Please try again or contact support.',
                      );
                      setDeletingAccount(false);
                    }
                  },
                },
              ],
            ),
        },
      ],
    );
  };

  const handleRateApp = () => {
    if (APP_STORE_REVIEW_URL) {
      openURL(APP_STORE_REVIEW_URL);
    } else {
      Alert.alert('Rate Sakina', 'App Store rating will be available after launch. Thank you for your support!');
    }
  };

  const handleFeedback = () => {
    openURL(`mailto:${SUPPORT_EMAIL}?subject=Sakina Feedback`);
  };

  const handleContactUs = () => {
    openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  const handleSources = () => {
    Alert.alert(
      'Sources & Attribution',
      '• Quranic Text: Tanzil.net\n• Translations: Sahih International\n• Hadith: Bukhari, Muslim, Tirmidhi, Abu Dawud\n• Tafsir: Ibn Kathir, As-Saʿdi, Ibn al-Qayyim',
    );
  };

  // ── Derived values ─────────────────────────────────────────────────────────

  const displayName: string | null = user?.user_metadata?.full_name ?? null;
  const email: string | null = user?.email ?? null;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <LinearGradient colors={Colors.celestialWash} style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.xl) }]}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xxxl + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <ProfileCard
          name={displayName}
          email={email}
          isGuest={isGuest}
          onSignIn={handleSignIn}
        />

        {/* Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('MoodHistory')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Streak — ${streakDays} days`}
            accessibilityHint="Double tap to view mood history"
          >
            <Icon name="flame" size={26} color={Colors.accent.primary} />
            <Text style={styles.statValue}>{streakDays}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Journal')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Reflections — ${reflectionCount}`}
            accessibilityHint="Double tap to open your journal"
          >
            <Icon name="chat" size={26} color="rgba(180, 130, 220, 0.9)" />
            <Text style={styles.statValue}>{reflectionCount}</Text>
            <Text style={styles.statLabel}>Reflections</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('MoodHistory')}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Sessions — ${totalSessions}`}
            accessibilityHint="Double tap to view mood history"
          >
            <Icon name="chart" size={26} color="rgba(90, 160, 220, 0.9)" />
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </TouchableOpacity>
        </View>

        {/* Sakina Pro */}
        <SectionHeader title="SAKINA PRO" />
        <View style={styles.section}>
          <SettingRow
            label={isPremium ? 'Sakina Pro · Active' : 'Upgrade to Sakina Pro'}
            icon={isPremium ? 'checkmark-circle-outline' : 'heart-outline'}
            value={isPremium ? '✦' : undefined}
            onPress={() => navigation.navigate('Support')}
          />
          <SettingRow
            label={restoring ? 'Restoring…' : 'Restore Purchases'}
            icon="card-outline"
            onPress={handleRestorePurchases}
            disabled={restoring}
          />
        </View>

        {/* Preferences */}
        <SectionHeader title="PREFERENCES" />
        <View style={styles.section}>
          <SettingRow
            label="Daily Reminders"
            icon="notifications-outline"
            onPress={() => navigation.navigate('DailyReminders')}
          />
          <SettingRow
            label="Show Transliteration"
            icon="text-outline"
            showToggle
            toggleValue={showTransliteration}
            onToggle={handleToggleTransliteration}
          />
          <SettingRow
            label="Auto-play Audio"
            icon="volume-medium-outline"
            showToggle
            toggleValue={autoPlayAudio}
            onToggle={handleToggleAudio}
          />
        </View>

        {/* Data & Privacy */}
        <SectionHeader title="DATA & PRIVACY" />
        <View style={styles.section}>
          <SettingRow
            label="Share Crash Reports"
            icon="analytics-outline"
            showToggle
            toggleValue={analyticsEnabled}
            onToggle={async (val) => {
              setAnalyticsEnabled(val);
              await setAnalyticsConsent(val);
            }}
          />
          <SettingRow
            label="Clear Mood History"
            icon="trash-outline"
            isDestructive
            onPress={handleClearHistory}
          />
          <SettingRow
            label="Privacy Policy"
            icon="shield-checkmark-outline"
            onPress={() => openURL(LEGAL_URLS.privacy)}
          />
          <SettingRow
            label="Terms of Service"
            icon="document-text-outline"
            onPress={() => openURL(LEGAL_URLS.terms)}
          />
        </View>

        {/* Support */}
        <SectionHeader title="SUPPORT" />
        <View style={styles.section}>
          <SettingRow
            label="Rate Sakina"
            icon="star-outline"
            onPress={handleRateApp}
          />
          <SettingRow
            label="Send Feedback"
            icon="mail-outline"
            onPress={handleFeedback}
          />
          <SettingRow
            label="Contact Us"
            icon="chatbox-outline"
            onPress={handleContactUs}
          />
        </View>

        {/* About */}
        <SectionHeader title="ABOUT" />
        <View style={styles.section}>
          <SettingRow
            label="Sources & Attribution"
            icon="library-outline"
            onPress={handleSources}
          />
          <SettingRow
            label="App Version"
            icon="information-circle-outline"
            value="1.0.0"
          />
        </View>

        {/* Account */}
        <SectionHeader title="ACCOUNT" />
        <View style={styles.section}>
          {user ? (
            <>
              <SettingRow
                label="Sign Out"
                icon="log-out-outline"
                isDestructive
                onPress={handleSignOut}
              />
              <SettingRow
                label={deletingAccount ? 'Deleting…' : 'Delete Account'}
                icon="person-remove-outline"
                isDestructive
                onPress={handleDeleteAccount}
                disabled={deletingAccount}
              />
            </>
          ) : (
            <SettingRow
              label="Sign In / Create Account"
              icon="person-outline"
              onPress={handleSignIn}
            />
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Sakina</Text>
          <Text style={styles.footerSubtext}>Refining the soul, one verse at a time.</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: Typography.sizes.h1,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: Typography.fonts.serif,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    gap: 0,
  },

  // ── Profile card ────────────────────────────────────────────────────────────
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.18)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xxl,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGuest: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  avatarText: {
    fontSize: Typography.sizes.h2,
    fontWeight: '700',
    color: Colors.accent.primary,
    fontFamily: Typography.fonts.serif,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: Typography.sizes.body,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  profileEmail: {
    fontSize: Typography.sizes.small,
    color: 'rgba(245,237,227,0.50)',
  },
  profileEmailOnly: {
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
  },

  // ── Stats ───────────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: Typography.sizes.stat,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: Typography.sizes.label,
    color: 'rgba(255,255,255,0.38)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // ── Section header ──────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: Typography.sizes.label,
    fontWeight: '600',
    color: Colors.accent.primary,
    letterSpacing: 1.6,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xl,
    opacity: 0.85,
  },

  // ── Section container ───────────────────────────────────────────────────────
  section: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },

  // ── Row ─────────────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  rowDisabled: {
    opacity: 0.45,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIconGap: {
    marginRight: Spacing.sm,
    width: 20,
  },
  rowLabel: {
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
  },
  destructiveText: {
    color: '#FF5555',
  },
  disabledText: {
    color: 'rgba(255,255,255,0.35)',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rowValue: {
    fontSize: Typography.sizes.small,
    color: 'rgba(255,255,255,0.38)',
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer: {
    marginTop: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: Typography.sizes.small,
    color: 'rgba(255,255,255,0.22)',
    fontWeight: '600',
    fontFamily: Typography.fonts.serif,
  },
  footerSubtext: {
    fontSize: Typography.sizes.detail,
    color: 'rgba(255,255,255,0.15)',
    fontStyle: 'italic',
  },
});
