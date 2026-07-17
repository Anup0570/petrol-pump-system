export type PumpModel = 'model1' | 'model2' | 'unknown'

/**
 * Inspects OCR raw text to automatically classify the pump display model.
 */
export function detectPumpModel(text: string): PumpModel {
  const cleanText = text.trim()
  
  // Model 1 contains label prefixes 'A:' and 'V:' (or near-matches due to OCR typos like 'A' or 'V' with colon/semicolon)
  const hasA = /A\s*[:;]/.test(cleanText) || cleanText.includes('A:')
  const hasV = /V\s*[:;]/.test(cleanText) || cleanText.includes('V:')
  
  if (hasA && hasV) {
    return 'model1'
  }

  // Model 2 contains a single block of digits with a decimal dot (e.g. 467900.580)
  const decimalMatches = cleanText.match(/\d+\.\d+/g)
  if (decimalMatches && decimalMatches.length === 1) {
    return 'model2'
  }

  // Fallback check: if there is a decimal but no A/V indicators
  if (cleanText.includes('.')) {
    return 'model2'
  }

  return 'unknown'
}
