import { useState } from 'react'

export interface OcrMetadataEntry {
  ocr_reading: number | null
  confidence: number | null
  speedMs: number | null
  base64: string
}

export function useOCR() {
  const [activeNozzleId, setActiveNozzleId] = useState<string | null>(null)
  const [activeNozzleLabel, setActiveNozzleLabel] = useState<string>('')
  const [activeOpeningReading, setActiveOpeningReading] = useState<number>(0)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  // Map to store OCR audit logs per nozzle ID
  const [ocrRecords, setOcrRecords] = useState<Record<string, OcrMetadataEntry>>({})
  
  // Track whether the nozzle input was filled using OCR (for the ✅ AI Read badge)
  const [ocrVerified, setOcrVerified] = useState<Record<string, boolean>>({})

  const startOcrFlow = (nozzleId: string, label: string, opening: number, dataUrl: string) => {
    setActiveNozzleId(nozzleId)
    setActiveNozzleLabel(label)
    setActiveOpeningReading(opening)
    setImageSrc(dataUrl)
    setIsModalOpen(true)
  }

  const confirmOcrFlow = (
    finalReading: string,
    confidence: number,
    timeMs: number,
    base64Image: string
  ) => {
    if (!activeNozzleId) return null

    const finalNum = parseFloat(finalReading)

    // Store metadata details for submission audit logs
    setOcrRecords(prev => ({
      ...prev,
      [activeNozzleId]: {
        ocr_reading: isNaN(parseFloat(finalReading)) ? null : parseFloat(finalReading),
        confidence: confidence || null,
        speedMs: timeMs || null,
        base64: base64Image
      }
    }))

    // Flag as AI read verified
    setOcrVerified(prev => ({
      ...prev,
      [activeNozzleId]: true
    }))

    // Reset workflow
    setIsModalOpen(false)
    setActiveNozzleId(null)
    setImageSrc(null)

    return {
      nozzleId: activeNozzleId,
      value: finalReading
    }
  }

  const cancelOcrFlow = () => {
    setIsModalOpen(false)
    setActiveNozzleId(null)
    setImageSrc(null)
  }

  const clearOcrNozzle = (nozzleId: string) => {
    setOcrVerified(prev => ({
      ...prev,
      [nozzleId]: false
    }))
    setOcrRecords(prev => {
      const copy = { ...prev }
      delete copy[nozzleId]
      return copy
    })
  }

  return {
    activeNozzleId,
    activeNozzleLabel,
    activeOpeningReading,
    imageSrc,
    isModalOpen,
    ocrRecords,
    ocrVerified,
    startOcrFlow,
    confirmOcrFlow,
    cancelOcrFlow,
    clearOcrNozzle,
    setOcrVerified
  }
}
export default useOCR
