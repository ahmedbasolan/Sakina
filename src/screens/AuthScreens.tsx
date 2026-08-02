/**
 * Auth Screens — Login & Sign Up
 *
 * Warm Arabian Sanctuary aesthetic: plain navy gradient, gold-accented
 * glass card, crescent emblem. No decorative background layer — keeps
 * focus entirely on the form.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BorderRadius, Colors, Spacing, Typography } from '../theme/DesignSystem';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthService } from '../services/authService';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { LEGAL_URLS } from '../constants';
import { isValidEmail, isValidPassword } from '../utils';
import * as Haptics from 'expo-haptics';

type AuthNavigation = StackNavigationProp<RootStackParamList, 'Login' | 'SignUp'>;

interface AuthScreenProps {
  navigation: AuthNavigation;
}

// AuthContext's `user`/`isGuest` state flipping doesn't by itself move the
// RootStack off Login/SignUp — those screens are already siblings of Main in
// the same "guest-or-authenticated" branch (see MainNavigator), so nothing
// else pops them once a session exists. Without an explicit reset here, a
// successful sign-in silently left the user stranded on the auth form (the
// screen it "bounced back" to was never left in the first place).
function goToMain(navigation: AuthNavigation) {
  navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
}

// ==================== SHARED BACKGROUND ====================
function AuthBackground({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient colors={Colors.celestialWash} style={styles.gradient}>
      {children}
    </LinearGradient>
  );
}

// ==================== SHARED COMPONENTS ====================
// Same neutral-base + low-alpha diagonal accent-tint recipe used across the
// app's other cards — dropped into any pill/box that needs it as a first child.
function TintWash({ radius }: { radius: number }) {
  return (
    <>
      <LinearGradient colors={[Colors.background.secondary, Colors.background.primary]} style={[StyleSheet.absoluteFill, { borderRadius: radius }]} />
      <LinearGradient
        colors={[`${Colors.accent.primary}1F`, `${Colors.accent.primary}05`]}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />
    </>
  );
}

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
    outputRange: [Colors.accent.glow, 'rgba(212, 175, 55, 0.5)'],
  });

  return (
    <Animated.View style={[styles.inputContainer, { borderColor }]}>
      <TintWash radius={BorderRadius.md} />
      {icon}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
        placeholderTextColor={`${Colors.text.primary}40`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {trailing}
    </Animated.View>
  );
}

// Shared entrance choreography for both auth screens: logo settles in first,
// then the form card, then the footer link — identical timing on Login/SignUp
// so switching between them doesn't feel like a different app.
function useAuthEntryAnimation() {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;

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
  }, []);

  return { logoOpacity, logoSlide, formOpacity, formSlide, footerOpacity };
}

// Shared Apple sign-in handler for both auth screens — Apple sign-in never
// requires email verification, so success always lands straight in the app.
function useAppleSignIn(
  authService: AuthService,
  setIsLoading: (loading: boolean) => void,
  navigation: AuthNavigation,
) {
  return useCallback(async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await authService.signInWithApple();
      goToMain(navigation);
    } catch (error: any) {
      if (error?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Sign-In Failed', error?.message || 'Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [authService, setIsLoading, navigation]);
}

// ==================== LOGIN SCREEN ====================
export function LoginScreen({ navigation }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const { enterGuestMode } = useAuth();
  const authService = AuthService.getInstance();
  const handleGuestMode = useCallback(async () => { await enterGuestMode(); }, [enterGuestMode]);

  const { logoOpacity, logoSlide, formOpacity, formSlide, footerOpacity } = useAuthEntryAnimation();

  const handleSignIn = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      Alert.alert('Missing details', 'Enter your email and password to continue.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await authService.signInWithEmail(trimmedEmail, password);
      goToMain(navigation);
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'We could not sign you in. Please try again in a moment.');
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
              Alert.alert('Reset email not sent', err.message || 'We could not send the reset email. Please try again.');
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
      // null = user dismissed the browser — nothing to navigate to.
      if (session) goToMain(navigation);
    } catch (error: any) {
      Alert.alert('Google Sign-In Failed', error?.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleAuth = useAppleSignIn(authService, setIsLoading, navigation);

  return (
    <KeyboardAvoidingView
      // Android's 'height' behavior shrinks this view by the keyboard's last-known
      // height even when the keyboard is closed, on top of the edge-to-edge system
      // nav bar inset — the two stack into a blank strip pinned above the nav bar.
      // Android's default windowSoftInputMode="adjustResize" already resizes the
      // root view for the keyboard, so no RN-side behavior is needed here (same
      // fix already applied in ReflectionPrompt.tsx).
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <AuthBackground>
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
              <Image source={require('../../assets/icon.png')} style={styles.emblemIcon} resizeMode="contain" />
            </View>

            <Text style={styles.heroTitle}>Welcome Back</Text>
            <Text style={styles.heroSubtitle}>Continue your spiritual journey</Text>
          </Animated.View>

          {/* Form card */}
          <Animated.View
            style={[styles.formCard, { opacity: formOpacity, transform: [{ translateY: formSlide }] }]}
          >
