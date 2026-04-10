package expo.modules.wallpaper

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.service.wallpaper.WallpaperService
import android.view.SurfaceHolder

class DotivoWallpaperService : WallpaperService() {
    override fun onCreateEngine(): Engine {
        return DotivoEngine()
    }

    inner class DotivoEngine : Engine() {
        private var visible = false
        private val paint = Paint().apply {
            isAntiAlias = true
        }

        override fun onVisibilityChanged(visible: Boolean) {
            this.visible = visible
            if (visible) {
                draw()
            }
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
                if (canvas != null) {
                    drawWallpaper(canvas)
                }
            } finally {
                if (canvas != null) {
                    holder.unlockCanvasAndPost(canvas)
                }
            }
        }

        private fun drawWallpaper(canvas: Canvas) {
            // Background
            canvas.drawColor(Color.parseColor("#0F172A"))

            val width = canvas.width
            val height = canvas.height
            val margin = 100f
            val dotSize = 40f
            val gap = 20f
            val cols = 5
            val rows = 6 // 30 dots

            val startX = (width - (cols * dotSize + (cols - 1) * gap)) / 2
            val startY = (height - (rows * dotSize + (rows - 1) * gap)) / 2

            paint.style = Paint.Style.FILL
            
            for (i in 0 until 30) {
                val row = i / cols
                val col = i % cols
                
                // Default grey
                paint.color = Color.parseColor("#334155")
                
                val left = startX + col * (dotSize + gap)
                val top = startY + row * (dotSize + gap)
                
                canvas.drawRoundRect(left, top, left + dotSize, top + dotSize, 8f, 8f, paint)
            }
            
            // Draw title
            paint.color = Color.WHITE
            paint.textSize = 60f
            paint.textAlign = Paint.Align.CENTER
            canvas.drawText("DOTIVO CONSISTENCY", width / 2f, startY - 80f, paint)
        }
    }
}
