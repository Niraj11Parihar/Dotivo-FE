import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { HistoryItem } from '../store/slices/goalStore';
import { updateWallpaperData } from '../../modules/wallpaper';

export const WALLPAPER_SYNC_KEY = 'dotivo_wallpaper_payload';

export type DotShape = 'square' | 'rounded' | 'circle' | 'diamond';
export type DotSize = 'small' | 'medium' | 'large';

export interface WallpaperConfig {
  colors: {
    primary: string;
    empty: string;
    background: string;
  };
  text: {
    title: string;
    titleSize: number;
    titleColor: string;
    subtitle: string;
    subtitleSize: number;
    subtitleColor: string;
    showText: boolean;
    showQuote: boolean;
    quoteText: string;
  };
  layout: {
    columns: number;
    dotShape: DotShape;
    dotSize: DotSize;
    dotOpacityMin: number;
    dotOpacityMax: number;
  };
  backgroundImage: {
    enabled: boolean;
    uri: string;
  };
}

export interface WallpaperPayload {
  lastUpdatedAt: string;
  themeId: string;
  completionScoreToday: number;
  history: { date: string; completionScore: number }[];
  config: WallpaperConfig;
}

export const DEFAULT_WALLPAPER_CONFIG: WallpaperConfig = {
  colors: {
    primary: '#10B981',
    empty: '#1E2D45',
    background: '#0A0F1E',
  },
  text: {
    title: 'DOTIVO',
    titleSize: 48,
    titleColor: '#FFFFFF',
    subtitle: 'CONSISTENCY',
    subtitleSize: 28,
    subtitleColor: '#7E8BA8',
    showText: true,
    showQuote: true,
    quoteText: 'Discipline equals freedom.',
  },
  layout: {
    columns: 5,
    dotShape: 'rounded',
    dotSize: 'medium',
    dotOpacityMin: 0.15,
    dotOpacityMax: 1.0,
  },
  backgroundImage: {
    enabled: false,
    uri: '',
  },
};

export async function getWallpaperPayload(): Promise<WallpaperPayload | null> {
  try {
    const stored = await AsyncStorage.getItem(WALLPAPER_SYNC_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as WallpaperPayload;
      // Migrate old payloads missing new fields
      const config = parsed.config ?? DEFAULT_WALLPAPER_CONFIG;
      if (!config.layout.dotShape) config.layout.dotShape = 'rounded';
      if (!config.layout.dotSize) config.layout.dotSize = 'medium';
      if (config.layout.dotOpacityMin == null) config.layout.dotOpacityMin = 0.15;
      if (config.layout.dotOpacityMax == null) config.layout.dotOpacityMax = 1.0;
      if (!config.text.showQuote == null) config.text.showQuote = true;
      if (!config.text.quoteText) config.text.quoteText = 'Discipline equals freedom.';
      return { ...parsed, config };
    }
  } catch (e) {}
  return null;
}

export async function syncWallpaperData(
  todayScore: number,
  history: HistoryItem[],
  themeId?: string,
  config?: WallpaperConfig
) {
  const existingPayload = await getWallpaperPayload();

  const finalThemeId = themeId || existingPayload?.themeId || 'classic_slate';
  const finalConfig = config || existingPayload?.config || DEFAULT_WALLPAPER_CONFIG;

  const payload: WallpaperPayload = {
    lastUpdatedAt: new Date().toISOString(),
    themeId: finalThemeId,
    completionScoreToday: todayScore,
    history: history.slice(0, 90).map(h => ({
      date: h.date,
      completionScore: h.completionScore,
    })),
    config: finalConfig,
  };

  const payloadJson = JSON.stringify(payload);

  try {
    await AsyncStorage.setItem(WALLPAPER_SYNC_KEY, payloadJson);

    if (Platform.OS === 'android') {
      updateWallpaperData(payloadJson);
    }

    console.log('[WallpaperSync] Data updated for native side');
  } catch (e) {
    console.error('[WallpaperSync] Failed to sync data:', e);
  }
}
