import { Platform } from 'react-native';

/**
 * Design System Tokens
 * Following a "Warm Arabian Sanctuary" aesthetic.
 */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Layout = {
  // Tab bar height (~60) + bottom offset (~20) + breathing room
  tabBarClearance: 96,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Colors = {
  // Brand & Semantic
  accent: {
    primary: '#D4AF37', // Gold — Main brand color from Sakina logo
    light: '#E8C86A',   // Light gold — for calligraphy / glowing text
    secondary: '#2ED3C6', // Teal — Fresh interactive secondary
    warm: '#E8A87C', // Soft amber
    muted: 'rgba(212, 175, 55, 0.2)',
    glow: 'rgba(212, 175, 55, 0.15)', // Gold glow
  },

  status: {
    success: '#4ADE80',
    successGlow: 'rgba(74, 222, 128, 0.3)',
    error: '#FF6B6B',
  },

  text: {
    primary: '#F5EDE3', // Warm cream
    secondary: 'rgba(245, 237, 227, 0.7)',
    muted: 'rgba(245, 237, 227, 0.60)',
  },

  background: {
    primary:   '#07111E', // Celestial base — deepest screen ground
    secondary: '#0C1A2E', // Raised surfaces / sheets
    tertiary:  '#0F1F30', // Cards
  },

  // Standard screen-wash gradient — use instead of inline color arrays
  celestialWash: ['#07111E', '#0C1A2E', '#0F1F30'] as const,

  glass: {
    light: 'rgba(255, 235, 210, 0.05)',
    medium: 'rgba(255, 235, 210, 0.08)',
    heavy: 'rgba(255, 235, 210, 0.12)',
    border: 'rgba(255, 235, 210, 0.08)',
  },

  overlay: 'rgba(20, 16, 12, 0.85)',
  headerGradient: ['#14100C', 'rgba(20, 16, 12, 0.8)', 'transparent'] as const,
  surfaceSheet: '#241E19',
  verseGradient: ['#1C1612', '#14100C'] as const,
  wisdomGradient: ['#241E19', '#1C1612'] as const,
  actionGradient: ['#1E1A14', '#14100C'] as const,
};

export const Typography = {
  fonts: {
    arabic: 'Amiri-Quran',
    latin: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
    serif: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  sizes: {
    hero: 32,
    h1: 24,
    stat: 22,   // stat-card numbers — between h1 and h2
    h2: 20,
    body: 16,
    small: 14,
    detail: 12,
    label: 11,  // all-caps section / micro labels (below detail floor)
  },
  letterSpacing: {
    widest: 3,
    wide: 1.5,
    normal: 0.5,
    tight: -0.5,
  },
};

export const Themes = {
  immersive: {
    sand: {
      bg: '#14100C',
      accent: '#D4AF37',
      text: '#F5EDE3',
    },
    ocean: {
      bg: '#12100E',
      accent: '#2ED3C6',
      text: '#F5EDE3',
    },
    dawn: {
      bg: '#1A1210',
      accent: '#E8A87C',
      text: '#F5EDE3',
    },
  },
};

export const MoodColors: Record<
  string,
  {
    gradient: readonly [string, string, string];
    accent: string;
    bgFill: string;
    glow: string;
    image: string;
  }
> = {
  Overwhelmed: {
    gradient: ['#0F172A', '#1E1B4B', '#000000'] as const,
    accent: '#818CF8',
    bgFill: '#0F172A',
    glow: 'rgba(129, 140, 248, 0.2)',
    image:
      'https://images.unsplash.com/photo-1507400492013-162706c8c05e?auto=format&fit=crop&q=90&w=3840', // Calm starry night sky over ocean
  },
  Angry: {
    gradient: ['#1A0F0A', '#2D1610', '#140E0C'] as const,
    accent: '#FB923C',
    bgFill: '#1A0F0A',
    glow: 'rgba(251, 146, 60, 0.2)',
    image:
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=90&w=3840', // Peaceful desert sunset with warm tones
  },
  Sad: {
    gradient: ['#1E293B', '#334155', '#0F172A'] as const,
    accent: '#94A3B8',
    bgFill: '#1E293B',
    glow: 'rgba(148, 163, 184, 0.2)',
    image:
      'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&q=90&w=3840', // Gentle misty rain over green mountains
  },
  Calm: {
    gradient: ['#064E3B', '#022C22', '#052E16'] as const,
    accent: '#34D399',
    bgFill: '#064E3B',
    glow: 'rgba(52, 211, 153, 0.2)',
    image:
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=90&w=3840', // Still forest lake with perfect reflection
  },
  Grateful: {
    gradient: ['#451A03', '#78350F', '#451A03'] as const,
    accent: '#FBBF24',
    bgFill: '#451A03',
    glow: 'rgba(251, 191, 36, 0.2)',
    image:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&q=90&w=3840', // Golden sunrise over majestic mountain peaks
  },
  Hopeful: {
    gradient: ['#083344', '#155E75', '#083344'] as const,
    accent: '#22D3EE',
    bgFill: '#083344',
    glow: 'rgba(34, 211, 238, 0.2)',
    image:
      'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&q=90&w=3840', // Dawn horizon light breaking through clouds
  },
  Tired: {
    gradient: ['#1C1917', '#292524', '#1C1917'] as const,
    accent: '#D6D3D1',
    bgFill: '#1C1917',
    glow: 'rgba(214, 211, 209, 0.2)',
    image:
      'https://images.unsplash.com/photo-1500534314138-5903a991bf08?auto=format&fit=crop&q=90&w=3840', // Soft sunset over peaceful lavender meadow
  },
  Lonely: {
    gradient: ['#2E1065', '#4C1D95', '#2E1065'] as const,
    accent: '#C084FC',
    bgFill: '#2E1065',
    glow: 'rgba(192, 132, 252, 0.2)',
    image:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=90&w=3840', // Vast starry night sky with milky way over mountains
  },
  Guilty: {
    gradient: ['#1A1A1A', '#262626', '#1A1A1A'] as const,
    accent: '#A3A3A3',
    bgFill: '#1A1A1A',
    glow: 'rgba(163, 163, 163, 0.2)',
    image:
      'https://images.unsplash.com/photo-1432405972618-c6b0cfba5428?auto=format&fit=crop&q=90&w=3840', // Gentle waterfall in lush green forest — renewal/tawbah
  },
};

export const Animations = {
  spring: {
    gentle: {
      damping: 18,
      stiffness: 120,
    },
    bouncy: {
      damping: 12,
      stiffness: 180,
    },
  },
  timing: {
    micro: 120, // taps, tiny pulses (100–150ms band)
    fast: 200, // small transitions / screen-to-screen fade
    normal: 400,
    slow: 600,
  },
  /** Staggered entrance choreography (used by useStaggerEntry on every screen). */
  stagger: {
    baseDelay: 140, // delay before the first element reveals
    step: 60, // delay added per successive element
    duration: 480, // each element's fade/slide duration
  },
};

export const Elevation = {
  low: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  high: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
};

// Legacy exports for backward compatibility (transition period)
export const Grid = {
  contentPadding: Spacing.xl,
  borderRadius: BorderRadius.xl,
  borderRadiusInner: BorderRadius.lg,
  space4: Spacing.xs,
  space8: Spacing.sm,
  space12: Spacing.md,
  space16: Spacing.lg,
  space20: 20, // Revisit if needed
  space24: Spacing.xl,
  space32: Spacing.xxl,
  space40: 40,
  space48: Spacing.xxxl,
  cardGap: Spacing.xl,
};

// Re-map Colors for legacy compatibility
export const LegacyColors = {
  teal: Colors.accent.secondary,
  tealMuted: 'rgba(46, 211, 198, 0.2)',
  tealGlow: 'rgba(46, 211, 198, 0.15)',
  green: Colors.status.success,
  greenGlow: Colors.status.successGlow,
  red: Colors.status.error,
  white: Colors.text.primary,
  whiteDim: Colors.text.secondary,
  whiteMuted: Colors.text.muted,
  gold: Colors.accent.primary,
  warm: Colors.accent.warm,
  background: Colors.background.primary,
  backgroundLighter: Colors.background.tertiary,
  surface: Colors.background.secondary,
  border: Colors.glass.border,
};