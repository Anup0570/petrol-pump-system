export interface PreprocessOptions {
  brightness: number
  contrast: number
  binarize: boolean
  threshold: number
  invert: boolean
  scale: number
  crop: { x: number; y: number; w: number; h: number }
}

/**
 * Preprocesses a source canvas by cropping, resizing, and applying pixel filters.
 * Outputs the results onto the target destination canvas.
 */
export function preprocessImage(
  srcCanvas: HTMLCanvasElement,
  destCanvas: HTMLCanvasElement,
  options: PreprocessOptions
) {
  const srcCtx = srcCanvas.getContext('2d')
  const destCtx = destCanvas.getContext('2d')
  if (!srcCtx || !destCtx) return

  const srcW = srcCanvas.width
  const srcH = srcCanvas.height

  // Relative crop percentages
  const cx = Math.max(0, Math.min(srcW - 10, (options.crop.x / 100) * srcW))
  const cy = Math.max(0, Math.min(srcH - 10, (options.crop.y / 100) * srcH))
  const cw = Math.max(10, Math.min(srcW - cx, (options.crop.w / 100) * srcW))
  const ch = Math.max(10, Math.min(srcH - cy, (options.crop.h / 100) * srcH))

  // Set destination dimensions scaled up for OCR resolution
  destCanvas.width = cw * options.scale
  destCanvas.height = ch * options.scale

  destCtx.imageSmoothingEnabled = true
  destCtx.drawImage(srcCanvas, cx, cy, cw, ch, 0, 0, destCanvas.width, destCanvas.height)

  const imgData = destCtx.getImageData(0, 0, destCanvas.width, destCanvas.height)
  const data = imgData.data
  const len = data.length

  for (let i = 0; i < len; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    // 1. Grayscale (Luminance)
    let gray = 0.299 * r + 0.587 * g + 0.114 * b

    // 2. Brightness Correction
    gray += options.brightness

    // 3. Contrast Stretching
    gray = (gray - 128) * options.contrast + 128

    // Clamp values
    gray = Math.max(0, Math.min(255, gray))

    // 4. Binarization
    if (options.binarize) {
      gray = gray > options.threshold ? 255 : 0
    }

    // 5. Color Inversion (Tesseract works best with dark text on white backing)
    if (options.invert) {
      gray = 255 - gray
    }

    data[i] = gray     // Red
    data[i + 1] = gray // Green
    data[i + 2] = gray // Blue
  }

  destCtx.putImageData(imgData, 0, 0)
}
