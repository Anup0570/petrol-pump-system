'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { magneticHover } from '@/lib/motion'

export default function KpiCardClient({ kpi }: { kpi: any }) {
  const [val, setVal] = useState(0)

  // RequestAnimationFrame count-up
  useEffect(() => {
    const rawMatch = kpi.value.replace(/[^0-9.]/g, '')
    const targetValue = parseFloat(rawMatch) || 0

    if (targetValue === 0) {
      setVal(0)
      return
    }

    let startTime: number
    const duration = 1500 // 1.5s swift count up

    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      // easeOutQuart curve
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
      className="glass-panel flex items-start justify-between group relative overflow-hidden cursor-pointer"
      style={{
        willChange: "transform",
      }}
    >
      {/* Background glowing orb */}
      <div 
        className="absolute -right-12 -bottom-12 w-36 h-36 rounded-full opacity-[0.05] blur-2xl transition-all duration-700 ease-out group-hover:opacity-[0.22] group-hover:scale-150"
        style={{ background: hexColor }}
      />
      
      {/* Top reflection brand line */}
      <div 
        className="absolute top-0 left-0 right-0 h-[1.5px] transition-opacity duration-500 opacity-0 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${hexColor}, transparent)` }}
      />

      {/* Floating accent light */}
      <div 
        className="absolute -left-10 -top-10 w-20 h-20 rounded-full opacity-0 group-hover:opacity-[0.05] blur-xl transition-all duration-700"
        style={{ background: hexColor }}
      />

      <div className="relative z-10">
        <div className="text-[10px] text-slate-400 font-bold mb-2 uppercase tracking-widest leading-none">{kpi.label}</div>
        <div className="text-3xl font-black text-white tracking-tight">{formatValue(val)}</div>
      </div>
      
      {/* Icon block with custom glow */}
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/5 relative z-10 transition-all duration-500 group-hover:scale-110 group-hover:rotate-[15deg] group-hover:bg-white/10"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <i 
          className={`fa-solid ${kpi.icon} text-lg`} 
          style={{ 
            color: hexColor, 
            filter: `drop-shadow(0 0 10px ${hexColor}90)` 
          }}
        />
      </div>
    </motion.div>
  )
}
