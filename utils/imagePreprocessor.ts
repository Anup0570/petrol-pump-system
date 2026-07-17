export interface PreprocessOptions {
  brightness: number
  contrast: number
  binarize: boolean
  threshold: number // used for manual global threshold fallback
  adaptiveThreshold: boolean // true for Bradley-Roth
  invert: boolean
  scale: number
  crop: { x: number; y: number; w: number; h: number } // coordinates in percentages (0-100)
}

/**
 * Automatically detects the LCD screen region using Sobel edge projections.
 * Returns coordinates as percentage crop parameters { x, y, w, h } or null if detection fails.
 */
export function autoDetectLcdScreen(srcCanvas: HTMLCanvasElement): { x: number; y: number; w: number; h: number } | null {
  const width = 300
  const height = 150
  
  // Create a small temp canvas for analysis
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = width
  tempCanvas.height = height
  const ctx = tempCanvas.getContext('2d')
  if (!ctx) return null

  // Draw scaled down image
  ctx.drawImage(srcCanvas, 0, 0, width, height)
  const imgData = ctx.getImageData(0, 0, width, height)
  const data = imgData.data

  // 1. Grayscale
  const gray = new Uint8Array(width * height)
  for (let i = 0; i < data.length; i += 4) {
    gray[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
  }

  // 2. Sobel Edge Detection
  const edge = new Float32Array(width * height)
  const colSum = new Float32Array(width)
  const rowSum = new Float32Array(height)

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      
      // Sobel Kernels
      const gx =
        -1 * gray[idx - width - 1] + 1 * gray[idx - width + 1] +
        -2 * gray[idx - 1]         + 2 * gray[idx + 1] +
        -1 * gray[idx + width - 1] + 1 * gray[idx + width + 1]

      const gy =
        -1 * gray[idx - width - 1] - 2 * gray[idx - width] - 1 * gray[idx - width + 1] +
        1 * gray[idx + width - 1] + 2 * gray[idx + width] + 1 * gray[idx + width + 1]

      const val = Math.sqrt(gx * gx + gy * gy)
      edge[idx] = val
      colSum[x] += val
      rowSum[y] += val
    }
  }

  // 3. Find boundaries by checking where edge activity is high
  const maxCol = Math.max(...Array.from(colSum))
  const maxRow = Math.max(...Array.from(rowSum))

  if (maxCol === 0 || maxRow === 0) return null

  // Threshold: 20% of max activity or average activity
  const colThreshold = maxCol * 0.25
  const rowThreshold = maxRow * 0.25

  let xMin = 0
  let xMax = width - 1
  let yMin = 0
  let yMax = height - 1

  // Find xMin (left bound)
  for (let x = 5; x < width - 5; x++) {
    if (colSum[x] > colThreshold) {
      xMin = x
      break
    }
  }

  // Find xMax (right bound)
  for (let x = width - 6; x > 5; x--) {
    if (colSum[x] > colThreshold) {
      xMax = x
      break
    }
  }

  // Find yMin (top bound)
  for (let y = 5; y < height - 5; y++) {
    if (rowSum[y] > rowThreshold) {
      yMin = y
      break
    }
  }

  // Find yMax (bottom bound)
  for (let y = height - 6; y > 5; y--) {
    if (rowSum[y] > rowThreshold) {
      yMax = y
      break
    }
  }

  // Add padding
  xMin = Math.max(0, xMin - 10)
  xMax = Math.min(width - 1, xMax + 10)
  yMin = Math.max(0, yMin - 8)
  yMax = Math.min(height - 1, yMax + 8)

  const detectedW = xMax - xMin
  const detectedH = yMax - yMin

  // Check if coordinates represent a reasonable size display
  const wPercent = (detectedW / width) * 100
  const hPercent = (detectedH / height) * 100
  const aspect = detectedW / detectedH

  // LCD screens are generally landscape rectangles (aspect ratio typically 2.0 to 4.5)
  if (wPercent >= 25 && hPercent >= 15 && aspect >= 1.5 && aspect <= 5.0) {
    return {
      x: Math.round((xMin / width) * 100),
      y: Math.round((yMin / height) * 100),
      w: Math.round(wPercent),
      h: Math.round(hPercent)
    }
  }

  return null
}

