export interface ValidationResult {
  isValid: boolean
  warnings: string[]
}

/**
 * Validates the parsed closing reading against the opening reading.
 * Checks for monotonicity and flags abnormal spikes.
 */
export function validateOcrReading(
  closing: number,
  opening: number,
  thresholdJump = 5000
): ValidationResult {
  const warnings: string[] = []

  if (isNaN(closing)) {
    return {
      isValid: false,
      warnings: ['No valid digits detected. Please enter manually.']
    }
  }

  // Rule 1: Closing must be greater than opening
  if (closing < opening) {
    warnings.push(`Closing reading (${closing.toFixed(2)}) is less than the Opening reading (${opening.toFixed(2)}). This is mathematically impossible without a pump reset.`)
  }

  // Rule 2: Cannot be identical to opening (unless zero sales occurred, which is rare but possible)
  if (closing === opening) {
    warnings.push(`Closing reading is identical to the Opening reading. Confirm if no fuel was sold from this nozzle during this shift.`)
  }

  // Rule 3: Abnormal jump check
  const difference = closing - opening
  if (difference > thresholdJump) {
    warnings.push(`Abnormal sales jump detected (+${difference.toFixed(2)} Litres). This exceeds the expected shift threshold of ${thresholdJump} L. Verify display digits for decimal misalignment.`)
  }

  return {
    isValid: warnings.length === 0,
    warnings
  }
}
