import React, { useRef, useEffect } from 'react';
import { Colors } from '../theme/DesignSystem';
import { TouchableOpacity, Animated, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

function SunIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="4" fill={Colors.accent.primary} />
      <Path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke={Colors.accent.primary}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function MoonIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill={Colors.accent.primary}
        stroke={Colors.accent.primary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.7,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(spinAnim, {
      toValue: isDark ? 0 : 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [isDark]);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={styles.btn}
      activeOpacity={0.75}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="switch"
      accessibilityLabel="Dark mode"
      accessibilityState={{ checked: isDark }}
    >
      <Animated.View style={{ transform: [{ rotate }, { scale: scaleAnim }] }}>
        {isDark ? <MoonIcon size={17} /> : <SunIcon size={17} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.30)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});