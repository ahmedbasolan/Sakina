import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../theme/DesignSystem';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';

// Navigation Types
import { RootStackParamList, MainTabParamList } from './types';

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
import LockscreenVersesScreen from '../screens/LockscreenVersesScreen';
import MoodSelectionScreen from '../screens/MoodSelectionScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SurahReaderScreen from '../screens/SurahReaderScreen';
import SupportSakinaScreen from '../screens/SupportSakinaScreen';

// Services
import { HapticsService } from '../services/hapticsService';

const RootStack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ── Tab metadata ─────────────────────────────────────────────────────
const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Journeys: { active: 'compass', inactive: 'compass-outline' },
  Streak: { active: 'fire', inactive: 'fire' },
  Journal: { active: 'feather', inactive: 'feather' },
  Library: { active: 'book-open-variant', inactive: 'book-open-variant-outline' },
};

// ── Single animated tab item ─────────────────────────────────────────
function TabItem({
  routeName,
  focused,
  onPress,
  streakCount,
}: {
  routeName: string;
  focused: boolean;
  onPress: () => void;
  streakCount?: number;
}) {
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: focused ? 1 : 0,
      damping: 18,
      stiffness: 220,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  const icons = TAB_ICONS[routeName] ?? TAB_ICONS.Home;
  const iconName = focused ? icons.active : icons.inactive;
  const isStreak = routeName === 'Streak';
  const hasStreak = isStreak && typeof streakCount === 'number' && streakCount > 0;

  const iconColor = focused ? Colors.accent.primary : 'rgba(255,255,255,0.38)';
  const flameColor = focused ? Colors.accent.primary : `${Colors.accent.primary}6A`;

  const iconScale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] });

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={() => {
        HapticsService.impactAsync('LIGHT');
        onPress();
      }}
      activeOpacity={0.8}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
    >
      <View style={styles.iconArea}>
        {/* Icon */}
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <MaterialCommunityIcons
            name={iconName as any}
            size={22}
            color={isStreak ? flameColor : iconColor}
          />
        </Animated.View>

        {/* Streak count badge */}
        {hasStreak && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakBadgeText}>{streakCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Custom tab bar ────────────────────────────────────────────────────
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { streakCount } = useAppContext();
  const bottomEdge = Math.max(20, (insets?.bottom ?? 0) + 8);

  return (
    <View style={[styles.tabBarOuter, { bottom: bottomEdge }]} pointerEvents="box-none">
      <View style={styles.pill}>
        {/* Frosted-glass surface — clipped to the pill's rounded shape. Sits
            behind the tab items; the floating labels still overflow the pill. */}
        {/* `experimentalBlurMethod` is what makes this actually blur on
            Android — without it expo-blur falls back to a flat translucent
            fill there, which is why the pill read as a dim rectangle over
            scrolling content instead of frosted glass. iOS ignores the prop
            and uses its native blur either way. */}
        <BlurView
          intensity={48}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          style={styles.pillBlur}
          pointerEvents="none"
        />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              focused={focused}
              streakCount={route.name === 'Streak' ? streakCount : undefined}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

// ── Main tab navigator ────────────────────────────────────────────────
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Journeys" component={PathsScreen} />
      <Tab.Screen name="Streak" component={MoodHistoryCalendarScreen} />
      <Tab.Screen name="Journal" component={ReflectionHistoryScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
    </Tab.Navigator>
  );
}

// ── Root navigator ────────────────────────────────────────────────────
export default function MainNavigator() {
  const { user, isGuest, loading } = useAuth();

  if (loading) return <View style={{ flex: 1, backgroundColor: Colors.background.primary }} />;

  return (
    <RootStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={!user && !isGuest ? 'Onboarding' : 'Main'}
    >
      {!user && !isGuest ? (
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
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
          <RootStack.Screen name="LockscreenVerses" component={LockscreenVersesScreen} />
          <RootStack.Screen name="Settings" component={SettingsScreen} />
          <RootStack.Screen name="SurahReader" component={SurahReaderScreen} />
          <RootStack.Screen name="Support" component={SupportSakinaScreen} />
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="SignUp" component={SignUpScreen} />
        </>
      )}
    </RootStack.Navigator>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Outer wrapper — overflow visible so the pill's drop shadow renders
  tabBarOuter: {
    position: 'absolute',
    left: 36,
    right: 36,
    overflow: 'visible',
  },

  // The floating pill — frosted glass. No overflow:hidden here so the shadow
  // renders; the BlurView clips itself to the rounded shape.
  pill: {
    flexDirection: 'row',
    // Subtle base fill so iOS casts the shadow (a fully transparent view may not)
    // and so the pill still reads if BlurView is unavailable (e.g. some Androids).
    backgroundColor: 'rgba(7, 15, 26, 0.58)',
    borderRadius: BorderRadius.full,
    height: 60,
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    borderWidth: 1,
    // Brighter than the surface it sits on so the pill reads as a raised sheet
    // of glass with a lit edge, not a hole cut in the background.
    borderColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    // Deeper and wider than before: the shadow is what separates the pill from
    // the list scrolling underneath it, and at 0.45/20 the two were merging.
    shadowOpacity: 0.6,
    shadowRadius: 26,
    elevation: 24,
  },
  // Clipped frosted surface filling the pill, with a translucent navy tint over
  // the blur for contrast against bright content scrolling beneath.
  pillBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    backgroundColor: 'rgba(7, 15, 26, 0.42)',
  },

  // Each tab's touch target
  tabItem: {
    flex: 1,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Icon area — fixed size so animations don't affect sibling layout
  iconArea: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Streak count badge
  streakBadge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0A121C',
    letterSpacing: 0.2,
  },
});
