import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FreemiumService } from '../services/freemiumService';
import { useState, useEffect } from 'react';
import { resetDatabase, initializeDatabase, refreshContentOnly } from '../database/schema';

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
          trackColor={{ false: '#3e3e3e', true: '#2ED3C6' }}
          thumbColor="#f4f3f4"
        />
      ) : onPress ? (
        <Text style={styles.chevron}>›</Text>
      ) : null}
    </View>
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [freemiumService] = useState(() => FreemiumService.getInstance());
  const [isPremium, setIsPremium] = useState(freemiumService.isPremium());
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(false);

  useEffect(() => {
    setIsPremium(freemiumService.isPremium());
  }, [freemiumService]);

  const handleCancelSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'Your premium access is active. Would you like to turn off auto-renewal? You will keep access until the end of your billing period.',
      [
        { text: 'Keep Premium', style: 'cancel' },
        {
          text: 'Turn Off Renewal',
          style: 'destructive',
          onPress: async () => {
            const success = await freemiumService.cancelSubscription();
            if (success) {
              Alert.alert(
                'Renewal Off',
                'Auto-renewal has been turned off. You will return to the free tier at the end of your period.',
              );
            }
          },
        },
      ],
    );
  };

  const handleRestore = async () => {
    try {
      const success = await freemiumService.restorePurchase();
      if (success) {
        setIsPremium(true);
        Alert.alert('Success', 'Your premium access has been restored! ✨');
      } else {
        Alert.alert('Restore Failed', 'No active premium subscription found for this account.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while restoring. Please try again.');
    }
  };

  const handleDebugReset = async () => {
    Alert.alert(
      'Debug Reset',
      'This will instantly return you to the free tier for testing. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Free',
          style: 'destructive',
          onPress: async () => {
            await freemiumService.resetToFreeTier();
            setIsPremium(false);
            Alert.alert('Reset Complete', 'You are now on the free tier.');
          },
        },
      ],
    );
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
            } catch (error) {
              Alert.alert('Error', 'Failed to refresh content. Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.section}>
          <SettingRow
            label="Plan"
            icon="💎"
            value={isPremium ? 'Premium' : 'Free Tier'}
            onPress={isPremium ? handleCancelSubscription : undefined}
          />
          {!isPremium && (
            <TouchableOpacity style={styles.upgradeSection} onPress={() => {}}>
              <Text style={styles.upgradeText}>Upgrade to Quiet Heart Premium</Text>
              <Text style={styles.upgradeChevron}>›</Text>
            </TouchableOpacity>
          )}
          <SettingRow label="Member Since" icon="📅" value="Jan 2024" />
          <SettingRow label="Restore Purchase" icon="🔄" onPress={handleRestore} />
          <SettingRow
            label="Debug: Reset to Free"
            icon="🛠️"
            onPress={handleDebugReset}
            isDestructive={true}
          />
        </View>

        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.section}>
          <SettingRow
            label="Dark Mode"
            icon="🌙"
            showToggle={true}
            toggleValue={darkMode}
            onToggle={setDarkMode}
          />
          <SettingRow
            label="Notifications"
            icon="🔔"
            showToggle={true}
            toggleValue={notifications}
            onToggle={setNotifications}
          />
          <SettingRow
            label="Translation Source"
            icon="📖"
            value="Sahih International"
            onPress={() => {}}
          />
        </View>

        <Text style={styles.sectionTitle}>DATA & PRIVACY</Text>
        <View style={styles.section}>
          <SettingRow label="Reset App Content" icon="🔄" onPress={handleContentReset} />
          <SettingRow
            label="Clear Search History"
            icon="🗑️"
            isDestructive={true}
            onPress={() => {}}
          />
          <SettingRow label="Privacy Policy" icon="🛡️" onPress={() => {}} />
        </View>

        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <View style={styles.section}>
          <SettingRow label="Send Feedback" icon="✉️" onPress={() => {}} />
          <SettingRow label="Help Center" icon="❓" onPress={() => {}} />
          <SettingRow label="Contact Us" icon="📧" onPress={() => {}} />
          <SettingRow label="Rate App" icon="⭐" onPress={() => {}} />
        </View>

        <Text style={styles.sectionTitle}>────── ABOUT ──────</Text>
        <View style={styles.section}>
          <SettingRow
            label="Sources & Attribution"
            icon=""
            onPress={() => {
              Alert.alert(
                'Sources & Attribution',
                '• Quranic Text: Tanzil.net\n• Translations: Sahih International\n• Hadith: Sunnah.com API / Authentic Collections\n• Audio: Quran.com API (Mishary Rashid Alafasy)',
              );
            }}
          />
          <SettingRow label="App Version" icon="ℹ️" value="1.0.0" />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Quiet Heart v1.0.0</Text>
          <Text style={styles.footerSubtext}>Refining the soul, one verse at a time.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F12',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#11171D',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
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
    backgroundColor: '#1A232C',
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
    color: '#FFFFFF',
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
  upgradeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(46, 211, 198, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 211, 198, 0.2)',
  },
  upgradeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2ED3C6',
  },
  upgradeChevron: {
    fontSize: 20,
    color: '#2ED3C6',
  },
  chevron: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.2)',
    marginTop: -2,
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
