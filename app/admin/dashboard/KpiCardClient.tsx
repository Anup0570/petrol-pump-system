'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { magneticHover } from '@/lib/motion'

export default function KpiCardClient({ kpi }: { kpi: any }) {
  const [val, setVal] = useState(0)

  // requestAnimationFrame count-up
  useEffect(() => {
    const rawMatch = kpi.value.replace(/[^0-9.]/g, '')
    const targetValue = parseFloat(rawMatch) || 0

    if (targetValue === 0) {
      setVal(0)
      return
    }

    let startTime: number
    const duration = 1200 // Swift, professional count up

    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      const easeProgress = 1 - Math.pow(1 - progress, 4)
      setVal(easeProgress * targetValue)

      if (progress < 1) {
        window.requestAnimationFrame(animateCount)
      } else {
        setVal(targetValue)
      }
    }

    window.requestAnimationFrame(animateCount)
  }, [kpi.value])

  const formatValue = (number: number) => {
    if (kpi.value.includes('₹')) {
      return `₹${Math.floor(number).toLocaleString('en-IN')}`
    } else if (kpi.value.includes('L')) {
      return `${number.toFixed(1)} L`
    }
    return String(Math.floor(number))
  }

  const hexColor = kpi.color

  return (
    <motion.div 
      whileHover={magneticHover}
      className="glass-panel flex items-start justify-between group relative overflow-hidden bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 cursor-pointer"
      style={{
        willChange: "transform",
      }}
    >
      {/* Background glowing orb (very soft, clean opacity) */}
      <div 
        className="absolute -right-12 -bottom-12 w-32 h-32 rounded-full opacity-[0.03] blur-xl transition-all duration-700 ease-out group-hover:opacity-[0.07] group-hover:scale-125 pointer-events-none"
        style={{ background: hexColor }}
      />
      
      {/* Top brand accent border indicator */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${hexColor}, transparent)` }}
      />

      <div className="relative z-10">
        <div className="text-[10px] text-slate-400 font-bold mb-1.5 uppercase tracking-widest leading-none">{kpi.label}</div>
        <div className="text-3xl font-black text-slate-800 tracking-tight leading-none mt-1">{formatValue(val)}</div>
      </div>
      
      {/* Icon block with soft light-mode elements */}
      <div 
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 relative z-10 transition-all duration-300 group-hover:scale-105 bg-slate-50 group-hover:bg-slate-100"
      >
        <i 
          className={`fa-solid ${kpi.icon} text-lg`} 
          style={{ 
            color: hexColor, 
          }}
        />
      </div>
    </motion.div>
  )
}
