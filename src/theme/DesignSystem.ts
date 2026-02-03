export const Grid = {
  contentPadding: 24,
  borderRadius: 20,
  borderRadiusInner: 16,
  space4: 4,
  space8: 8,
  space12: 12,
  space16: 16,
  space20: 20,
  space24: 24,
  space32: 32,
  space40: 40,
  space48: 48,
  cardGap: 24,
};

export const Colors = {
  // Brand & Semantic
  teal: '#2ED3C6',
  tealMuted: 'rgba(46, 211, 198, 0.2)',
  tealGlow: 'rgba(46, 211, 198, 0.15)',
  green: '#4ADE80',
  greenGlow: 'rgba(74, 222, 128, 0.3)',
  red: '#FF6B6B',
  white: '#FFFFFF',
  whiteDim: 'rgba(255, 255, 255, 0.7)',
  whiteMuted: 'rgba(255, 255, 255, 0.3)',

  // Harmony colors
  gold: '#D4AF37',

  // Surfaces & Layers
  background: '#0B0F12',
  backgroundLighter: '#1A2126',
  surface: '#121A1F',
  surfaceSheet: '#1E293B',
  overlay: 'rgba(0,0,0,0.85)',
  border: 'rgba(255, 255, 255, 0.08)',

  // Card Themes (Gradients)
  verseGradient: ['#121A1F', '#0B0F12'] as const,
  wisdomGradient: ['#161D24', '#0B0F12'] as const,
  actionGradient: ['#1A2332', '#0B0F12'] as const,
  headerGradient: ['rgba(11, 15, 18, 0.95)', 'rgba(11, 15, 18, 0.7)', 'transparent'] as const,
  bottomFadeGradient: ['transparent', 'rgba(11, 15, 18, 0.95)', '#0B0F12'] as const,
};

export const Typography = {
  fontArabic: 'Amiri-Quran',
  sizeHero: 32,
  sizeTitle: 24,
  sizeBody: 16,
  sizeSmall: 14,
  sizeDetail: 12,

  lsWidest: 3,
  lsWide: 1.5,
  lsNormal: 0.5,
};
