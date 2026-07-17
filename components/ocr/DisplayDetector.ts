import { detectPumpModel, PumpModel } from '@/utils/displayDetection'

/**
 * Reusable Class to detect the pump model (Model 1 with A/V tags or Model 2 with single decimal).
 */
export class DisplayDetector {
  static detect(text: string): PumpModel {
    return detectPumpModel(text)
  }
}
