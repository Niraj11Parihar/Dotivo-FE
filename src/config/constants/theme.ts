export const theme = {
  colors: {
    background: '#050816',      // Deep futuristic background
    backgroundAlt: '#080C1E',   // Slightly lighter for contrast
    card: '#101827',            // Surface card
    cardElevated: '#162033',    // Elevated card
    text: '#F8FAFC',            // Text white
    textMuted: '#94A3B8',       // Muted text
    textFaint: '#475569',       // Faint text
    primary: '#19D994',         // Primary emerald
    primaryLight: '#35F2B2',    // Glow emerald
    primaryMuted: 'rgba(25, 217, 148, 0.1)',
    primaryBorder: 'rgba(25, 217, 148, 0.3)',
    accent: '#8B5CF6',          // Accent purple
    accentLight: '#A78BFA',
    secondary: '#38BDF8',       // Secondary cyan
    warning: '#FACC15',         // Reward gold
    warningMuted: 'rgba(250, 204, 21, 0.1)',
    error: '#F87171',           // Danger
    errorMuted: 'rgba(248, 113, 113, 0.1)',
    border: '#263653',          // Border
    borderLight: '#334155',     
    separator: '#1E293B',       
    overlay: 'rgba(0,0,0,0.65)',
    // Status colors
    green: '#19D994',
    partial: '#FACC15',
    grey: '#263653',
    skipped: '#475569',
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
    hero: { fontSize: 42, fontWeight: '800' as const, letterSpacing: -1 },
    h1: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
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
