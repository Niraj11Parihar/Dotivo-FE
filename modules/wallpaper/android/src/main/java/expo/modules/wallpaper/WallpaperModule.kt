package expo.modules.wallpaper

import android.app.WallpaperManager
import android.content.ComponentName
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WallpaperModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DotivoWallpaper")

    Function("openWallpaperPicker") {
      val context = appContext.reactContext ?: return@Function
      val intent = Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER)
      intent.putExtra(
        WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT,
        ComponentName(context, "expo.modules.wallpaper.DotivoWallpaperService")
      )
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }
  }
}
