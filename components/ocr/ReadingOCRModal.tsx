import React, { useState, useEffect, useRef } from 'react'
import { 
  Check, 
  Edit2, 
  RotateCcw, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2, 
  TrendingUp, 
  Clock 
} from 'lucide-react'
import { OCRProcessor } from './OCRProcessor'
import { DisplayDetector } from './DisplayDetector'
import { PumpDisplayParser } from './PumpDisplayParser'
import { OCRValidation } from './OCRValidation'

interface ReadingOCRModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string | null
  openingReading: number
  onConfirm: (finalReading: string, confidence: number, timeMs: number, originalBase64: string) => void
  onRetake: () => void
  nozzleLabel: string
}

export function ReadingOCRModal({
  isOpen,
  onClose,
  imageSrc,
  openingReading,
  onConfirm,
  onRetake,
  nozzleLabel
}: ReadingOCRModalProps) {
  const [statusText, setStatusText] = useState<string>('Initializing...')
  const [loading, setLoading] = useState<boolean>(true)
  
  // OCR Outcome
  const [rawText, setRawText] = useState<string>('')
  const [parsedReading, setParsedReading] = useState<string>('')
  const [confidence, setConfidence] = useState<number>(0)
  const [processingTime, setProcessingTime] = useState<number>(0)
  
  // Editing state
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editedReading, setEditedReading] = useState<string>('')

  // Validation Warnings
  const [warnings, setWarnings] = useState<string[]>([])

  // Canvases for OCR
  const srcCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const destCanvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (isOpen && imageSrc) {
      runOcrProcess()
    } else {
      // Reset state
      setLoading(true)
      setRawText('')
      setParsedReading('')
      setConfidence(0)
      setProcessingTime(0)
      setIsEditing(false)
      setWarnings([])
    }
  }, [isOpen, imageSrc])

  const runOcrProcess = async () => {
    if (!imageSrc) return
    setLoading(true)
    setStatusText('Reading meter display...')

    // Delay slightly to simulate processing steps and show smooth UI transitions
    await new Promise((resolve) => setTimeout(resolve, 300))
    setStatusText('Detecting display layout...')

    const img = new Image()
    img.onload = async () => {
      const srcCanvas = srcCanvasRef.current || document.createElement('canvas')
      const destCanvas = destCanvasRef.current || document.createElement('canvas')
      
      srcCanvas.width = 400
      srcCanvas.height = 200
      const ctx = srcCanvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(img, 0, 0, 400, 200)

      setStatusText('Extracting reading...')
      try {
        // Set standard preprocessing parameters optimal for digital displays
        const options = {
          brightness: 0,
          contrast: 1.6,
          binarize: true,
          threshold: 120,
          invert: false,
          scale: 2,
          crop: { x: 5, y: 5, w: 90, h: 90 }
        }

        const ocrResult = await OCRProcessor.process(srcCanvas, destCanvas, options)
        
        // Detect Model
        const model = DisplayDetector.detect(ocrResult.rawText)
        
        // Parse digits
        const parsed = PumpDisplayParser.parse(ocrResult.rawText, model)

        setRawText(ocrResult.rawText)
        setParsedReading(parsed)
        setEditedReading(parsed)
        setConfidence(ocrResult.confidence)
        setProcessingTime(ocrResult.processingTimeMs)

        // Validate
        const validation = OCRValidation.validate(parsed, openingReading)
        setWarnings(validation.warnings)
      } catch (err) {
        console.error('OCR pipeline error:', err)
        setParsedReading('')
        setWarnings(['OCR Engine failure. Please type manual entry.'])
      } finally {
        setLoading(false)
      }
    }
    img.src = imageSrc
  }

  // Handle manual edits
  const handleConfirm = () => {
    const finalVal = isEditing ? editedReading : parsedReading
    onConfirm(finalVal, confidence, processingTime, imageSrc || '')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
      {/* Hidden canvases for processing */}
      <div className="hidden">
        <canvas ref={srcCanvasRef} width="400" height="200" />
        <canvas ref={destCanvasRef} width="400" height="200" />
      </div>

      <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Top header accent */}
        <div className="h-1.5 bg-[#FF6600]" />

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <SparklesIcon className="w-4 h-4 text-[#FF6600]" />
              AI Reading Confirmation
            </h3>
            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{nozzleLabel}</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="w-10 h-10 text-[#FF6600] animate-spin" />
              <div className="text-center">
                <span className="text-sm font-bold text-slate-700 block">{statusText}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Applying binarization filters...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Display visual cropped region */}
              {imageSrc && (
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 flex justify-center p-1.5 shadow-inner">
                  <img 
                    src={imageSrc} 
                    alt="Captured Meter Display" 
                    className="max-h-36 w-auto rounded-lg object-contain"
                  />
                </div>
              )}

              {/* Detected readingsMonospace block */}
              {parsedReading ? (
                <div className="space-y-3">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">Detected Reading</span>
                  
                  {!isEditing ? (
                    <div className="bg-slate-900 border border-slate-800 text-[#FF6600] rounded-2xl p-4 text-center font-mono font-black text-3xl tracking-widest">
                      {parsedReading}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        value={editedReading}
                        onChange={(e) => setEditedReading(e.target.value)}
                        className="w-full text-center font-mono font-bold text-2xl border border-[#FF6600] text-slate-800 py-3 rounded-2xl"
                      />
                      <span className="block text-[9px] text-slate-400 font-bold text-center">Edit value if numbers were misread</span>
                    </div>
                  )}

                  {/* Confidence and speed */}
                  <div className="grid grid-cols-2 gap-2 text-center text-[10px] bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                    <div>
                      <span className="text-slate-400 font-bold block">Confidence Score</span>
                      <span className="font-mono font-black text-slate-800 text-xs flex items-center justify-center gap-1 mt-0.5">
                        <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                        {confidence}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block">Processing Time</span>
                      <span className="font-mono font-black text-slate-800 text-xs flex items-center justify-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {processingTime} ms
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center text-rose-700 space-y-2">
                  <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
                  <div>
                    <span className="text-sm font-bold block">Unable to detect reading</span>
                    <span className="text-[10px] text-rose-500 font-medium block mt-0.5">Poor contrast or block reflection detected.</span>
                  </div>
                </div>
              )}

              {/* Validation Warnings */}
              {warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Validation Guard Warnings ({warnings.length})
                  </span>
                  <ul className="list-disc pl-3.5 text-[9px] text-amber-700 space-y-1 leading-relaxed">
                    {warnings.map((w, idx) => <li key={idx}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer controls */}
        {!loading && (
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex gap-2">
            {parsedReading ? (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex-1 h-10 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
                
                <button
                  onClick={handleConfirm}
                  className="flex-1 h-10 bg-[#003366] hover:bg-[#002244] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  Use Reading
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 h-10 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  Manual Entry
                </button>
                <button
                  onClick={onRetake}
                  className="flex-1 h-10 bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5 animate-spin-reverse" />
                  Retake Photo
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5 5 3Z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" />
    </svg>
  )
}

export default ReadingOCRModal
