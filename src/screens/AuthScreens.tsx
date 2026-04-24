/**
 * Auth Screens — Login & Sign Up
 *
 * Dark, immersive design that continues the onboarding's reverent mood.
 * Geometric Islamic pattern softly pulses in the background.
 * Form elements use frosted glass styling with gold accents.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Colors } from '../theme/DesignSystem';
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
} from 'react-native';
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
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// --- Geometric background pattern ---
// Creates a subtle tessellated Islamic star grid
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

// Pre-compute pattern paths
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
    <LinearGradient colors={['#0A0806', '#0E0B08', '#0A0806']} style={styles.gradient}>
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

  const { enterGuestMode } = useAuth();
  const authService = AuthService.getInstance();

  // Staggered entrance
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(20)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const patternPulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Logo entrance
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(logoSlide, { toValue: 0, damping: 18, stiffness: 80, useNativeDriver: true }),
      ]),
    ]).start();

    // Form entrance
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(formSlide, { toValue: 0, damping: 20, stiffness: 80, useNativeDriver: true }),
      ]),
    ]).start();

    // Footer
    Animated.sequence([
      Animated.delay(800),
      Animated.timing(footerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Pattern pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(patternPulse, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(patternPulse, { toValue: 0.4, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await authService.signInWithEmail(email, password);
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <AuthBackground patternOpacity={patternPulse}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.headerWrap,
              {
                opacity: logoOpacity,
                transform: [{ translateY: logoSlide }],
              },
            ]}
          >
            {/* Crescent + star emblem */}
            <View style={styles.emblemWrap}>
              <View style={styles.emblemGlow} />
              <Svg width={52} height={52} viewBox="0 0 52 52">
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
            style={[
              styles.formCard,
              {
                opacity: formOpacity,
                transform: [{ translateY: formSlide }],
              },
            ]}
          >
            {/* Email */}
            <Text style={styles.inputLabel}>Email</Text>
            <AuthInput
              icon={<MailIcon size={18} color="rgba(212, 175, 55, 0.6)" />}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password */}
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

            {/* Forgot password */}
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Sign In button */}
            <TouchableOpacity activeOpacity={0.85} onPress={handleSignIn} disabled={isLoading}>
              <LinearGradient colors={[Colors.accent.primary, Colors.accent.primary]} style={styles.primaryBtn}>
                {isLoading ? (
                  <ActivityIndicator color="#14100C" />
                ) : (
                  <Text style={styles.primaryBtnText}>Sign In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <GoldDivider text="Or continue with" />

            {/* Social buttons */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7} onPress={handleSignIn}>
                <GoogleIcon size={18} />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7} onPress={handleSignIn}>
                <AppleIcon size={18} fill="#F5EDE3" />
                <Text style={styles.socialBtnText}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Guest mode */}
            <TouchableOpacity style={styles.guestBtn} activeOpacity={0.7} onPress={enterGuestMode}>
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

  const { enterGuestMode } = useAuth();
  const authService = AuthService.getInstance();

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
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (!agreeTerms) {
      Alert.alert('Error', 'Please agree to the Terms and Privacy Policy.');
      return;
    }
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await authService.signUpWithEmail(email, password, name);
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

  const canSubmit = agreeTerms && !isLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <AuthBackground patternOpacity={patternPulse}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.headerWrap,
              {
                opacity: logoOpacity,
                transform: [{ translateY: logoSlide }],
              },
            ]}
          >
            <View style={styles.emblemWrap}>
              <View style={styles.emblemGlow} />
              <Svg width={52} height={52} viewBox="0 0 52 52">
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
            style={[
              styles.formCard,
              {
                opacity: formOpacity,
                transform: [{ translateY: formSlide }],
              },
            ]}
          >
            {/* Name */}
            <Text style={styles.inputLabel}>Full Name</Text>
            <AuthInput
              icon={<UserIcon size={18} color="rgba(212, 175, 55, 0.6)" />}
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            {/* Email */}
            <Text style={styles.inputLabel}>Email</Text>
            <AuthInput
              icon={<MailIcon size={18} color="rgba(212, 175, 55, 0.6)" />}
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password */}
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

            {/* Terms */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAgreeTerms(!agreeTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreeTerms && styles.checkboxChecked]}>
                {agreeTerms && <CheckIcon size={14} color="#14100C" />}
              </View>
              <Text style={styles.checkboxText}>
                I agree to the <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            {/* Create Account button */}
            <TouchableOpacity activeOpacity={0.85} disabled={!canSubmit} onPress={handleCreateAccount}>
              <LinearGradient
                colors={canSubmit ? [Colors.accent.primary, Colors.accent.primary] : ['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.08)']}
                style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#14100C" />
                ) : (
                  <Text style={[styles.primaryBtnText, !canSubmit && styles.primaryBtnTextDisabled]}>
                    Create Account
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <GoldDivider text="Or sign up with" />

            {/* Social */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7} onPress={handleCreateAccount}>
                <GoogleIcon size={18} />
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7} onPress={handleCreateAccount}>
                <AppleIcon size={18} fill="#F5EDE3" />
                <Text style={styles.socialBtnText}>Apple</Text>
              </TouchableOpacity>
            </View>

            {/* Guest */}
            <TouchableOpacity style={styles.guestBtn} activeOpacity={0.7} onPress={enterGuestMode}>
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
      <Path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke={color}
        strokeWidth="2"
      />
      <Path d="M22 6l-10 7L2 6" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function LockIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 11H5c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2z"
        stroke={color}
        strokeWidth="2"
      />
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
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
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
    borderRadius: 100,
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 40,
  },
  // --- Header ---
  headerWrap: {
    alignItems: 'center',
    marginBottom: 36,
  },
  emblemWrap: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  heroTitle: {
    fontFamily: 'serif',
    fontSize: 30,
    color: '#F5EDE3',
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: 'serif',
    fontSize: 15,
    color: 'rgba(245, 237, 227, 0.45)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // --- Form card ---
  formCard: {
    backgroundColor: 'rgba(245, 237, 227, 0.04)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.1)',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(245, 237, 227, 0.5)',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 237, 227, 0.04)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#F5EDE3',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotText: {
    fontSize: 13,
    color: Colors.accent.primary,
    letterSpacing: 0.3,
  },
  // --- Primary button ---
  primaryBtn: {
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '700',
    color: '#14100C',
    letterSpacing: 0.5,
  },
  primaryBtnTextDisabled: {
    color: 'rgba(245, 237, 227, 0.3)',
  },
  // --- Divider ---
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  dividerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  dividerDiamond: {
    width: 4,
    height: 4,
    backgroundColor: 'rgba(212, 175, 55, 0.4)',
    transform: [{ rotate: '45deg' }],
  },
  dividerText: {
    fontSize: 12,
    color: 'rgba(245, 237, 227, 0.35)',
    letterSpacing: 0.4,
  },
  // --- Social buttons ---
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 237, 227, 0.08)',
    backgroundColor: 'rgba(245, 237, 227, 0.04)',
  },
  socialBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(245, 237, 227, 0.7)',
    letterSpacing: 0.3,
  },
  // --- Guest button ---
  guestBtn: {
    marginTop: 16,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    backgroundColor: 'rgba(212, 175, 55, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent.primary,
    letterSpacing: 0.4,
  },
  // --- Footer ---
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(245, 237, 227, 0.4)',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
  // --- Sign Up specific ---
  passwordHint: {
    fontSize: 12,
    color: 'rgba(245, 237, 227, 0.3)',
    marginTop: -10,
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    marginRight: 12,
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
    fontSize: 13,
    color: 'rgba(245, 237, 227, 0.5)',
    lineHeight: 19,
  },
  linkText: {
    color: Colors.accent.primary,
    fontWeight: '500',
  },
});

export default { LoginScreen, SignUpScreen };