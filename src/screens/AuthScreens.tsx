/**
 * Auth Screens — Login & Sign Up
 *
 * Warm Arabian Sanctuary aesthetic: navy gradient, twinkling stars,
 * gold-accented glass card, crescent emblem.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BorderRadius, Colors, Spacing, Typography } from '../theme/DesignSystem';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthService } from '../services/authService';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { LEGAL_URLS } from '../constants';
import * as Haptics from 'expo-haptics';
import { InteractiveStarfield } from '../components/onboarding/InteractiveStarfield';

const { width, height } = Dimensions.get('window');

// --- Geometric background pattern ---
const PATTERN_CELL = 48;
const COLS = Math.ceil(width / PATTERN_CELL) + 1;
const ROWS = Math.ceil(height / PATTERN_CELL) + 1;

function miniStar(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.42;
    const x = cx + rad * Math.cos(angle);
    const y = cy + rad * Math.sin(angle);
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ') + ' Z';
}

const PATTERN_STARS = (() => {
  const paths: string[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cx = col * PATTERN_CELL + (row % 2 === 0 ? 0 : PATTERN_CELL / 2);
      const cy = row * PATTERN_CELL;
      paths.push(miniStar(cx, cy, 8));
    }
  }
  return paths;
})();

// Twinkling stars — hoisted to module scope so array reference is stable.
const AUTH_STARS = [
  { x: 0.07, y: 0.05, size: 2.5, delay: 0 },
  { x: 0.90, y: 0.04, size: 2,   delay: 500 },
  { x: 0.18, y: 0.16, size: 1.5, delay: 250 },
  { x: 0.82, y: 0.12, size: 2,   delay: 750 },
  { x: 0.50, y: 0.08, size: 1.5, delay: 100 },
  { x: 0.12, y: 0.32, size: 1.5, delay: 400 },
  { x: 0.92, y: 0.28, size: 2,   delay: 650 },
];

interface AuthScreenProps {
  navigation: {
    navigate: (screen: string) => void;
  };
  onLogin?: () => void;
  onSignUp?: () => void;
}

// ==================== SHARED BACKGROUND ====================
function AuthBackground({ children, patternOpacity }: { children: React.ReactNode; patternOpacity: Animated.Value }) {
  return (
    <LinearGradient colors={Colors.celestialWash} style={styles.gradient}>
      {/* Twinkling stars — visual continuity with onboarding */}
      <InteractiveStarfield positions={AUTH_STARS} />

      {/* Geometric star pattern */}
      <Animated.View style={[styles.patternLayer, { opacity: patternOpacity }]} pointerEvents="none">
        <Svg width={width} height={height}>
          <Defs>
            <SvgLinearGradient id="patGold" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={Colors.accent.primary} stopOpacity="0.06" />
              <Stop offset="1" stopColor={Colors.accent.primary} stopOpacity="0.03" />
            </SvgLinearGradient>
          </Defs>
          {PATTERN_STARS.map((d, i) => (
            <Path key={i} d={d} fill="url(#patGold)" />
          ))}
        </Svg>
      </Animated.View>

      {/* Top radial glow */}
      <View style={styles.topGlow} pointerEvents="none" />

      {children}
    </LinearGradient>
  );
}

// ==================== SHARED COMPONENTS ====================
function GoldDivider({ text }: { text: string }) {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <View style={styles.dividerCenter}>
        <View style={styles.dividerDiamond} />
        <Text style={styles.dividerText}>{text}</Text>
        <View style={styles.dividerDiamond} />
      </View>
      <View style={styles.dividerLine} />
    </View>
  );
}

function AuthInput({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  trailing,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address' | 'default';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  trailing?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [focused]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.5)'],
  });

  return (
    <Animated.View style={[styles.inputContainer, { borderColor }]}>
      {icon}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
        placeholderTextColor="rgba(245, 237, 227, 0.25)"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {trailing}
    </Animated.View>
  );
}

