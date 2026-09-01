import React, { useState, useEffect, useRef } from 'react'
import { 
  Check, 
  Edit2, 
  RotateCcw, 
  X, 
  AlertTriangle, 
  Loader2, 
  TrendingUp, 
  Clock,
  Sparkles,
  Crop,
  Bug,
  Sliders
} from 'lucide-react'
import { OCRProcessor } from './OCRProcessor'
import { DisplayDetector } from './DisplayDetector'
import { PumpDisplayParser } from './PumpDisplayParser'
import { OCRValidation } from './OCRValidation'
import { autoDetectLcdScreen } from '@/utils/imagePreprocessor'

interface ReadingOCRModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string | null
  openingReading: number
  onConfirm: (
    finalReading: string,
    confidence: number,
    timeMs: number,
    originalBase64: string,
    ocrEngine: string
  ) => void
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
  const [ocrEngineUsed, setOcrEngineUsed] = useState<string>('Tesseract.js')
  
  // Editing state
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editedReading, setEditedReading] = useState<string>('')

  // Validation Warnings
  const [warnings, setWarnings] = useState<string[]>([])
  const [hasError, setHasError] = useState<boolean>(false)

  // Interactive Cropping states
  const [crop, setCrop] = useState<{ x: number; y: number; w: number; h: number }>({ x: 10, y: 15, w: 80, h: 70 })
  const [autoCropSuccess, setAutoCropSuccess] = useState<boolean>(false)
  const [triggerOcrCounter, setTriggerOcrCounter] = useState<number>(0)
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  // Debug panel state
  const [debugMode, setDebugMode] = useState<boolean>(false)

  // Canvases for OCR & Debugging
  const srcCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const destCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const croppedCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && imageSrc) {
      // Clear states and detect LCD screen on the initial image
      setLoading(true)
      setStatusText('Analyzing display LCD screen...')
      
      const img = new Image()
      img.onload = () => {
        const srcCanvas = srcCanvasRef.current || document.createElement('canvas')
        srcCanvas.width = img.naturalWidth
        srcCanvas.height = img.naturalHeight
        
        const ctx = srcCanvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          // Run Sobel-based automatic LCD display border detection (with margin frame exclusion)
          const detected = autoDetectLcdScreen(srcCanvas)
          if (detected) {
            setCrop(detected)
            setAutoCropSuccess(true)
          } else {
            // Default center-ish crop
            setCrop({ x: 10, y: 15, w: 80, h: 70 })
            setAutoCropSuccess(false)
          }
        }
        
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
        setTriggerOcrCounter(1)
      }
      img.src = imageSrc
    } else {
      // Reset state on close
      setLoading(true)
      setRawText('')
      setParsedReading('')
      setConfidence(0)
      setProcessingTime(0)
      setIsEditing(false)
      setWarnings([])
      setAutoCropSuccess(false)
      setTriggerOcrCounter(0)
    }
  }, [isOpen, imageSrc])

  // Run the OCR processing whenever triggerOcrCounter updates (initial load or manual crop adjustment)
  useEffect(() => {
    if (isOpen && imageSrc && triggerOcrCounter > 0) {
      runOcrProcess()
    }
  }, [triggerOcrCounter])

  const runOcrProcess = async () => {
    if (!imageSrc) return
    setLoading(true)
    setStatusText('Running OCR Recognition...')

    const img = new Image()
    img.onload = async () => {
      const srcCanvas = srcCanvasRef.current || document.createElement('canvas')
      const destCanvas = destCanvasRef.current || document.createElement('canvas')
      const croppedCanvas = croppedCanvasRef.current
      
      srcCanvas.width = img.naturalWidth
      srcCanvas.height = img.naturalHeight
      const ctx = srcCanvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(img, 0, 0)

      // Calculate absolute pixel coordinates for the crop region to draw the raw Cropped LCD debug preview
      const cx = Math.max(0, Math.min(img.naturalWidth - 10, (crop.x / 100) * img.naturalWidth))
      const cy = Math.max(0, Math.min(img.naturalHeight - 10, (crop.y / 100) * img.naturalHeight))
      const cw = Math.max(10, Math.min(img.naturalWidth - cx, (crop.w / 100) * img.naturalWidth))
      const ch = Math.max(10, Math.min(img.naturalHeight - cy, (crop.h / 100) * img.naturalHeight))

      if (croppedCanvas) {
        croppedCanvas.width = cw
        croppedCanvas.height = ch
        const croppedCtx = croppedCanvas.getContext('2d')
        if (croppedCtx) {
          croppedCtx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch)
        }
      }

      try {
        setHasError(false)
        // Preprocessor options: adaptiveThreshold (Bradley-Roth binarization)
        const options = {
          brightness: 0,
          contrast: 1.8,
          binarize: true,
          threshold: 120,
          adaptiveThreshold: true,
          invert: false,
          scale: 2,
          crop: crop
        }

        const ocrResult = await OCRProcessor.process(srcCanvas, destCanvas, options)
        
        // Detect Model
        const model = ocrResult.displayModel === 'MODEL_1' ? 'model1' : (ocrResult.displayModel === 'MODEL_2' ? 'model2' : DisplayDetector.detect(ocrResult.rawText))
        
        // Parse digits
        const parsed = ocrResult.parsedReading || PumpDisplayParser.parse(ocrResult.rawText, model)

        setRawText(ocrResult.rawText)
        setParsedReading(parsed)
        setEditedReading(parsed)
        setConfidence(ocrResult.confidence)
        setOcrEngineUsed(ocrResult.ocrEngine)
        setProcessingTime(ocrResult.processingTimeMs)

        // Validate closing reading against opening reading
        const validation = OCRValidation.validate(parsed, openingReading)
        setWarnings(validation.warnings)
      } catch (err: any) {
        console.error('OCR pipeline error:', err)
        setParsedReading('')
        setHasError(true)
        setWarnings(['AI reading temporarily unavailable.'])
      } finally {
        setLoading(false)
      }
    }
    img.src = imageSrc
  }

  // Handle dragging/resizing pointers for the interactive crop box
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>, handle: string) => {
    e.preventDefault()
    e.stopPropagation()
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const startX = e.clientX
    const startY = e.clientY
    const startCrop = { ...crop }

    const target = e.target as HTMLElement
    target.setPointerCapture(e.pointerId)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = ((moveEvent.clientX - startX) / rect.width) * 100
      const dy = ((moveEvent.clientY - startY) / rect.height) * 100

      setCrop(prev => {
        const next = { ...prev }

        if (handle === 'move') {
          next.x = Math.max(0, Math.min(100 - prev.w, startCrop.x + dx))
          next.y = Math.max(0, Math.min(100 - prev.h, startCrop.y + dy))
        } else {
          if (handle.includes('r')) {
            next.w = Math.max(10, Math.min(100 - startCrop.x, startCrop.w + dx))
          }
          if (handle.includes('l')) {
            const newX = Math.max(0, Math.min(startCrop.x + startCrop.w - 10, startCrop.x + dx))
            next.w = startCrop.x + startCrop.w - newX
            next.x = newX
          }
          if (handle.includes('b')) {
            next.h = Math.max(10, Math.min(100 - startCrop.y, startCrop.h + dy))
          }
          if (handle.includes('t')) {
            const newY = Math.max(0, Math.min(startCrop.y + startCrop.h - 10, startCrop.y + dy))
            next.h = startCrop.y + startCrop.h - newY
            next.y = newY
          }
        }
        return next
      })
    }

    const handlePointerUp = () => {
      target.releasePointerCapture(e.pointerId)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      
      // Trigger new OCR calculation on drag release
      setTriggerOcrCounter(prev => prev + 1)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  // Handle final confirmations
  const handleConfirm = () => {
    const finalVal = isEditing ? editedReading : parsedReading
    onConfirm(finalVal, confidence, processingTime, imageSrc || '', ocrEngineUsed)
  }

  if (!isOpen) return null

  // Determine confidence color styling
  let confColor = 'text-rose-600 bg-rose-50 border-rose-200'
  if (confidence >= 98) {
    confColor = 'text-emerald-600 bg-emerald-50 border-emerald-200'
  } else if (confidence >= 90) {
    confColor = 'text-amber-600 bg-amber-50 border-amber-200'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
      {/* Hidden container for main processing (visible canvases are loaded dynamically in debug view) */}
      <div className="hidden">
        <canvas ref={srcCanvasRef} />
      </div>

      <div className={`bg-white border border-slate-200 w-full ${debugMode ? 'max-w-2xl' : 'max-w-md'} rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[95vh] transition-all duration-300`}>
        {/* Top header accent */}
        <div className="h-1.5 bg-[#FF6600]" />

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#FF6600]" />
              AI Meter Reading V2
            </h3>
            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{nozzleLabel}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Toggle Debug Mode Button */}
            <button
              type="button"
              onClick={() => setDebugMode(!debugMode)}
              className={`p-1.5 rounded-lg border transition-all flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider ${
                debugMode 
                  ? 'bg-slate-900 border-slate-800 text-[#FF6600]' 
                  : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
              title="Toggle Diagnostic Debug Mode"
            >
              <Bug className="w-4 h-4" />
              {debugMode ? 'Debug ON' : 'Debug'}
            </button>

            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Section: Original Image with Drag & Resize Interactive Cropping Bounding Box */}
          {imageSrc && (
            <div className="space-y-1">
              <span className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <Crop className="w-3 h-3 text-[#FF6600]" />
                Original Photo (Drag Box / Corners to Crop)
              </span>
              
              <div 
                ref={containerRef}
                className="relative rounded-2xl border border-slate-200 bg-slate-950 overflow-hidden select-none flex items-center justify-center h-44 md:h-52"
              >
                <img 
                  src={imageSrc} 
                  alt="Captured Meter Original" 
                  className="max-h-full max-w-full object-contain pointer-events-none"
                />
                
                {/* Crop Overlay Area */}
                <div 
                  className="absolute border-2 border-dashed border-[#FF6600] bg-[#FF6600]/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)] touch-none cursor-move flex items-center justify-center"
                  style={{
                    left: `${crop.x}%`,
                    top: `${crop.y}%`,
                    width: `${crop.w}%`,
                    height: `${crop.h}%`
                  }}
                  onPointerDown={(e) => handlePointerDown(e, 'move')}
                >
                  <div className="w-full h-full border border-[#FF6600]/25 relative pointer-events-none">
                    {/* Corner resize drag circles */}
                    <div 
                      className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-[#FF6600] border-2 border-white rounded-full cursor-nwse-resize pointer-events-auto"
                      onPointerDown={(e) => handlePointerDown(e, 'tl')}
                    />
                    <div 
                      className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#FF6600] border-2 border-white rounded-full cursor-nesw-resize pointer-events-auto"
                      onPointerDown={(e) => handlePointerDown(e, 'tr')}
                    />
                    <div 
                      className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-[#FF6600] border-2 border-white rounded-full cursor-nesw-resize pointer-events-auto"
                      onPointerDown={(e) => handlePointerDown(e, 'bl')}
                    />
                    <div 
                      className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-[#FF6600] border-2 border-white rounded-full cursor-nwse-resize pointer-events-auto"
                      onPointerDown={(e) => handlePointerDown(e, 'br')}
                    />
                  </div>
                </div>

                {autoCropSuccess && (
                  <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[7px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm pointer-events-none select-none">
                    Auto-Cropped LCD
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Diagnostic Debug Panels: Cropped LCD & Processed OCR Input Canvases */}
          <div className={debugMode ? "grid grid-cols-2 gap-4 border border-slate-200/60 p-3 rounded-2xl bg-slate-50/50" : "hidden"}>
            <div className="space-y-1">
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">Cropped LCD (No Filters)</span>
              <div className="border border-slate-200 bg-slate-900 rounded-xl p-1 flex justify-center items-center h-28 overflow-hidden">
                <canvas ref={croppedCanvasRef} className="max-h-full max-w-full object-contain rounded" />
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">Processed OCR Input (160px H)</span>
              <div className="border border-slate-200 bg-slate-900 rounded-xl p-1 flex justify-center items-center h-28 overflow-hidden">
                <canvas ref={destCanvasRef} className="max-h-full max-w-full object-contain rounded" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Loader2 className="w-8 h-8 text-[#FF6600] animate-spin" />
              <div className="text-center">
                <span className="text-xs font-bold text-slate-700 block">{statusText}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Running localized binarization filters...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Detected Monospace reading value */}
              {parsedReading ? (
                <div className="space-y-3">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">AI Reading Detected</span>
                  
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
                        className="w-full text-center font-mono font-bold text-2xl border border-[#FF6600] text-slate-800 py-3 rounded-2xl focus:outline-none"
                      />
                      <span className="block text-[9px] text-slate-400 font-bold text-center">Correct digits manually if misread by AI</span>
                    </div>
                  )}

                  {/* Confidence and Speed metrics info */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-slate-50 border border-slate-200/55 p-3 rounded-2xl font-semibold">
                    <div className={`rounded-xl border p-2 flex flex-col items-center justify-center ${confColor}`}>
                      <span className="text-[9px] font-bold opacity-80">Confidence</span>
                      <span className="font-mono font-black text-xs flex items-center justify-center gap-0.5 mt-0.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {confidence}%
                      </span>
                    </div>
                    
                    <div className="p-2 border border-slate-200/40 rounded-xl bg-white flex flex-col items-center justify-center text-slate-600">
                      <span className="text-[9px] font-bold text-slate-400">OCR Engine</span>
                      <span className="font-bold text-xs mt-0.5 text-slate-700 truncate w-full px-1">
                        {ocrEngineUsed}
                      </span>
                    </div>

                    <div className="p-2 border border-slate-200/40 rounded-xl bg-white flex flex-col items-center justify-center text-slate-600">
                      <span className="text-[9px] font-bold text-slate-400">OCR Speed</span>
                      <span className="font-mono font-bold text-xs flex items-center justify-center gap-0.5 mt-0.5 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {processingTime} ms
                      </span>
                    </div>
                  </div>

                  {/* Low Confidence Warning warning / Retake recommendation */}
                  {confidence < 90 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-rose-800">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider block">Low Confidence Detected ({confidence}%)</span>
                        <span className="text-[9px] text-rose-600 font-medium block mt-0.5 leading-normal">
                          Luminance or glare issue makes this reading unreliable. We highly recommend clicking **Retake Photo** to try again.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : hasError ? (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center text-rose-700 space-y-2">
                  <AlertTriangle className="w-8 h-8 text-[#FF6600] mx-auto" />
                  <div>
                    <span className="text-sm font-bold block text-slate-800">AI reading temporarily unavailable.</span>
                    <span className="text-[10px] text-rose-500 font-semibold block mt-1">
                      The PaddleOCR service is offline or unreachable. Please retry, retake photo, adjust crop, or proceed with manual entry.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center text-rose-700 space-y-2">
                  <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
                  <div>
                    <span className="text-sm font-bold block">Unable to detect reading</span>
                    <span className="text-[10px] text-rose-500 font-medium block mt-0.5">
                      Poor contrast, reflection glare, or LCD digit segments not detected. Check crop box size and background.
                    </span>
                  </div>
                </div>
              )}

              {/* Debug Console Panel */}
              {debugMode && (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl text-left">
                  <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider border-b border-slate-200/50 pb-1.5 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#FF6600]" />
                    Engine Diagnostic Console
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-400 uppercase text-[8px]">Raw OCR Characters</span>
                      <pre className="p-2.5 bg-slate-950 text-emerald-450 font-mono rounded-xl max-h-28 overflow-y-auto border border-slate-800 text-left whitespace-pre-wrap leading-normal shadow-inner select-text">
                        {rawText || '(Empty Output)'}
                      </pre>
                    </div>
                    
                    <div className="space-y-2 font-semibold">
                      <div className="flex justify-between py-1 border-b border-slate-200/40">
                        <span className="text-slate-400 uppercase text-[8px]">Parsed Output</span>
                        <span className="font-mono text-slate-800 font-bold">{parsedReading || '(NaN)'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/40">
                        <span className="text-slate-400 uppercase text-[8px]">Classified Layout</span>
                        <span className="text-slate-800 font-bold">
                          {rawText ? (DisplayDetector.detect(rawText) === 'model1' ? 'Model 1 (A:/V: labels)' : 'Model 2 (Single Value)') : 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200/40">
                        <span className="text-slate-400 uppercase text-[8px]">Active Driver</span>
                        <span className="text-[#FF6600] font-bold">{ocrEngineUsed}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Warnings list block */}
              {warnings.length > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-black text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Validation Alert Warnings ({warnings.length})
                  </span>
                  <ul className="list-disc pl-4 text-[9px] text-amber-700 space-y-1 leading-relaxed">
                    {warnings.map((w, idx) => <li key={idx} className="font-semibold">{w}</li>)}
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
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex-1 h-10 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
                
                <button
                  type="button"
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
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-10 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  Manual Entry
                </button>
                <button
                  type="button"
                  onClick={() => setTriggerOcrCounter(prev => prev + 1)}
                  className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={onRetake}
                  className="flex-1 h-10 bg-[#FF6600] hover:bg-[#E65C00] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
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

export default ReadingOCRModal
