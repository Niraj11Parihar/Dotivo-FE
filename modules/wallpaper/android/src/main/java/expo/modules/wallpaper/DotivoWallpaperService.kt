package expo.modules.wallpaper

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.Typeface
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder
import org.json.JSONObject
import java.io.File

class DotivoWallpaperService : WallpaperService() {
    override fun onCreateEngine(): Engine = DotivoEngine()

    inner class DotivoEngine : Engine() {
        private var visible = false

        private val bgPaint = Paint().apply { isAntiAlias = true }
        private val overlayPaint = Paint().apply { color = Color.parseColor("#80000000") } // 50% black
        private val dotPaint = Paint().apply { isAntiAlias = true; style = Paint.Style.FILL }
        private val textPaint = Paint().apply {
            isAntiAlias = true
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            textAlign = Paint.Align.CENTER
        }
        private val subtitlePaint = Paint().apply {
            isAntiAlias = true
            textAlign = Paint.Align.CENTER
        }

        // Default colors
        private var colorWin     = Color.parseColor("#10B981")
        private var colorEmpty   = Color.parseColor("#334155")
        private var colorFuture  = Color.parseColor("#1E293B")
        private var colorBg      = Color.parseColor("#0F172A")

        private fun lerpColor(score: Double): Int {
            val t = score.coerceIn(0.0, 1.0).toFloat()
            val r = (Color.red(colorEmpty)   + (Color.red(colorWin)   - Color.red(colorEmpty))   * t).toInt()
            val g = (Color.green(colorEmpty) + (Color.green(colorWin) - Color.green(colorEmpty)) * t).toInt()
            val b = (Color.blue(colorEmpty)  + (Color.blue(colorWin)  - Color.blue(colorEmpty))  * t).toInt()
            return Color.rgb(r, g, b)
        }

        override fun onVisibilityChanged(visible: Boolean) {
            this.visible = visible
            if (visible) draw()
        }

        override fun onSurfaceChanged(holder: SurfaceHolder?, format: Int, width: Int, height: Int) {
            super.onSurfaceChanged(holder, format, width, height)
            draw()
        }

        private fun draw() {
            val holder = surfaceHolder
            var canvas: Canvas? = null
            try {
                canvas = holder.lockCanvas()
                if (canvas != null) drawWallpaper(canvas)
            } finally {
                if (canvas != null) holder.unlockCanvasAndPost(canvas)
            }
        }

        // Helper to safely parse colors with a fallback
        private fun parseColorSafe(colorString: String?, defaultColor: Int): Int {
            if (colorString.isNullOrEmpty()) return defaultColor
            return try {
                Color.parseColor(colorString)
            } catch (e: Exception) {
                defaultColor
            }
        }

        private fun drawWallpaper(canvas: Canvas) {
            val w = canvas.width.toFloat()
            val h = canvas.height.toFloat()

            var scores = emptyList<Double>()
            var title = "DOTIVO"
            var subtitle = "CONSISTENCY"
            var cols = 5
            var useImage = false
            var imageUri = ""

            // Parse configuration
            try {
                val prefs = applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val raw = prefs.getString(PREFS_KEY_PAYLOAD, null)
                if (raw != null) {
                    val json = JSONObject(raw)
                    val arr = json.optJSONArray("history")
                    val parsedScores = mutableListOf<Double>()
                    if (arr != null) {
                        for (i in 0 until arr.length()) {
                            val entry = arr.getJSONObject(i)
                            parsedScores.add(entry.getDouble("completionScore"))
                        }
                    }
                    scores = parsedScores

                    val config = json.optJSONObject("config")
                    if (config != null) {
                        val colorsObj = config.optJSONObject("colors")
                        if (colorsObj != null) {
                            colorWin = parseColorSafe(colorsObj.optString("primary"), colorWin)
                            colorEmpty = parseColorSafe(colorsObj.optString("empty"), colorEmpty)
                            colorBg = parseColorSafe(colorsObj.optString("background"), colorBg)
                            // Use the same for future dots, or keep it default
                        }

                        val textObj = config.optJSONObject("text")
                        if (textObj != null) {
                            title = textObj.optString("title", title)
                            textPaint.color = parseColorSafe(textObj.optString("titleColor"), Color.WHITE)
                            
                            subtitle = textObj.optString("subtitle", subtitle)
                            subtitlePaint.color = parseColorSafe(textObj.optString("subtitleColor"), Color.parseColor("#94A3B8"))
                        }

                        val layoutObj = config.optJSONObject("layout")
                        if (layoutObj != null) {
                            cols = layoutObj.optInt("columns", cols).coerceIn(3, 10)
                        }

                        val imgObj = config.optJSONObject("backgroundImage")
                        if (imgObj != null) {
                            useImage = imgObj.optBoolean("enabled", false)
                            imageUri = imgObj.optString("uri", "")
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }

            // Draw Background (Color or Image)
            canvas.drawColor(colorBg)

            var bgImageBitmap: Bitmap? = null
            if (useImage && imageUri.isNotEmpty()) {
                val file = File(imageUri.replace("file://", ""))
                if (file.exists()) {
                    try {
                        bgImageBitmap = BitmapFactory.decodeFile(file.absolutePath)
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }

            if (bgImageBitmap != null) {
                // Center crop the image
                val imgW = bgImageBitmap.width.toFloat()
                val imgH = bgImageBitmap.height.toFloat()
                val scale = Math.max(w / imgW, h / imgH)
                val scaledW = imgW * scale
                val scaledH = imgH * scale
                val left = (w - scaledW) / 2f
                val top = (h - scaledH) / 2f
                val destRect = RectF(left, top, left + scaledW, top + scaledH)
                canvas.drawBitmap(bgImageBitmap, null, destRect, bgPaint)
                
                // Draw dark overlay to ensure dots/text are visible
                canvas.drawRect(0f, 0f, w, h, overlayPaint)
            }

            // Draw Grid
            val rows = Math.ceil(30.0 / cols).toInt()
            val dotSize = ((w * 0.85f) / cols).coerceAtMost(w * 0.12f)
            val gap = dotSize * 0.25f
            val gridW = cols * dotSize + (cols - 1) * gap
            val gridH = rows * dotSize + (rows - 1) * gap
            val startX = (w - gridW) / 2f
            val startY = (h - gridH) / 2f - h * 0.04f

            textPaint.textSize = w * 0.08f
            canvas.drawText(title, w / 2f, startY - dotSize * 1.5f, textPaint)

            subtitlePaint.textSize = w * 0.04f
            canvas.drawText(subtitle, w / 2f, startY - dotSize * 0.8f, subtitlePaint)

            for (i in 0 until 30) {
                val row = i / cols
                val col = i % cols
                val left = startX + col * (dotSize + gap)
                val top  = startY + row * (dotSize + gap)
                val rect = RectF(left, top, left + dotSize, top + dotSize)
                val radius = dotSize * 0.22f

                val score = scores.getOrNull(i)
                dotPaint.color = if (score == null) colorFuture else lerpColor(score)
                canvas.drawRoundRect(rect, radius, radius, dotPaint)
            }

            val winCount = scores.count { it >= 1.0 }
            subtitlePaint.textSize = w * 0.035f
            canvas.drawText(
                "$winCount / 30 days won",
                w / 2f,
                startY + gridH + dotSize * 1.2f,
                subtitlePaint
            )
        }
    }
}