/**
 * Preprocesses a source canvas by cropping, resizing, and applying advanced pixel filters.
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

  const w = destCanvas.width
  const h = destCanvas.height
  const imgData = destCtx.getImageData(0, 0, w, h)
  const data = imgData.data

  // 1. Grayscale & Brightness/Contrast Normalization
  const gray = new Uint8Array(w * h)
  let minLum = 255
  let maxLum = 0

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    
    // Grayscale luminance conversion
    let val = 0.299 * r + 0.587 * g + 0.114 * b
    
    // Brightness adjustment
    val += options.brightness
    
    // Contrast adjustment
    val = (val - 128) * options.contrast + 128
    
    const valClamped = Math.max(0, Math.min(255, val))
    gray[i / 4] = valClamped

    if (valClamped < minLum) minLum = valClamped
    if (valClamped > maxLum) maxLum = valClamped
  }

  // 2. Contrast Stretching (Histogram normalization)
  // Stretch minimum and maximum values to full 0-255 range if there's enough difference
  if (maxLum - minLum > 10) {
    for (let i = 0; i < gray.length; i++) {
      gray[i] = Math.round(((gray[i] - minLum) / (maxLum - minLum)) * 255)
    }
  }

  // 3. Noise Removal (3x3 Box Blur Filter)
  const tempGray = new Uint8Array(gray)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x
      const sum = 
        tempGray[idx - w - 1] + tempGray[idx - w] + tempGray[idx - w + 1] +
        tempGray[idx - 1]     + tempGray[idx]     + tempGray[idx + 1] +
        tempGray[idx + w - 1] + tempGray[idx + w] + tempGray[idx + w + 1]
      gray[idx] = Math.round(sum / 9)
    }
  }

  // 4. Edge Sharpening (Laplacian Sharpen Filter Kernel)
  const tempSharpen = new Uint8Array(gray)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x
      const sharpened = 
        5 * tempSharpen[idx] -
        tempSharpen[idx - w] - tempSharpen[idx - 1] -
        tempSharpen[idx + 1] - tempSharpen[idx + w]
      gray[idx] = Math.max(0, Math.min(255, sharpened))
    }
  }

  // 5. Binarization (Adaptive vs Global)
  if (options.binarize) {
    if (options.adaptiveThreshold) {
      // Bradley-Roth Adaptive Thresholding
      // Compute integral image
      const integral = new Float64Array(w * h)
      for (let y = 0; y < h; y++) {
        let sum = 0
        for (let x = 0; x < w; x++) {
          const idx = y * w + x
          sum += gray[idx]
          if (y === 0) {
            integral[idx] = sum
          } else {
            integral[idx] = integral[idx - w] + sum
          }
        }
      }

      // Perform thresholding
      const S = Math.round(w / 8) // window size
      const t = 15 // threshold percentage (15% darker than average is black)
      
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x
          
          const x1 = Math.max(0, x - S / 2)
          const x2 = Math.min(w - 1, x + S / 2)
          const y1 = Math.max(0, y - S / 2)
          const y2 = Math.min(h - 1, y + S / 2)
          
          const count = (x2 - x1) * (y2 - y1)
          
          const idx_br = y2 * w + x2
          const idx_bl = y2 * w + x1
          const idx_tr = y1 * w + x2
          const idx_tl = y1 * w + x1
          
          const sum = integral[idx_br] - integral[idx_bl] - integral[idx_tr] + integral[idx_tl]
          
          if (gray[idx] * count < sum * (100 - t) / 100) {
            gray[idx] = 0 // text
          } else {
            gray[idx] = 255 // background
          }
        }
      }
    } else {
      // Global thresholding fallback
      for (let i = 0; i < gray.length; i++) {
        gray[i] = gray[i] > options.threshold ? 255 : 0
      }
    }
  }

  // 6. Inversion
  if (options.invert) {
    for (let i = 0; i < gray.length; i++) {
      gray[i] = 255 - gray[i]
    }
  }

  // Write back to canvas image data
  for (let i = 0; i < data.length; i += 4) {
    const val = gray[i / 4]
    data[i] = val     // Red
    data[i + 1] = val // Green
    data[i + 2] = val // Blue
    data[i + 3] = 255 // Alpha (opaque)
  }

  destCtx.putImageData(imgData, 0, 0)
}
