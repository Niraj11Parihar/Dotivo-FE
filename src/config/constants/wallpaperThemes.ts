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
    id: 'emerald_forest',
    name: 'Emerald Forest',
    emoji: '🌿',
    background: '#052e16',
    dotFull: '#34D399',
    dotEmpty: '#064E3B',
    titleColor: '#ECFDF5',
    subtitleColor: '#6EE7B7',
  }
];

export function getThemeById(id: string): WallpaperTheme {
  return WALLPAPER_THEMES.find((t) => t.id === id) ?? WALLPAPER_THEMES[0];
}
