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
import SurahReaderScreen from '../screens/SurahReaderScreen';
import SupportSakinaScreen from '../screens/SupportSakinaScreen';

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

// ── Tab metadata ─────────────────────────────────────────────────────
const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Journeys: { active: 'compass', inactive: 'compass-outline' },
  Streak: { active: 'fire', inactive: 'fire' },
  Journal: { active: 'feather', inactive: 'feather' },
  Library: { active: 'book-open-variant', inactive: 'book-open-variant-outline' },
};

const TAB_LABELS: Record<string, string> = {
  Home: 'Home',
  Journeys: 'Paths',
  Streak: 'Streak',
  Journal: 'Journal',
  Library: 'Library',
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

  // Static colors — icon name already switches on focus; color is a simple
  // boolean switch so we keep useNativeDriver: true on all other animations.
  const iconColor = focused ? '#FFFFFF' : 'rgba(255,255,255,0.38)';
  const flameColor = focused ? '#F59E0B' : 'rgba(245,158,11,0.42)';

  // Derived animated values — all useNativeDriver: true (transform/opacity only)
  const iconScale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const iconRise = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
  const highlightScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const highlightAlpha = anim.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 0.55, 1] });
  const labelAlpha = anim.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 0, 1] });
  const labelRise = anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

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
      {/* Floating label chip — pops above the pill */}
      <Animated.View
        style={[styles.labelChip, { opacity: labelAlpha, transform: [{ translateY: labelRise }] }]}
        pointerEvents="none"
      >
        <Text style={styles.labelChipText}>{TAB_LABELS[routeName]}</Text>
      </Animated.View>

      {/* Icon area */}
      <View style={styles.iconArea}>
        {/* Highlight disc — scales in from centre */}
        <Animated.View
          style={[
            styles.highlightGlow,
            { opacity: highlightAlpha, transform: [{ scale: highlightScale }] },
          ]}
          pointerEvents="none"
        >
          <View style={styles.highlightDisc} />
        </Animated.View>

        {/* Icon — scales up and rises slightly */}
        <Animated.View style={{ transform: [{ scale: iconScale }, { translateY: iconRise }] }}>
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
        <BlurView intensity={30} tint="dark" style={styles.pillBlur} pointerEvents="none" />
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

  if (loading) return null;

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
          <RootStack.Screen name="SurahReader" component={SurahReaderScreen} />
          <RootStack.Screen name="Support" component={SupportSakinaScreen} />
        </>
      )}
    </RootStack.Navigator>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Outer wrapper — overflow visible so labels float above the pill
  tabBarOuter: {
    position: 'absolute',
    left: 36,
    right: 36,
    overflow: 'visible',
  },

  // The floating pill — frosted glass. No overflow:hidden here so the floating
  // labels can pop above it and the shadow still renders; the BlurView clips
  // itself to the rounded shape.
  pill: {
    flexDirection: 'row',
    // Subtle base fill so iOS casts the shadow (a fully transparent view may not)
    // and so the pill still reads if BlurView is unavailable (e.g. some Androids).
    backgroundColor: 'rgba(10, 18, 28, 0.4)',
    borderRadius: BorderRadius.full,
    height: 60,
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 20,
  },
  // Clipped frosted surface filling the pill, with a translucent navy tint over
  // the blur for contrast against bright content scrolling beneath.
  pillBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    backgroundColor: 'rgba(10, 18, 28, 0.3)',
  },

  // Each tab's touch target — fills pill height, overflows upward for label
  tabItem: {
    flex: 1,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },

  // Floating label chip above the pill
  labelChip: {
    position: 'absolute',
    top: -28,
    alignSelf: 'center',
    backgroundColor: 'rgba(12, 22, 38, 0.95)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  labelChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.primary,
    letterSpacing: 0.4,
  },

  // Icon area — fixed size so animations don't affect sibling layout
  iconArea: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Outer glow wrapper — shadow doesn't get clipped
  highlightGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  // Solid disc — clearly visible against the dark pill
  highlightDisc: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
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
    backgroundColor: '#F59E0B',
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
