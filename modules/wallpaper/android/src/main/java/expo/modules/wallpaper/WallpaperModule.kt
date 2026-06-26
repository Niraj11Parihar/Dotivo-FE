package expo.modules.wallpaper

import android.app.WallpaperManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val PREFS_NAME = "dotivo_wallpaper"
const val PREFS_KEY_PAYLOAD = "dotivo_wp_payload"

class WallpaperModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DotivoWallpaper")

    Function("openWallpaperPicker") {
      val context = appContext.reactContext ?: return@Function null
      val intent = Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER)
      intent.putExtra(
        WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT,
        ComponentName(context, "expo.modules.wallpaper.DotivoWallpaperService")
      )
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      return@Function null
    }

    // Called from JS every time goal progress changes.
    // Stores payload in SharedPreferences so DotivoWallpaperService can read it
    // on the next draw (when the wallpaper becomes visible).
    Function("updateWallpaperData") { payload: String ->
      val context = appContext.reactContext ?: return@Function null
      // Write to SharedPreferences — accessible from the WallpaperService
      val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      prefs.edit().putString(PREFS_KEY_PAYLOAD, payload).apply()
      // The live wallpaper will redraw on the next onVisibilityChanged call
      // (when the user goes to the lock/home screen). No explicit trigger needed.
      return@Function null
    }
  }
}