<TintWash radius={BorderRadius.xl} />
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
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOffIcon size={18} color={`${Colors.text.primary}66`} />
                  ) : (
                    <EyeIcon size={18} color={`${Colors.text.primary}66`} />
                  )}
                </TouchableOpacity>
              }
            />

            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotBtn}
              accessibilityRole="button"
              accessibilityLabel="Forgot password?"
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSignIn}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              accessibilityState={{ disabled: isLoading, busy: isLoading }}
            >
              <LinearGradient colors={['#E8C84A', '#B8860B']} style={styles.primaryBtn}>
                {isLoading ? (
                  <ActivityIndicator color={Colors.background.secondary} />
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
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
                accessibilityState={{ disabled: isLoading }}
              >
                <TintWash radius={BorderRadius.md} />
                <GoogleIcon size={18} />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.socialBtn}
                  activeOpacity={0.8}
                  onPress={handleAppleAuth}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Apple"
                  accessibilityState={{ disabled: isLoading }}
                >
                  <TintWash radius={BorderRadius.md} />
                  <AppleIcon size={18} fill={Colors.text.primary} />
                  <Text style={styles.socialBtnText}>Apple</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.guestBtn}
              activeOpacity={0.7}
              onPress={handleGuestMode}
              accessibilityRole="button"
              accessibilityLabel="Continue as guest"
            >
              <TintWash radius={BorderRadius.md} />
              <Text style={styles.guestBtnText}>Continue as Guest</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer link */}
          <Animated.View style={[styles.footerRow, { opacity: footerOpacity }]}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              accessibilityRole="button"
              accessibilityLabel="Create an account"
            >
              <Text style={styles.footerLink}>Create one</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </AuthBackground>
    </KeyboardAvoidingView>
  );
}

