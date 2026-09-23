import { Platform, ImageSourcePropType } from 'react-native';

/**
 * Design System Tokens
 * "Celestial Night" — cool steel-blue washes, warm cream text, single gold
 * accent. A lantern under a starlit sky (see CLAUDE.md).
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
    steel: '#6B8EAE', // Muted steel-blue — captions/chevrons on celestial surfaces
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
};

export const Typography = {
  fonts: {
    arabic: 'Amiri-Quran',
    // Deliberately the platform system font (SF on iOS, Roboto on Android).
    // 'Inter' was never bundled, so iOS silently fell back to SF anyway —
    // 'System' makes that intentional and keeps every fontWeight working.
    latin: Platform.OS === 'ios' ? 'System' : 'sans-serif',
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

export const MoodColors: Record<
  string,
  {
    gradient: readonly [string, string, string];
    accent: string;
    bgFill: string;
    glow: string;
    image: ImageSourcePropType;
    /**
     * Home mood-card visuals.
     *
     * These sit on the celestialWash (#07111E → #0F1F30), so a card gradient
     * darker than roughly 20% lightness — or with no chroma at all — simply
     * disappears. Tired, Sad and Guilty previously used near-black neutrals
     * (#2E2520 / #243B56 / #2E2E2E) and read as empty outlines on device.
     *
     * Each mood owns a distinct hue, spread far enough apart to stay separable
     * for the grid's vertical and horizontal neighbours:
     *   Grateful  amber   — warmth, abundance
     *   Angry     orange  — the high-arousal warm end
     *   Tired     clay    — dusk; warm but low-arousal and desaturated
     *   Guilty    jade    — tawbah as washing and return (its waterfall theme)
     *   Peaceful  emerald — restoration, the lowest-arousal hue
     *   Hopeful   cyan    — dawn, openness
     *   Sad       blue    — the strongest cross-cultural sadness association
     *   Overwhelmed indigo — depth and weight, kept off Hopeful's cyan
     *   Lonely    violet  — distance, the night sky
     */
    card: {
      border: string;
      gradient: [string, string, string];
    };
  }
> = {
  Overwhelmed: {
    gradient: ['#0F172A', '#1E1B4B', '#000000'] as const,
    accent: '#818CF8',
    bgFill: '#0F172A',
    glow: 'rgba(129, 140, 248, 0.2)',
    image: require('../assets/themes/ocean_deep_blue.jpg'), // Starry night sky over a dark hill (no ocean, despite the filename)
    card: { border: '#4A63CC', gradient: ['#3A52B0', '#26357A', '#26357A'] },
  },
  Angry: {
    gradient: ['#1A0F0A', '#2D1610', '#140E0C'] as const,
    accent: '#FB923C',
    bgFill: '#1A0F0A',
    glow: 'rgba(251, 146, 60, 0.2)',
    image: require('../assets/themes/landscape_desert_dunes.jpg'), // Pine forest fading into white mist (no desert, despite the filename)
    card: { border: '#BC551A', gradient: ['#9C4614', '#6D300D', '#6D300D'] },
  },
  Sad: {
    gradient: ['#1E293B', '#334155', '#0F172A'] as const,
    // Was #94A3B8 — a neutral slate-grey with almost no chroma, which made the
    // card and its icon circle read as uncoloured. Blue is the sadness cue.
    accent: '#7BA3D0',
    bgFill: '#1E293B',
    glow: 'rgba(123, 163, 208, 0.2)',
    image: require('../assets/themes/mood_sad.jpg'), // Gentle misty rain over green mountains
    card: { border: '#3F6C9C', gradient: ['#345880', '#233C5A', '#233C5A'] },
  },
  Calm: {
    gradient: ['#064E3B', '#022C22', '#052E16'] as const,
    accent: '#34D399',
    bgFill: '#064E3B',
    glow: 'rgba(52, 211, 153, 0.2)',
    image: require('../assets/themes/portrait/mountain_alpine_lake.jpg'), // Turquoise lake, rowing boat and cliffs (portrait crop)
    card: { border: '#16A578', gradient: ['#128A64', '#0C5F46', '#0C5F46'] },
  },
  Grateful: {
    gradient: ['#451A03', '#78350F', '#451A03'] as const,
    accent: '#FBBF24',
    bgFill: '#451A03',
    glow: 'rgba(251, 191, 36, 0.2)',
    image: require('../assets/themes/portrait/mountain_snow_peaks.jpg'), // Lit summit above a sea of cloud at dusk (portrait crop)
    card: { border: '#B5761F', gradient: ['#96601A', '#6B4212', '#6B4212'] },
  },
  Hopeful: {
    gradient: ['#083344', '#155E75', '#083344'] as const,
    accent: '#22D3EE',
    bgFill: '#083344',
    glow: 'rgba(34, 211, 238, 0.2)',
    image: require('../assets/themes/portrait/sky_golden_sunset.jpg'), // Sun setting over a misty lake, wooden jetty (portrait crop)
    card: { border: '#1A93C2', gradient: ['#12789F', '#0C536F', '#0C536F'] },
  },
  Tired: {
    gradient: ['#1C1917', '#292524', '#1C1917'] as const,
    // Was #D6D3D1 — a near-white neutral, so the card had no hue at all. Clay
    // keeps fatigue warm and low-arousal without borrowing Angry's heat or
    // Lonely's violet, which are its grid neighbours.
    accent: '#C99A93',
    bgFill: '#1C1917',
    glow: 'rgba(201, 154, 147, 0.2)',
    image: require('../assets/themes/portrait/landscape_lavender_field.jpg'), // Soft sunset over a lavender field (portrait crop)
    card: { border: '#996963', gradient: ['#7D5651', '#573B38', '#573B38'] },
  },
  Lonely: {
    gradient: ['#2E1065', '#4C1D95', '#2E1065'] as const,
    accent: '#C084FC',
    bgFill: '#2E1065',
    glow: 'rgba(192, 132, 252, 0.2)',
    image: require('../assets/themes/portrait/sky_milky_way.jpg'), // Milky Way over a snowy peak (portrait crop)
    card: { border: '#8B48D6', gradient: ['#7639BC', '#522585', '#522585'] },
  },
  Guilty: {
    // Was pure neutral grey end to end (#1A1A1A / #A3A3A3 / #2E2E2E) — the only
    // mood with no hue at any layer, so its card rendered as an empty outline.
    // Rose rather than the obvious green-for-renewal: green put it 8° from
    // Calm's emerald and the grid read as two matching cards. A deep, muted
    // rose carries remorse and the heart while staying well clear of Angry's
    // orange — and it is deliberately not an alarm red, since tawbah is a
    // return rather than a reprimand.
    gradient: ['#2A0D18', '#3F1526', '#2A0D18'] as const,
    accent: '#C4708C',
    bgFill: '#2A0D18',
    glow: 'rgba(196, 112, 140, 0.2)',
    image: require('../assets/themes/portrait/nature_waterfall.jpg'), // A male lion walking through grass (no waterfall, despite the filename; portrait crop)
    card: { border: '#A34E6E', gradient: ['#8A3F5C', '#5F2B3F', '#5F2B3F'] },
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
