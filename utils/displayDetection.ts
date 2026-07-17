export type PumpModel = 'model1' | 'model2'

/**
 * Inspects OCR raw text to automatically classify the pump display model.
 */
export function detectPumpModel(text: string): PumpModel {
  const upperText = text.toUpperCase()
  
  // Model 1 contains label prefixes 'A:' and 'V:' (or near-matches like A/V with colon/semicolon)
  const hasA = /A\s*[:;]/.test(upperText) || upperText.includes('A:')
  const hasV = /V\s*[:;]/.test(upperText) || upperText.includes('V:')
  
  if (hasA && hasV) {
    return 'model1'
  }

  // Otherwise, use Model 2 parser
  return 'model2'
}

