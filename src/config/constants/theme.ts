export const theme = {
  colors: {
    background: '#0F172A', // Deep slate
    card: '#1E293B',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    primary: '#10B981', // Glowing Green for success/win
    primaryMuted: '#064E3B',
    border: '#334155',
    error: '#EF4444',
  },
  spacing: {
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold' as const },
    h2: { fontSize: 24, fontWeight: 'bold' as const },
    body: { fontSize: 16, fontWeight: '500' as const },
    caption: { fontSize: 14, fontWeight: 'normal' as const },
  },
  radii: {
    s: 8,
    m: 12,
    l: 16,
    full: 9999,
  }
};
