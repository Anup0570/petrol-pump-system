import { createWorker } from 'tesseract.js'
import { preprocessImage, PreprocessOptions } from '@/utils/imagePreprocessor'

export interface OCRResult {
  rawText: string
  confidence: number
  processingTimeMs: number
}

/**
 * Reusable Class to process an image and perform OCR using Tesseract.js.
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

    // 1. Perform canvas preprocessing
    preprocessImage(srcCanvas, destCanvas, options)

    // 2. Perform OCR on preprocessed canvas
    const dataUrl = destCanvas.toDataURL('image/png')
    
    // Create worker
    const worker = await createWorker('eng')
    
    // Whitelist only digits, decimal point, colon, letters A and V
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789.:AVav',
    })

    const { data: { text, confidence } } = await worker.recognize(dataUrl)
    await worker.terminate()

    const endTime = performance.now()

    return {
      rawText: text,
      confidence: Math.round(confidence),
      processingTimeMs: Math.round(endTime - startTime)
    }
  }
}
