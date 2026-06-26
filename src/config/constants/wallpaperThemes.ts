export interface WallpaperTheme {
  id: string;
  name: string;
  emoji: string;
  background: string;
  dotFull: string;
  dotEmpty: string;
  titleColor: string;
  subtitleColor: string;
}

export const WALLPAPER_THEMES: WallpaperTheme[] = [
  {
    id: 'classic_slate',
    name: 'Classic Slate',
    emoji: '🌙',
    background: '#0F172A',
    dotFull: '#10B981',
    dotEmpty: '#1E2D45',
    titleColor: '#FFFFFF',
    subtitleColor: '#7E8BA8',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    emoji: '✨',
    background: '#000000',
    dotFull: '#8B5CF6',
    dotEmpty: '#1A1A2E',
    titleColor: '#FFFFFF',
    subtitleColor: '#6D6D8E',
  },
  {
    id: 'emerald_forest',
    name: 'Emerald Forest',
    emoji: '🌿',
    background: '#052e16',
    dotFull: '#34D399',
    dotEmpty: '#064E3B',
    titleColor: '#ECFDF5',
    subtitleColor: '#6EE7B7',
  },
  {
    id: 'oceanic',
    name: 'Oceanic',
    emoji: '🌊',
    background: '#0C1A3B',
    dotFull: '#38BDF8',
    dotEmpty: '#1E3A5F',
    titleColor: '#F0F9FF',
    subtitleColor: '#7DD3FC',
  },
  {
    id: 'neon_glow',
    name: 'Neon Glow',
    emoji: '⚡',
    background: '#07030F',
    dotFull: '#A855F7',
    dotEmpty: '#1A0A2E',
    titleColor: '#FAF0FF',
    subtitleColor: '#C084FC',
  },
  {
    id: 'dark_luxury',
    name: 'Dark Luxury',
    emoji: '👑',
    background: '#0A0806',
    dotFull: '#D4AF37',
    dotEmpty: '#1A1510',
    titleColor: '#FFF8E7',
    subtitleColor: '#B8962E',
  },
  {
    id: 'student_mode',
    name: 'Student Mode',
    emoji: '📚',
    background: '#0D1117',
    dotFull: '#3B82F6',
    dotEmpty: '#1C2938',
    titleColor: '#FFFFFF',
    subtitleColor: '#93C5FD',
  },
  {
    id: 'gym_mode',
    name: 'Gym Mode',
    emoji: '💪',
    background: '#1A0000',
    dotFull: '#EF4444',
    dotEmpty: '#2D0A0A',
    titleColor: '#FFF1F0',
    subtitleColor: '#FCA5A5',
  },
];

export function getThemeById(id: string): WallpaperTheme {
  return WALLPAPER_THEMES.find((t) => t.id === id) ?? WALLPAPER_THEMES[0];
}
