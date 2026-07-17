import { PumpModel } from '@/utils/displayDetection'

/**
 * Reusable Class to parse digital display values depending on the pump model.
 */
export class PumpDisplayParser {
  /**
   * Parses the OCR text according to the target pump model and returns the clean digit string.
   */
  static parse(text: string, model: PumpModel): string {
    const cleanText = text.trim()

    if (model === 'model1') {
      // Model 1 Display:
      // A:00030183023.79
      // V:0000322651.700
      // Capture the digits after V or v:
      const vMatch = cleanText.match(/V\s*[:;]?\s*([0-9.]+)/i)
      if (vMatch) {
        return this.stripLeadingZeros(vMatch[1])
      }
      
      // Fallback: If V is in a line, split and clean
      const lines = cleanText.split('\n')
      const vLine = lines.find(l => l.toUpperCase().includes('V'))
      if (vLine) {
        const digits = vLine.replace(/[^0-9.]/g, '')
        return this.stripLeadingZeros(digits)
      }
    }

    if (model === 'model2') {
      // Model 2 Display:
      // 467900.580
      // Extract numbers with dots
      const matches = cleanText.match(/[0-9.]+/g)
      if (matches && matches.length > 0) {
        const decimalVal = matches.find(m => m.includes('.'))
        if (decimalVal) {
          return this.stripLeadingZeros(decimalVal)
        }
        return this.stripLeadingZeros(matches[0])
      }
    }

    // Default Fallback
    const fallbackDigits = cleanText.replace(/[^0-9.]/g, '')
    return this.stripLeadingZeros(fallbackDigits)
  }

  /**
   * Strips unnecessary leading zeros while keeping decimals intact (e.g. 000539.18 -> 539.18, 00.58 -> 0.58)
   */
  private static stripLeadingZeros(value: string): string {
    return value.replace(/^0+(?=\d)/, '')
  }
}