// ==================== SIGN UP SCREEN ====================
export function SignUpScreen({ navigation }: AuthScreenProps) {
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

  const { logoOpacity, logoSlide, formOpacity, formSlide, footerOpacity } = useAuthEntryAnimation();

  const handleCreateAccount = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password) {
      Alert.alert('Missing details', 'Fill in every field to create your account.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!isValidPassword(password)) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }
    if (!agreeTerms) {
      Alert.alert('One more step', 'Agree to the Terms and Privacy Policy to continue.');
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
      Alert.alert('Sign Up Failed', error.message || 'We could not create your account. Please try again in a moment.');
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
      // null = user dismissed the browser — nothing to navigate to.
      if (session) goToMain(navigation);
    } catch (error: any) {
      Alert.alert('Google Sign-In Failed', error?.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleAuth = useAppleSignIn(authService, setIsLoading, navigation);

  const canSubmit = agreeTerms && !isLoading;

  return (
    <KeyboardAvoidingView
      // Android's 'height' behavior shrinks this view by the keyboard's last-known
      // height even when the keyboard is closed, on top of the edge-to-edge system
      // nav bar inset — the two stack into a blank strip pinned above the nav bar.
      // Android's default windowSoftInputMode="adjustResize" already resizes the
      // root view for the keyboard, so no RN-side behavior is needed here (same
      // fix already applied in ReflectionPrompt.tsx).
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <AuthBackground>
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
              <Image source={require('../../assets/icon.png')} style={styles.emblemIcon} resizeMode="contain" />
            </View>

            <Text style={styles.heroTitle}>Begin Your Journey</Text>
            <Text style={styles.heroSubtitle}>Create your account with purpose</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View
            style={[styles.formCard, { opacity: formOpacity, transform: [{ translateY: formSlide }] }]}
          >
<TintWash radius={BorderRadius.xl} />
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
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOffIcon size={18} color={`${Colors.text.primary}66`} />
                  ) : (
                    <EyeIcon size={18} color={`${Colors.text.primary}66`} />
                  )}
                </TouchableOpacity>
              }
            />
            <Text style={styles.passwordHint}>At least 8 characters with numbers and symbols</Text>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreeTerms(!agreeTerms)}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityLabel="I agree to the Terms of Service and Privacy Policy"
              accessibilityState={{ checked: agreeTerms }}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <CheckIcon size={14} color={Colors.background.secondary} />}
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

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!canSubmit}
              onPress={handleCreateAccount}
              accessibilityRole="button"
              accessibilityLabel="Create account"
              accessibilityState={{ disabled: !canSubmit, busy: isLoading }}
            >
              <LinearGradient
                colors={canSubmit ? ['#E8C84A', '#B8860B'] : [Colors.accent.glow, 'rgba(212, 175, 55, 0.08)']}
                style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.background.secondary} />
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
                accessibilityRole="button"
                accessibilityLabel="Sign up with Google"
                accessibilityState={{ disabled: isLoading }}
              >
                <TintWash radius={BorderRadius.md} />
                <GoogleIcon size={18} />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.socialBtn}
                  activeOpacity={0.8}
                  onPress={handleAppleAuth}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Sign up with Apple"
                  accessibilityState={{ disabled: isLoading }}
                >
                  <TintWash radius={BorderRadius.md} />
                  <AppleIcon size={18} fill={Colors.text.primary} />
                  <Text style={styles.socialBtnText}>Apple</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.guestBtn}
              activeOpacity={0.7}
              onPress={handleGuestMode}
              accessibilityRole="button"
              accessibilityLabel="Continue as guest"
            >
              <TintWash radius={BorderRadius.md} />
              <Text style={styles.guestBtnText}>Continue as Guest</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Footer */}
          <Animated.View style={[styles.footerRow, { opacity: footerOpacity }]}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </AuthBackground>
    </KeyboardAvoidingView>
  );
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
  emblemIcon: {
    width: 76,
    height: 76,
  },
  heroTitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.hero,
    color: Colors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontFamily: Typography.fonts.serif,
    fontSize: Typography.sizes.small,
    color: `${Colors.text.primary}73`,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // --- Form card ---
  formCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  inputLabel: {
    fontSize: Typography.sizes.detail,
    fontWeight: '600',
    color: `${Colors.text.primary}80`,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: Typography.sizes.body,
    color: Colors.text.primary,
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
    color: Colors.background.secondary,
    letterSpacing: 0.5,
  },
  primaryBtnTextDisabled: {
    color: `${Colors.text.primary}4D`,
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
    color: `${Colors.text.primary}59`,
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
    borderColor: `${Colors.text.primary}29`,
    overflow: 'hidden',
  },
  socialBtnText: {
    fontSize: Typography.sizes.small,
    fontWeight: '600',
    color: Colors.text.secondary,
    letterSpacing: 0.3,
  },
  // --- Guest button ---
  guestBtn: {
    marginTop: Spacing.lg,
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent.muted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
    color: `${Colors.text.primary}66`,
  },
  footerLink: {
    fontSize: Typography.sizes.small,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
  // --- Sign Up specific ---
  passwordHint: {
    fontSize: Typography.sizes.detail,
    color: `${Colors.text.primary}4D`,
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
    backgroundColor: `${Colors.text.primary}0A`,
  },
  checkboxChecked: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: Typography.sizes.detail,
    color: `${Colors.text.primary}80`,
    lineHeight: 18,
  },
  linkText: {
    color: Colors.accent.primary,
    fontWeight: '500',
  },
});

export default { LoginScreen, SignUpScreen };
