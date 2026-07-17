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
      // Capture the digits after V or v, ignoring A completely
      const vMatch = cleanText.match(/V\s*[:;]?\s*([0-9.]+)/i)
      if (vMatch) {
        return this.stripLeadingZeros(vMatch[1])
      }
      
      // Fallback: search lines for V and extract digits
      const lines = cleanText.split('\n')
      for (const line of lines) {
        if (/[Vv]/.test(line)) {
          const digits = line.replace(/[^0-9.]/g, '')
          if (digits) {
            return this.stripLeadingZeros(digits)
          }
        }
      }
    }

    if (model === 'model2') {
      // Model 2 Display:
      // 467900.580
      // Extract the single decimal number
      const matches = cleanText.match(/\d+\.\d+/g)
      if (matches && matches.length > 0) {
        return this.stripLeadingZeros(matches[0])
      }

      // Fallback: any number with decimal point
      const decimalMatches = cleanText.match(/[0-9.]+/g)
      if (decimalMatches && decimalMatches.length > 0) {
        const withDot = decimalMatches.find(m => m.includes('.'))
        if (withDot) {
          return this.stripLeadingZeros(withDot)
        }
        return this.stripLeadingZeros(decimalMatches[0])
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
    // If it's a valid decimal starting with 0., leave it alone (e.g. 0.580 -> 0.580)
    // Otherwise strip leading zeros (e.g. 0000322651.700 -> 322651.700, 00.58 -> 0.58)
    const cleaned = value.replace(/^0+(?=\d)/, '')
    // Special case: if we are left with something starting with . (e.g., .700), prepend a 0
    if (cleaned.startsWith('.')) {
      return '0' + cleaned
    }
    return cleaned
  }
}
export default PumpDisplayParser
