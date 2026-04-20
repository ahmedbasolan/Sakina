import React, { useContext } from 'react';
import { Colors } from '../theme/DesignSystem';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon, { IconName } from '../components/Icon';
import StreakCenterTab from '../components/StreakCenterTab';
import { useAuth } from '../context/AuthContext';
import { moodHistoryService } from '../services/moodHistoryService';

// Navigation Types
import { RootStackParamList, AuthStackParamList, MainTabParamList } from './types';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import { LoginScreen, SignUpScreen } from '../screens/AuthScreens';
import HomeScreen from '../screens/HomeScreen';
import PathsScreen from '../screens/PathsScreen';
import ReflectionHistoryScreen from '../screens/ReflectionHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import GuidanceScreen from '../screens/GuidanceScreen';
import { PathDetailScreen } from '../screens/PathDetailScreen';
import { PathStepScreen } from '../screens/PathStepScreen';
import PrayerTimesScreen from '../screens/PrayerTimesScreen';
import QuranLibraryScreen from '../screens/QuranLibraryScreen';
import MoodHistoryCalendarScreen from '../screens/MoodHistoryCalendarScreen';
import DailyRemindersScreen from '../screens/DailyRemindersScreen';
import MoodSelectionScreen from '../screens/MoodSelectionScreen';
import LibraryScreen from '../screens/LibraryScreen';

// Services
import { HapticsService } from '../services/hapticsService';

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

// Tab label map
const TAB_LABELS: Record<string, string> = {
  Home: 'HOME',
  Journeys: 'JOURNEYS',
  Streak: '',
  Journal: 'JOURNAL',
  Library: 'LIBRARY',
};

const CustomTabButton = (props: any) => {
  const { accessibilityState, onPress, routeName, style, streakCount } = props;
  const focused = accessibilityState?.selected ?? false;
  const animatedValue = React.useRef(new Animated.Value(focused ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
      damping: 15,
      stiffness: 150,
    }).start();
  }, [focused]);

  const handlePress = () => {
    HapticsService.impactAsync('LIGHT');
    onPress();
  };

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  const getIcon = (name: string): IconName => {
    switch (name) {
      case 'Home': return 'home';
      case 'Journeys': return 'compass';
      case 'Journal': return 'pen';
      case 'Library': return 'book-quran';
      default: return 'chat';
    }
  };

  // Center Streak tab — special elevated treatment
  if (routeName === 'Streak') {
    return (
      <TouchableOpacity
        style={[styles.tabButton, style, styles.centerTabButton]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <StreakCenterTab focused={focused} streakCount={streakCount} />
      </TouchableOpacity>
    );
  }

  const activeColor = focused ? Colors.accent.primary : 'rgba(255,255,255,0.38)';

  return (
    <TouchableOpacity style={[styles.tabButton, style]} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.tabContent}>
        <Animated.View style={{ transform: [{ translateY }] }}>
          <Icon name={getIcon(routeName)} size={22} color={activeColor} />
        </Animated.View>
        <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
          {TAB_LABELS[routeName] || routeName.toUpperCase()}
        </Text>
        {/* Active indicator dot */}
        <Animated.View
          style={[
            styles.activeDot,
            { opacity: animatedValue, transform: [{ scale: animatedValue }] },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets?.bottom ?? 0;
  const [streakCount, setStreakCount] = React.useState<number>(0);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stats = await moodHistoryService.getStats();
        if (!cancelled) setStreakCount(stats.currentStreak);
      } catch {
        if (!cancelled) setStreakCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: [styles.bottomTabBar, { bottom: Math.max(16, bottomInset + 6) }],
        tabBarButton: (props) => (
          <CustomTabButton
            {...props}
            routeName={route.name}
            streakCount={route.name === 'Streak' ? streakCount : undefined}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Journeys" component={PathsScreen} />
      <Tab.Screen name="Streak" component={MoodHistoryCalendarScreen} />
      <Tab.Screen name="Journal" component={ReflectionHistoryScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const { user, isGuest, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!user && !isGuest ? (
        <>
          <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        </>
      ) : (
        <>
          <RootStack.Screen name="Main" component={MainTabNavigator} />
          <RootStack.Screen name="Guidance" component={GuidanceScreen} />
          <RootStack.Screen name="MoodSelection" component={MoodSelectionScreen} />
          <RootStack.Screen name="PathDetail" component={PathDetailScreen} />
          <RootStack.Screen name="PathStep" component={PathStepScreen} />
          <RootStack.Screen name="PrayerTimes" component={PrayerTimesScreen} />
          <RootStack.Screen name="QuranLibrary" component={QuranLibraryScreen} />
          <RootStack.Screen name="MoodHistory" component={MoodHistoryCalendarScreen} />
          <RootStack.Screen name="DailyReminders" component={DailyRemindersScreen} />
          <RootStack.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  bottomTabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(10, 18, 28, 0.96)',
    borderRadius: 30,
    height: 68,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    zIndex: 1000,
    elevation: 20,
    paddingBottom: 0,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTabButton: {
    // No flex constraint — let NoorCenterTab define its size
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.8,
    marginTop: 1,
  },
  tabLabelActive: {
    color: Colors.accent.primary,
  },
  activeDot: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent.primary,
  },
});