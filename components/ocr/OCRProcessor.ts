import { createWorker } from 'tesseract.js'
import { Capacitor } from '@capacitor/core'
import { preprocessImage, PreprocessOptions } from '@/utils/imagePreprocessor'

export interface OCRResult {
  rawText: string
  confidence: number
  processingTimeMs: number
  ocrEngine: string
}

/**
 * Reusable Class to process an image and perform OCR using Google ML Kit or Tesseract.js.
 */
export class OCRProcessor {
  /**
   * Performs image preprocessing on the canvas and runs local offline OCR.
   */
  static async process(
    srcCanvas: HTMLCanvasElement,
    destCanvas: HTMLCanvasElement,
    options: PreprocessOptions
  ): Promise<OCRResult> {
    const startTime = performance.now()
    let rawText = ''
    let confidence = 0
    let ocrEngine = 'Tesseract.js'

    // 1. Perform canvas preprocessing (auto-crop, binarization, adaptive threshold, sharpening, noise removal)
    preprocessImage(srcCanvas, destCanvas, options)

    // 2. Perform OCR on preprocessed canvas
    try {
      const isNative = Capacitor.isNativePlatform()

      if (isNative) {
        // Native Google ML Kit Text Recognition
        ocrEngine = 'Google ML Kit'
        const nativeResult = await this.runNativeMLKit(destCanvas)
        rawText = nativeResult.text
        confidence = nativeResult.confidence
      } else {
        // Web development fallback using Tesseract.js
        ocrEngine = 'Tesseract.js'
        const tesseractResult = await this.runWebTesseract(destCanvas)
        rawText = tesseractResult.text
        confidence = tesseractResult.confidence
      }
    } catch (err) {
      console.error('Failed primary OCR engine. Attempting Tesseract fallback...', err)
      try {
        ocrEngine = 'Tesseract.js (Fallback)'
        const tesseractResult = await this.runWebTesseract(destCanvas)
        rawText = tesseractResult.text
        confidence = tesseractResult.confidence
      } catch (fallbackErr) {
        console.error('All OCR engines failed:', fallbackErr)
        throw new Error('OCR recognition failure')
      }
    }

    const endTime = performance.now()

    return {
      rawText,
      confidence,
      ocrEngine,
      processingTimeMs: Math.round(endTime - startTime)
    }
  }

  /**
   * Helper to execute Google ML Kit OCR on Capacitor native platforms
   */
  private static async runNativeMLKit(canvas: HTMLCanvasElement): Promise<{ text: string; confidence: number }> {
    // Dynamic import to prevent bundler errors on unsupported server rendering
    const { Filesystem, Directory } = await import('@capacitor/filesystem')
    const { TextRecognition, Script } = await import('@capacitor-mlkit/text-recognition')

    const dataUrl = canvas.toDataURL('image/png')
    const cleanBase64 = dataUrl.split(',')[1] || dataUrl
    const fileName = `ocr_temp_${Date.now()}.png`

    // 1. Write the preprocessed cropped image as a temp file
    await Filesystem.writeFile({
      path: fileName,
      data: cleanBase64,
      directory: Directory.Cache,
    })

    // 2. Obtain file URI
    const uriResult = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Cache,
    })

    // 3. Process image with Google ML Kit
    const ocrResult = await TextRecognition.processImage({
      path: uriResult.uri,
      script: Script.Latin,
    })

    // 4. Delete the temp file asynchronously
    Filesystem.deleteFile({
      path: fileName,
      directory: Directory.Cache,
    }).catch(err => console.error('Failed to delete temp file:', err))

    // Estimate ML Kit layout confidence
    const detectedModel = this.detectModelHeuristically(ocrResult.text)
    const confidence = this.estimateConfidence(ocrResult.text, detectedModel)

    return {
      text: ocrResult.text,
      confidence
    }
  }

  /**
   * Helper to execute Tesseract.js OCR on Web platforms
   */
  private static async runWebTesseract(canvas: HTMLCanvasElement): Promise<{ text: string; confidence: number }> {
    const dataUrl = canvas.toDataURL('image/png')
    
    // Create worker
    const worker = await createWorker('eng')
    
    // Whitelist only digits, decimal point, colon, and letters A and V
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789.:AVav',
    })

    const { data: { text, confidence } } = await worker.recognize(dataUrl)
    await worker.terminate()

    return {
      text,
      confidence: Math.round(confidence)
    }
  }

  /**
   * Helper to detect pump display layout model in OCR text
   */
  private static detectModelHeuristically(text: string): 'model1' | 'model2' {
    const upperText = text.toUpperCase()
    const hasA = /A\s*[:;]/.test(upperText) || upperText.includes('A:')
    const hasV = /V\s*[:;]/.test(upperText) || upperText.includes('V:')
    return (hasA && hasV) ? 'model1' : 'model2'
  }

  /**
   * Heuristically estimates the confidence score of ML Kit output based on layout matching
   */
  private static estimateConfidence(text: string, model: 'model1' | 'model2'): number {
    const upperText = text.trim().toUpperCase()
    
    if (model === 'model1') {
      const hasA = /A\s*[:;]/.test(upperText) || upperText.includes('A:')
      const hasV = /V\s*[:;]/.test(upperText) || upperText.includes('V:')
      const vMatch = upperText.match(/V\s*[:;]?\s*([0-9.]+)/)
      
      if (hasA && hasV && vMatch && vMatch[1].includes('.')) {
        return 99 // Perfect Model 1 Match
      } else if (hasV && vMatch) {
        return 92 // Found closing digits but labeling is slightly flawed
      } else if (vMatch) {
        return 85 // Extracted digits but formatting is problematic
      }
    } else {
      // Model 2
      const decimalMatches = upperText.match(/\d+\.\d+/)
      if (decimalMatches && decimalMatches.length === 1) {
        const parts = decimalMatches[0].split('.')
        if (parts[1].length === 3) {
          return 99 // Perfect Model 2 with 3 decimal digits
        }
        return 95 // Model 2 layout with non-standard decimal length
      } else if (upperText.includes('.')) {
        return 90 // Decimals found but layout is cluttered
      }
    }
    
    return 75 // Poor display matches or empty
  }
}
export default OCRProcessor
