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
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList, MainTabParamList } from '../navigation/types';
import { logServiceError } from '../services/errorLoggingService';

import Icon from '../components/Icon';
import { refreshContentOnly } from '../database/schema';
import { SubscriptionService } from '../services/subscriptionService';
import { SupabaseDataService } from '../services/supabaseDataService';
import { backgroundThemeService } from '../services/backgroundThemeService';
import BackgroundThemePicker from '../components/BackgroundThemePicker';
import { BackgroundTheme } from '../types';
import { Colors } from '../theme/DesignSystem';

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
      {icon && <Text style={styles.rowIcon}>{icon}</Text>}
      <Text style={[styles.rowLabel, isDestructive && styles.destructiveText]}>{label}</Text>
    </View>
    <View style={styles.rowRight}>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {showToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: '#3e3e3e', true: Colors.accent.primary }}
          thumbColor="#f4f3f4"
        />
      ) : onPress ? (
        <Text style={styles.chevron}>›</Text>
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
  const [selectedTheme, setSelectedTheme] = useState<BackgroundTheme | null>(null);
  const [isThemePickerVisible, setIsThemePickerVisible] = useState(false);

  React.useEffect(() => {
    loadStats();
    loadThemePreferences();
  }, []);

  const loadThemePreferences = async () => {
    const isPrem = SubscriptionService.getInstance().isPremium();
    setIsPremium(isPrem);
    const theme = await backgroundThemeService.getSelectedTheme();
    setSelectedTheme(theme);
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

  const handleTogglePremium = async (value: boolean) => {
    try {
      const subService = SubscriptionService.getInstance();
      if (value) {
        // Mock a monthly subscription activation for debug purposes
        await subService.activatePremium('monthly');
      } else {
        await subService.resetToFreeTier();
      }
      setIsPremium(subService.isPremium());
    } catch (error) {
      logServiceError('SettingsScreen', 'togglePremium', error instanceof Error ? error : new Error(String(error)));
      Alert.alert('Error', 'Could not update subscription state.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
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

        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.section}>
          <SettingRow
            label="Premium Features"
            icon="💎"
            showToggle={true}
            toggleValue={isPremium}
            onToggle={handleTogglePremium}
          />
          <SettingRow
            label="Background Theme"
            icon="✨"
            value={selectedTheme?.name || 'Default'}
            onPress={() => setIsThemePickerVisible(true)}
          />
          <SettingRow label="Daily Reminders" icon="🔔" onPress={onNavigateToDailyReminders} />
          <SettingRow
            label="Translation Source"
            icon="📖"
            value="Sahih International"
          />
        </View>

        <Text style={styles.sectionTitle}>DATA & PRIVACY</Text>
        <View style={styles.section}>
          <SettingRow label="Reset App Content" icon="🔄" onPress={handleContentReset} />
          <SettingRow
            label="Clear Mood History"
            icon="🗑️"
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
          <SettingRow label="Privacy Policy" icon="🛡️" onPress={() => Alert.alert('Privacy Policy', 'Your data is stored locally on your device. We do not share your personal information with third parties.')} />
        </View>

        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <View style={styles.section}>
          <SettingRow label="Send Feedback" icon="✉️" onPress={() => Alert.alert('Coming Soon', 'Feedback feature will be available in the next update.')} />
          <SettingRow label="Help Center" icon="❓" onPress={() => Alert.alert('Coming Soon', 'Help center will be available in the next update.')} />
          <SettingRow label="Contact Us" icon="📧" onPress={() => Alert.alert('Contact', 'Email us at support@sakinaapp.com')} />
          <SettingRow label="Rate App" icon="⭐" onPress={() => Alert.alert('Coming Soon', 'App Store rating will be available after launch.')} />
        </View>

        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.section}>
          {user ? (
            <>
              <SettingRow label="Email" value={user.email ?? 'No email'} icon="📧" />
              <SettingRow
                label="Sign Out"
                icon="🚪"
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
              icon="👤"
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
            icon="📚"
            onPress={() => {
              Alert.alert(
                'Sources & Attribution',
                '• Quranic Text: Tanzil.net\n• Translations: Sahih International\n• Hadith: Authentic Collections (Bukhari, Muslim, Tirmidhi, Abu Dawud)\n• Tafsir: Ibn Kathir, As-Sa\'di, Ibn al-Qayyim',
              );
            }}
          />
          <SettingRow label="App Version" icon="ℹ️" value="1.0.0" />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Sakina v1.0.0</Text>
          <Text style={styles.footerSubtext}>Refining the soul, one verse at a time.</Text>
        </View>
      </ScrollView>

      <BackgroundThemePicker
        isVisible={isThemePickerVisible}
        isPremium={isPremium}
        selectedThemeId={selectedTheme?.id || null}
        onClose={() => setIsThemePickerVisible(false)}
        onSelectTheme={async (themeId) => {
          await backgroundThemeService.setSelectedTheme(themeId);
          const theme = await backgroundThemeService.getSelectedTheme();
          setSelectedTheme(theme);
          setIsThemePickerVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#14100C',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#1C1612',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#F5EDE3',
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
    color: '#2ED3C6',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 16,
  },
  section: {
    backgroundColor: '#241E19',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
  rowIcon: {
    fontSize: 15,
    marginRight: 10,
    width: 20,
    textAlign: 'center',
  },
  rowLabel: {
    fontSize: 16,
    color: '#F5EDE3',
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
  chevron: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.2)',
    marginTop: -2,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#241E19',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F5EDE3',
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
