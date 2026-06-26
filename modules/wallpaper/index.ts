import { requireNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

interface DotivoWallpaperModule {
  openWallpaperPicker(): void;
  updateWallpaperData(payload: string): void;
}

// Only load the native module on Android — the live wallpaper feature is Android-only
const NativeModule = Platform.OS === 'android'
  ? requireNativeModule<DotivoWallpaperModule>('DotivoWallpaper')
  : null;

export function openWallpaperPicker() {
  return NativeModule?.openWallpaperPicker();
}

export function updateWallpaperData(payload: string) {
  return NativeModule?.updateWallpaperData(payload);
}
