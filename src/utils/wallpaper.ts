import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryItem } from '../store/slices/goalStore';

export const WALLPAPER_SYNC_KEY = 'dotivo_wallpaper_payload';

export interface WallpaperPayload {
  lastUpdatedAt: string;
  themeId: string;
  completionScoreToday: number;
  history: { date: string; completionScore: number }[];
}

export async function syncWallpaperData(todayScore: number, history: HistoryItem[], themeId: string = 'Classic Slate') {
  const payload: WallpaperPayload = {
    lastUpdatedAt: new Date().toISOString(),
    themeId,
    completionScoreToday: todayScore,
    history: history.slice(0, 30).map(h => ({
      date: h.date,
      completionScore: h.completionScore
    })),
  };

  try {
    // We save to AsyncStorage which native code can technically access,
    // though a dedicated native bridge/shared-preferences is better for V1.
    await AsyncStorage.setItem(WALLPAPER_SYNC_KEY, JSON.stringify(payload));
    console.log('[WallpaperSync] Data updated for native side');
  } catch (e) {
    console.error('[WallpaperSync] Failed to sync data:', e);
  }
}
