import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
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

import Icon from '../components/Icon';
import { refreshContentOnly } from '../database/schema';
import { SubscriptionService } from '../services/subscriptionService';
import { SupabaseDataService } from '../services/supabaseDataService';
import { Colors, Spacing, Typography, BorderRadius } from '../theme/DesignSystem';
import { getAnalyticsConsent, setAnalyticsConsent } from '../config/posthog';

type SettingsNavProp = CompositeNavigationProp<
  StackNavigationProp<RootStackParamList, 'Settings'>,
  BottomTabNavigationProp<MainTabParamList>
>;

interface SettingRowProps {
  label: string;
  value?: string;
  icon?: string;
  onPress?: () => void;
  showToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  isDestructive?: boolean;
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
}: SettingRowProps) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
    <View style={styles.rowLeft}>
      {icon && (
        <Ionicons
          name={icon as any}
          size={17}
          color="rgba(240, 220, 190, 0.55)"
          style={styles.rowIconGap}
        />
      )}
      <Text style={[styles.rowLabel, isDestructive && styles.destructiveText]}>{label}</Text>
    </View>
    <View style={styles.rowRight}>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {showToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: 'rgba(255, 255, 255, 0.12)', true: Colors.accent.primary }}
          thumbColor="#f4f3f4"
        />
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.2)" />
      ) : null}
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNavProp>();
  const { user, signOut } = useAuth();
  const onNavigateToDailyReminders = () => navigation.navigate('DailyReminders');
  const onNavigateToMoodHistory = () => navigation.navigate('MoodHistory');
  const onNavigateToReflections = () => navigation.navigate('Journal');
  const insets = useSafeAreaInsets();
  const [streakDays, setStreakDays] = useState(0);
  const [reflectionCount, setReflectionCount] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [isPremium, setIsPremium] = useState(false);

  // Reload on every focus (not just mount) so the stats and subscription
  // state are fresh after navigating back from Mood History, Journal, or
  // the Support screen.
  useFocusEffect(
    React.useCallback(() => {
      loadStats();
      loadPremiumStatus();
      getAnalyticsConsent().then(setAnalyticsEnabled).catch(() => {});
    }, []),
  );

  const loadPremiumStatus = () => {
    setIsPremium(SubscriptionService.getInstance().isPremium());
  };

  const loadStats = async () => {
    try {
      const { moodHistoryService } = await import('../services/moodHistoryService');
      const { dbQuery } = await import('../database/schema');

      // Sequenced — not concurrent — because moodHistoryService.getStats() internally
      // calls dbQuery for guest users. Running both in Promise.all would queue them
      // correctly after the connection.ts fix, but sequential is clearer and safer.
      const moodStats = await moodHistoryService.getStats();
      const reflectionCountResult = await dbQuery(async (db) => {
        const res = await db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM saved_reflections',
        );
        return res?.count ?? 0;
      });

      setReflectionCount(reflectionCountResult);
      setTotalSessions(moodStats.totalDaysTracked);
      setStreakDays(moodStats.currentStreak);
    } catch (error) {
      logServiceError('SettingsScreen', 'loadProfileStats', error instanceof Error ? error : new Error(String(error)));
    }
  };

  const handleContentReset = async () => {
    Alert.alert(
      'Reset App Content',
      'This will update all Quranic verses and guidance to the latest version. Your personal history and reflections will NOT be deleted. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Content',
          style: 'destructive',
          onPress: async () => {
            try {
              await refreshContentOnly();
              Alert.alert('Success', 'App content has been refreshed with the latest guidance! ✨');
            } catch (_error) {
              Alert.alert('Error', 'Failed to refresh content. Please try again.');
            }
          },
        },
      ],
    );
  };

  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Required by App Store / Play Store guidelines: users who reinstall or
  // switch devices must be able to recover an active subscription.
  const handleRestorePurchases = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const subService = SubscriptionService.getInstance();
      const restored = await subService.restorePurchases();
      setIsPremium(subService.isPremium());
      if (restored) {
        Alert.alert('Purchases Restored', 'Your Sakina Pro subscription is active. Welcome back!');
      } else {
        Alert.alert('Nothing to Restore', 'We could not find an active subscription for this store account.');
      }
    } catch (error) {
      logServiceError('SettingsScreen', 'restorePurchases', error instanceof Error ? error : new Error(String(error)));
      Alert.alert('Error', 'Could not restore purchases. Please check your connection and try again.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <LinearGradient colors={['#07111E', '#0C1A2E', '#0F1519']} style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.xl) }]}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={onNavigateToMoodHistory}
            activeOpacity={0.7}
          >
            <Icon name="flame" size={28} color="#F59E0B" />
            <Text style={styles.statValue}>{streakDays}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={onNavigateToReflections}
            activeOpacity={0.7}
          >
            <Icon name="chat" size={28} color="#8B5CF6" />
            <Text style={styles.statValue}>{reflectionCount}</Text>
            <Text style={styles.statLabel}>Reflections</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={onNavigateToMoodHistory}
            activeOpacity={0.7}
          >
            <Icon name="chart" size={28} color="#3B82F6" />
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>SAKINA PRO</Text>
        <View style={styles.section}>
          <SettingRow
            label="Support Sakina"
            icon="heart-outline"
            value={isPremium ? 'Pro · Active' : undefined}
            onPress={() => navigation.navigate('Support')}
          />
          <SettingRow
            label={restoring ? 'Restoring…' : 'Restore Purchases'}
            icon="card-outline"
            onPress={handleRestorePurchases}
          />
        </View>

        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.section}>
          <SettingRow label="Daily Reminders" icon="notifications-outline" onPress={onNavigateToDailyReminders} />
          <SettingRow
            label="Translation Source"
            icon="book-outline"
            value="Sahih International"
          />
        </View>

        <Text style={styles.sectionTitle}>DATA & PRIVACY</Text>
        <View style={styles.section}>
          <SettingRow
            label="Share Crash Reports"
            icon="analytics-outline"
            showToggle={true}
            toggleValue={analyticsEnabled}
            onToggle={async (val) => {
              setAnalyticsEnabled(val);
              await setAnalyticsConsent(val);
            }}
          />
          <SettingRow label="Reset App Content" icon="refresh-outline" onPress={handleContentReset} />
          <SettingRow
            label="Clear Mood History"
            icon="trash-outline"
            isDestructive={true}
            onPress={() =>
              Alert.alert(
                'Clear Mood History',
                'This will permanently delete all your mood check-ins and guidance history. Your saved reflections will NOT be deleted. Continue?',
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
              )
            }
          />
          <SettingRow label="Privacy Policy" icon="shield-checkmark-outline" onPress={() => Alert.alert('Privacy Policy', 'Your data is stored locally on your device. We do not share your personal information with third parties.')} />
        </View>

        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <View style={styles.section}>
          <SettingRow label="Send Feedback" icon="mail-outline" onPress={() => Alert.alert('Coming Soon', 'Feedback feature will be available in the next update.')} />
          <SettingRow label="Help Center" icon="help-circle-outline" onPress={() => Alert.alert('Coming Soon', 'Help center will be available in the next update.')} />
          <SettingRow label="Contact Us" icon="chatbox-outline" onPress={() => Alert.alert('Contact', 'Email us at support@sakinaapp.com')} />
          <SettingRow label="Rate App" icon="star-outline" onPress={() => Alert.alert('Coming Soon', 'App Store rating will be available after launch.')} />
        </View>

        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.section}>
          {user ? (
            <>
              <SettingRow label="Email" value={user.email ?? 'No email'} icon="mail-outline" />
              <SettingRow
                label="Sign Out"
                icon="log-out-outline"
                isDestructive={true}
                onPress={() => {
                  Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign Out', style: 'destructive', onPress: signOut },
                  ]);
                }}
              />
            </>
          ) : (
            <SettingRow
              label="Sign In / Create Account"
              icon="person-outline"
              onPress={() => {
                Alert.alert('Sign In', 'Exit guest mode to sign in or create an account?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Continue', onPress: signOut },
                ]);
              }}
            />
          )}
        </View>

        <Text style={styles.sectionTitle}>── ABOUT ──</Text>
        <View style={styles.section}>
          <SettingRow
            label="Sources & Attribution"
            icon="library-outline"
            onPress={() => {
              Alert.alert(
                'Sources & Attribution',
                '• Quranic Text: Tanzil.net\n• Translations: Sahih International\n• Hadith: Authentic Collections (Bukhari, Muslim, Tirmidhi, Abu Dawud)\n• Tafsir: Ibn Kathir, As-Sa\'di, Ibn al-Qayyim',
              );
            }}
          />
          <SettingRow label="App Version" icon="information-circle-outline" value="1.0.0" />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Sakina v1.0.0</Text>
          <Text style={styles.footerSubtext}>Refining the soul, one verse at a time.</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    fontFamily: Typography.fonts.serif,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent.primary,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 16,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIconGap: {
    marginRight: Spacing.sm,
    width: 20,
  },
  rowLabel: {
    fontSize: 16,
    color: Colors.text.primary,
  },
  destructiveText: {
    color: '#FF4D4D',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    marginRight: 8,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.2)',
    fontStyle: 'italic',
  },
});