// ==================== LOGIN SCREEN ====================
export function LoginScreen({ navigation, onLogin }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const { enterGuestMode } = useAuth();
  const authService = AuthService.getInstance();
  const handleGuestMode = useCallback(async () => { await enterGuestMode(); }, [enterGuestMode]);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const patternPulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(logoSlide, { toValue: 0, damping: 18, stiffness: 80, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(formSlide, { toValue: 0, damping: 20, stiffness: 80, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(800),
      Animated.timing(footerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(patternPulse, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(patternPulse, { toValue: 0.4, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleSignIn = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await authService.signInWithEmail(trimmedEmail, password);
      if (onLogin) onLogin();
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      Alert.alert('Reset Password', 'Please enter your email address first, then tap "Forgot password?"');
      return;
    }
    Alert.alert(
      'Reset Password',
      `Send a password reset link to ${email.trim()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await authService.sendPasswordResetEmail(email.trim());
              Alert.alert('Email Sent', 'Check your inbox for the password reset link.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not send reset email.');
            }
          },
        },
      ],
    );
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const session = await authService.signInWithGoogle();
      // null = user dismissed the browser; the auth listener handles success nav.
      if (session && onLogin) onLogin();
    } catch (error: any) {
      Alert.alert('Google Sign-In Failed', error?.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await authService.signInWithApple();
      if (onLogin) onLogin();
    } catch (error: any) {
      // Swallow the user-cancelled case; only surface real failures.
      if (error?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Sign-In Failed', error?.message || 'Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <AuthBackground patternOpacity={patternPulse}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View
            style={[styles.headerWrap, { opacity: logoOpacity, transform: [{ translateY: logoSlide }] }]}
          >
            <View style={styles.emblemWrap}>
              <View style={styles.emblemGlow} />
              <Svg width={64} height={64} viewBox="0 0 52 52">
                <Defs>
                  <SvgLinearGradient id="emblemGold" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#E5C07B" />
                    <Stop offset="1" stopColor={Colors.accent.primary} />
                  </SvgLinearGradient>
                </Defs>
                <Path
                  d="M26 4 A22 22 0 1 0 26 48 A17 17 0 1 1 26 4 Z"
                  fill="url(#emblemGold)"
                  opacity={0.9}
                />
                <Path
                  d={fivePointStarPath(38, 12, 5, 2.2)}
                  fill="#E5C07B"
                />
              </Svg>
            </View>

            <Text style={styles.heroTitle}>Welcome Back</Text>
            <Text style={styles.heroSubtitle}>Continue your spiritual journey</Text>
          </Animated.View>

          {/* Form card */}
          <Animated.View
            style={[styles.formCard, { opacity: formOpacity, transform: [{ translateY: formSlide }] }]}
          >
            <Text style={styles.inputLabel}>Email</Text>
            <AuthInput
              icon={<MailIcon size={18} color="rgba(212, 175, 55, 0.6)" />}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Password</Text>
            <AuthInput
              icon={<LockIcon size={18} color="rgba(212, 175, 55, 0.6)" />}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              trailing={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  {showPassword ? (
                    <EyeOffIcon size={18} color="rgba(245, 237, 227, 0.4)" />
                  ) : (
                    <EyeIcon size={18} color="rgba(245, 237, 227, 0.4)" />
                  )}
                </TouchableOpacity>
              }
            />

            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} onPress={handleSignIn} disabled={isLoading}>
              <LinearGradient colors={['#E8C84A', '#B8860B']} style={styles.primaryBtn}>
                {isLoading ? (
                  <ActivityIndicator color="#0C1A2E" />
                ) : (
                  <Text style={styles.primaryBtnText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <GoldDivider text="Or continue with" />

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialBtn}
                activeOpacity={0.8}
                onPress={handleGoogleAuth}
                disabled={isLoading}
              >
                <GoogleIcon size={18} />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.socialBtn}
                  activeOpacity={0.8}
                  onPress={handleAppleAuth}
                  disabled={isLoading}
                >
                  <AppleIcon size={18} fill="#F5EDE3" />
                  <Text style={styles.socialBtnText}>Apple</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.guestBtn} activeOpacity={0.7} onPress={handleGuestMode}>
              <Text style={styles.guestBtnText}>Continue as Guest</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer link */}
          <Animated.View style={[styles.footerRow, { opacity: footerOpacity }]}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.footerLink}>Create one</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </AuthBackground>
    </KeyboardAvoidingView>
  );
}

// ==================== SIGN UP SCREEN ====================
export function SignUpScreen({ navigation, onSignUp }: AuthScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const { enterGuestMode } = useAuth();
  const authService = AuthService.getInstance();
  const handleGuestMode = useCallback(async () => { await enterGuestMode(); }, [enterGuestMode]);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const patternPulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(logoSlide, { toValue: 0, damping: 18, stiffness: 80, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(formSlide, { toValue: 0, damping: 20, stiffness: 80, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(800),
      Animated.timing(footerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(patternPulse, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(patternPulse, { toValue: 0.4, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleCreateAccount = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
      return;
    }
    if (!agreeTerms) {
      Alert.alert('Error', 'Please agree to the Terms and Privacy Policy.');
      return;
    }
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await authService.signUpWithEmail(trimmedEmail, password, trimmedName);
      Alert.alert(
        'Success',
        'Your account has been created. Please check your email for verification.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
      );
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // OAuth sign-up is immediate (no email verification step) — the auth listener
  // routes into the app on success, so these mirror the Login handlers.
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const session = await authService.signInWithGoogle();
      if (session && onSignUp) onSignUp();
    } catch (error: any) {
      Alert.alert('Google Sign-In Failed', error?.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await authService.signInWithApple();
      if (onSignUp) onSignUp();
    } catch (error: any) {
      if (error?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Sign-In Failed', error?.message || 'Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = agreeTerms && !isLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <AuthBackground patternOpacity={patternPulse}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.xl }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View
            style={[styles.headerWrap, { opacity: logoOpacity, transform: [{ translateY: logoSlide }] }]}
          >
            <View style={styles.emblemWrap}>
              <View style={styles.emblemGlow} />
              <Svg width={64} height={64} viewBox="0 0 52 52">
                <Defs>
                  <SvgLinearGradient id="emblemGold2" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor="#E5C07B" />
                    <Stop offset="1" stopColor={Colors.accent.primary} />
                  </SvgLinearGradient>
                </Defs>
                <Path
                  d="M26 4 A22 22 0 1 0 26 48 A17 17 0 1 1 26 4 Z"
                  fill="url(#emblemGold2)"
                  opacity={0.9}
                />
                <Path
                  d={fivePointStarPath(38, 12, 5, 2.2)}
                  fill="#E5C07B"
                />
              </Svg>
            </View>

            <Text style={styles.heroTitle}>Begin Your Journey</Text>
            <Text style={styles.heroSubtitle}>Create your account with purpose</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[styles.formCard, { opacity: formOpacity, transform: [{ translateY: formSlide }] }]}
          >
            <Text style={styles.inputLabel}>Full Name</Text>
            <AuthInput
              icon={<UserIcon size={18} color="rgba(212, 175, 55, 0.6)" />}
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.inputLabel}>Email</Text>
            <AuthInput
              icon={<MailIcon size={18} color="rgba(212, 175, 55, 0.6)" />}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Password</Text>
            <AuthInput
              icon={<LockIcon size={18} color="rgba(212, 175, 55, 0.6)" />}
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              trailing={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  {showPassword ? (
                    <EyeOffIcon size={18} color="rgba(245, 237, 227, 0.4)" />
                  ) : (
                    <EyeIcon size={18} color="rgba(245, 237, 227, 0.4)" />
                  )}
                </TouchableOpacity>
              }
            />
            <Text style={styles.passwordHint}>At least 8 characters with numbers and symbols</Text>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreeTerms(!agreeTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <CheckIcon size={14} color="#0C1A2E" />}
              </View>
              <Text style={styles.checkboxText}>
                I agree to the{' '}
                <Text
                  style={styles.linkText}
                  onPress={() => Linking.openURL(LEGAL_URLS.terms).catch(() => Alert.alert('Could not open link', 'Please try again later.'))}
                >Terms of Service</Text>
                {' '}and{' '}
                <Text
                  style={styles.linkText}
                  onPress={() => Linking.openURL(LEGAL_URLS.privacy).catch(() => Alert.alert('Could not open link', 'Please try again later.'))}
                >Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.85} disabled={!canSubmit} onPress={handleCreateAccount}>
              <LinearGradient
                colors={canSubmit ? ['#E8C84A', '#B8860B'] : ['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.08)']}
                style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#0C1A2E" />
                ) : (
                  <Text style={[styles.primaryBtnText, !canSubmit && styles.primaryBtnTextDisabled]}>
                    Create Account
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <GoldDivider text="Or sign up with" />

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialBtn}
                activeOpacity={0.8}
                onPress={handleGoogleAuth}
                disabled={isLoading}
              >
                <GoogleIcon size={18} />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.socialBtn}
                  activeOpacity={0.8}
                  onPress={handleAppleAuth}
                  disabled={isLoading}
                >
                  <AppleIcon size={18} fill="#F5EDE3" />
                  <Text style={styles.socialBtnText}>Apple</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.guestBtn} activeOpacity={0.7} onPress={handleGuestMode}>
              <Text style={styles.guestBtnText}>Continue as Guest</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <Animated.View style={[styles.footerRow, { opacity: footerOpacity }]}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </AuthBackground>
    </KeyboardAvoidingView>
  );
}

// ==================== HELPER ====================
function fivePointStarPath(cx: number, cy: number, outerR: number, innerR: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return pts.join(' ') + ' Z';
}

// ==================== ICON COMPONENTS ====================
function MailIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth="2" />
      <Path d="M22 6l-10 7L2 6" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function LockIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 11H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2z" stroke={color} strokeWidth="2" />
      <Path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function UserIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function EyeIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function EyeOffIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
        stroke={color}
        strokeWidth="2"
      />
      <Path d="M1 1l22 22" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function CheckIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GoogleIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </Svg>
  );
}

function AppleIcon({ size, fill = '#000' }: { size: number; fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={fill}
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      />
    </Svg>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  patternLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  topGlow: {
    position: 'absolute',
    top: -80,
    alignSelf: 'center',
    width: width * 0.8,
    height: 200,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(212, 175, 55, 0.10)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  // --- Header ---
  headerWrap: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  emblemWrap: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemGlow: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  heroTitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.hero,
    color: '#F5EDE3',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.small,
    color: 'rgba(245, 237, 227, 0.45)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // --- Form card ---
  formCard: {
    backgroundColor: 'rgba(245, 237, 227, 0.04)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    fontSize: Typography.sizes.detail,
    fontWeight: '600',
    color: 'rgba(245, 237, 227, 0.5)',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 237, 227, 0.04)',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
    marginBottom: Spacing.lg,
  },
  input: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: Typography.sizes.body,
    color: '#F5EDE3',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.xl,
  },
  forgotText: {
    fontSize: Typography.sizes.detail,
    color: Colors.accent.primary,
    letterSpacing: 0.3,
  },
  // --- Primary button ---
  primaryBtn: {
    borderRadius: BorderRadius.lg,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.body,
    fontWeight: '700',
    color: '#0C1A2E',
    letterSpacing: 0.5,
  },
  primaryBtnTextDisabled: {
    color: 'rgba(245, 237, 227, 0.3)',
  },
  // --- Divider ---
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  dividerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  dividerDiamond: {
    width: 4,
    height: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.4)',
    transform: [{ rotate: '45deg' }],
  },
  dividerText: {
    fontSize: Typography.sizes.detail,
    color: 'rgba(245, 237, 227, 0.35)',
    letterSpacing: 0.4,
  },
  // --- Social buttons ---
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 237, 227, 0.08)',
    backgroundColor: 'rgba(245, 237, 227, 0.04)',
  },
  socialBtnText: {
    fontSize: Typography.sizes.small,
    fontWeight: '600',
    color: 'rgba(245, 237, 227, 0.7)',
    letterSpacing: 0.3,
  },
  // --- Guest button ---
  guestBtn: {
    marginTop: Spacing.lg,
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtnText: {
    fontSize: Typography.sizes.small,
    fontWeight: '600',
    color: Colors.accent.primary,
    letterSpacing: 0.4,
  },
  // --- Footer ---
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  footerText: {
    fontSize: Typography.sizes.small,
    color: 'rgba(245, 237, 227, 0.4)',
  },
  footerLink: {
    fontSize: Typography.sizes.small,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
  // --- Sign Up specific ---
  passwordHint: {
    fontSize: Typography.sizes.detail,
    color: 'rgba(245, 237, 227, 0.3)',
    marginBottom: Spacing.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 237, 227, 0.04)',
  },
  checkboxChecked: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: Typography.sizes.detail,
    color: 'rgba(245, 237, 227, 0.5)',
    lineHeight: 18,
  },
  linkText: {
    color: Colors.accent.primary,
    fontWeight: '500',
  },
});

export default { LoginScreen, SignUpScreen };
