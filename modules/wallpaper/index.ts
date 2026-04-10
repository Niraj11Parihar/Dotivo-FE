import { requireNativeModule } from 'expo-modules-core';

interface DotivoWallpaperModule {
  openWallpaperPicker(): void;
}

const NativeModule = requireNativeModule<DotivoWallpaperModule>('DotivoWallpaper');

export function openWallpaperPicker() {
  return NativeModule.openWallpaperPicker();
}
