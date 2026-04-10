const { withAndroidManifest } = require('@expo/config-plugins');

const withWallpaper = (config) => {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    
    if (!mainApplication.service) mainApplication.service = [];
    
    const hasService = mainApplication.service.some(
      (s) => s.$['android:name'] === 'expo.modules.wallpaper.DotivoWallpaperService'
    );
    
    if (!hasService) {
      mainApplication.service.push({
        $: {
          'android:name': 'expo.modules.wallpaper.DotivoWallpaperService',
          'android:label': 'Dotivo Grid',
          'android:permission': 'android.permission.BIND_WALLPAPER',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.service.wallpaper.WallpaperService',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.service.wallpaper',
              'android:resource': '@xml/wallpaper',
            },
          },
        ],
      });
    }
    
    return config;
  });
};

module.exports = withWallpaper;
