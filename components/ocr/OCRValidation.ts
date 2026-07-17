import { validateOcrReading, ValidationResult } from '@/utils/validationRules'

/**
 * Reusable Class to perform client-side check validations on OCR readings.
 */
export class OCRValidation {
  /**
   * Compares the detected reading with the opening reading.
   * Rejects if less than opening, warns if abnormal volume jump.
   */
  static validate(closingVal: string | number, openingVal: string | number): ValidationResult {
    const closing = typeof closingVal === 'string' ? parseFloat(closingVal) : closingVal
    const opening = typeof openingVal === 'string' ? parseFloat(openingVal) : openingVal

    return validateOcrReading(closing, opening)
  }
}
