import React from 'react'
import { X, Calendar, User, Percent, Cpu, Activity, Clock, ShieldCheck, ShieldAlert } from 'lucide-react'

interface ReadingImagePreviewProps {
  isOpen: boolean
  onClose: () => void
  auditData: {
    image_url: string
    ocr_reading: number | null
    final_reading: number
    confidence: number | null
    ocr_engine: string
    processing_time_ms: number | null
    verified_by: string
    created_at: string
    pump_number: string
    nozzle_number: string
  } | null
}

export function ReadingImagePreview({ isOpen, onClose, auditData }: ReadingImagePreviewProps) {
  if (!isOpen || !auditData) return null

  // Check if manually edited
  const ocrNum = auditData.ocr_reading !== null ? parseFloat(auditData.ocr_reading.toString()) : null
  const finalNum = parseFloat(auditData.final_reading.toString())
  const isEdited = ocrNum !== null && ocrNum !== finalNum
  
  const formattedDate = new Date(auditData.created_at).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Accent strip */}
        <div className="h-1.5 bg-[#003366]" />

        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-[#003366]" />
              OCR Meter Audit Log
            </h3>
            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
              {auditData.pump_number} • {auditData.nozzle_number}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Left Panel: Captured Photograph */}
          <div className="space-y-2">
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Captured Photograph</span>
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-950 flex items-center justify-center p-1 shadow-inner relative group h-48 md:h-56">
              <img 
                src={auditData.image_url} 
                alt="Audit Original Capture" 
                className="max-h-full max-w-full rounded-xl object-contain"
              />
              <a 
                href={auditData.image_url}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[9px] font-bold py-1 px-2.5 rounded-lg border border-slate-700/50 shadow-sm transition-all"
              >
                View Full Image
              </a>
            </div>
          </div>

          {/* Right Panel: Audit Metrics */}
          <div className="space-y-4">
            
            {/* Status Banner */}
            {isEdited ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2 text-amber-800">
                <ShieldAlert className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider block">Manually Corrected</span>
                  <span className="text-[9px] text-amber-600 font-medium block mt-0.5 leading-relaxed">
                    The operator modified the detected OCR reading value prior to shift submission.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-green-50 border border-green-200 rounded-2xl flex items-start gap-2 text-green-800">
                <ShieldCheck className="w-4.5 h-4.5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider block">AI Verified</span>
                  <span className="text-[9px] text-green-600 font-medium block mt-0.5 leading-relaxed">
                    The saved final reading matches the OCR detected reading exactly.
                  </span>
                </div>
              </div>
            )}

            {/* Read Comparison block */}
            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 space-y-3 font-semibold text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/40">
                <span className="text-slate-400 font-bold uppercase text-[9px]">OCR Output</span>
                <span className="font-mono font-black text-slate-800 text-sm">
                  {auditData.ocr_reading !== null ? auditData.ocr_reading : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#003366] font-bold uppercase text-[9px]">Saved Final Reading</span>
                <span className="font-mono font-black text-[#003366] text-base">
                  {auditData.final_reading}
                </span>
              </div>
            </div>

            {/* Audit log rows */}
            <div className="space-y-2.5 text-xs">
              
              <div className="flex items-center justify-between text-slate-600 py-1.5 border-b border-slate-100">
                <span className="flex items-center gap-1.5 font-bold text-[9px] uppercase text-slate-400">
                  <User className="w-3.5 h-3.5" /> Verified By
                </span>
                <span className="font-bold text-slate-800">{auditData.verified_by}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600 py-1.5 border-b border-slate-100">
                <span className="flex items-center gap-1.5 font-bold text-[9px] uppercase text-slate-400">
                  <Calendar className="w-3.5 h-3.5" /> Date & Time
                </span>
                <span className="font-bold text-slate-800 text-right">{formattedDate}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600 py-1.5 border-b border-slate-100">
                <span className="flex items-center gap-1.5 font-bold text-[9px] uppercase text-slate-400">
                  <Percent className="w-3.5 h-3.5" /> OCR Confidence
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {auditData.confidence !== null ? `${auditData.confidence}%` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 py-1.5 border-b border-slate-100">
                <span className="flex items-center gap-1.5 font-bold text-[9px] uppercase text-slate-400">
                  <Clock className="w-3.5 h-3.5" /> Speed / Engine
                </span>
                <span className="font-mono font-bold text-slate-800 text-right">
                  {auditData.processing_time_ms !== null ? `${auditData.processing_time_ms}ms` : '—'} ({auditData.ocr_engine})
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* Footer controls */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 text-right">
          <button
            onClick={onClose}
            className="px-6 h-10 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  )
}
export default ReadingImagePreview
