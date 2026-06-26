export const theme = {
  colors: {
    background: '#0A0F1E',      // Deep navy-black
    backgroundAlt: '#0F172A',   // Slightly lighter for cards behind cards
    card: '#141E30',            // Rich dark card
    cardElevated: '#1A2540',    // Slightly lighter card for modals
    text: '#F0F4FF',            // Warm white
    textMuted: '#7E8BA8',       // Muted slate
    textFaint: '#3D4E6A',       // Very faint, for dividers
    primary: '#10B981',         // Emerald green (main success)
    primaryLight: '#34D399',    // Lighter green for hover/glow
    primaryMuted: '#052e16',    // Very dark green (backgrounds)
    primaryBorder: '#065f46',   // Green border
    accent: '#6366F1',          // Indigo accent for secondary actions
    accentLight: '#818CF8',     // Light indigo
    warning: '#F59E0B',         // Amber for partial
    warningMuted: 'rgba(245,158,11,0.1)',
    error: '#EF4444',
    errorMuted: 'rgba(239,68,68,0.1)',
    border: '#1E2D45',          // Subtle dark border
    borderLight: '#253350',     // Slightly more visible border
    separator: '#0E1929',       // For section dividers
    overlay: 'rgba(0,0,0,0.6)',
    // Gradient stops (used as references)
    gradientStart: '#0A0F1E',
    gradientEnd: '#0F1A2E',
    // Status colors
    green: '#10B981',
    partial: '#F59E0B',
    grey: '#1E2D45',
    skipped: '#3D4E6A',
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold' as const, letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: 'bold' as const, letterSpacing: -0.3 },
    h3: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2 },
    body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    bodyMedium: { fontSize: 16, fontWeight: '500' as const },
    label: { fontSize: 14, fontWeight: '600' as const, letterSpacing: 0.2 },
    caption: { fontSize: 12, fontWeight: '400' as const },
    captionBold: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.5 },
    micro: { fontSize: 10, fontWeight: '700' as const, letterSpacing: 1 },
  },
  radii: {
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    xxl: 32,
    full: 9999,
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 12,
    },
    glow: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
};
