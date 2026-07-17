import { createClient } from '@/lib/supabase/client'

export interface OcrAuditLog {
  image_url: string
  ocr_reading: number | null
  final_reading: number
  confidence: number | null
  ocr_engine?: string
  processing_time_ms: number | null
  verified_by: string
  reading_type: 'opening' | 'closing'
  pump_number: string
  nozzle_number: string
  shift_id: string
}

/**
 * Service to handle uploading OCR photographs and logging entries in the audit trail.
 */
export class OcrService {
  /**
   * Helper to convert base64 dataUrl into a Blob for Supabase storage uploading.
   */
  private static dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }

  /**
   * Uploads base64 photograph to Supabase Storage bucket 'ocr-meter-readings'.
   * Returns public URL of the uploaded image.
   */
  static async uploadReadingImage(dataUrl: string, fileName: string): Promise<string> {
    const supabase = createClient()
    const blob = this.dataUrlToBlob(dataUrl)
    
    const { data, error } = await supabase.storage
      .from('ocr-meter-readings')
      .upload(fileName, blob, {
        contentType: blob.type,
        upsert: true
      })

    if (error) {
      throw new Error(`Failed to upload OCR image: ${error.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('ocr-meter-readings')
      .getPublicUrl(fileName)

    return publicUrl
  }

  /**
   * Inserts an audit log entry in table 'ocr_reading_images'.
   */
  static async insertOcrAuditLog(log: OcrAuditLog): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase
      .from('ocr_reading_images')
      .insert({
        image_url: log.image_url,
        ocr_reading: log.ocr_reading,
        final_reading: log.final_reading,
        confidence: log.confidence,
        ocr_engine: log.ocr_engine || 'Tesseract.js',
        processing_time_ms: log.processing_time_ms,
        verified_by: log.verified_by,
        reading_type: log.reading_type,
        pump_number: log.pump_number,
        nozzle_number: log.nozzle_number,
        shift_id: log.shift_id
      })

    if (error) {
      console.error('Failed to write OCR audit log:', error)
    }
  }

  /**
   * Queries OCR audit log entries for a specific nozzle reading inside a shift.
   */
  static async getOcrAuditLog(shiftId: string, nozzleNumber: string): Promise<any | null> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('ocr_reading_images')
      .select('*')
      .eq('shift_id', shiftId)
      .eq('nozzle_number', nozzleNumber)
      .maybeSingle()

    if (error) {
      console.error('Error fetching OCR audit log:', error)
      return null
    }

    return data
  }
}
