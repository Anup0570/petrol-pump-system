'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { magneticHover } from '@/lib/motion'

export default function KpiCardClient({ kpi }: { kpi: any }) {
  const [val, setVal] = useState(0)

  // Fluid native requestAnimationFrame counting
  useEffect(() => {
    const rawMatch = kpi.value.replace(/[^0-9.]/g, '')
    const targetValue = parseFloat(rawMatch) || 0

    if (targetValue === 0) {
      setVal(0)
      return
    }

    let startTime: number
    const duration = 1800 // Luxurious 1.8s count up

    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      // Custom easeOutQuart curve 1 - (1 - x)^4
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

  // Format the visual output
  const formatValue = (number: number) => {
    if (kpi.value.includes('₹')) {
      return `₹${Math.floor(number).toLocaleString('en-IN')}`
    } else if (kpi.value.includes('L')) {
      return `${number.toFixed(1)} L`
    }
    return String(Math.floor(number))
  }

  // Extract base color for glow effects
  const hexColor = kpi.color

  return (
    <motion.div 
      willChange="transform"
      whileHover={magneticHover}
      className="glass-panel flex items-start justify-between transform transition-shadow duration-300 group relative overflow-hidden cursor-pointer"
      style={{
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.04)"
      }}
    >
      {/* Background glowing orb */}
      <div 
        className="absolute -right-12 -bottom-12 w-32 h-32 rounded-full opacity-[0.08] blur-2xl transition-all duration-700 ease-out group-hover:opacity-[0.25] group-hover:scale-150"
        style={{ background: hexColor }}
      ></div>
      
      {/* Top reflection line */}
      <div className="absolute top-0 left-0 right-0 h-px transition-opacity duration-500 opacity-0 group-hover:opacity-100"
           style={{ background: `linear-gradient(90deg, transparent, ${hexColor}80, transparent)` }}></div>

      <div className="relative z-10">
        <div className="text-[12px] text-zinc-400 font-bold mb-1.5 uppercase tracking-widest">{kpi.label}</div>
        <div className="text-3xl font-extrabold text-zinc-50 tracking-tight">{formatValue(val)}</div>
      </div>
      
      {/* Icon block */}
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/5 relative z-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <i className={`fa-solid ${kpi.icon} text-xl`} style={{ color: hexColor, filter: `drop-shadow(0 0 8px ${hexColor}80)` }}></i>
      </div>
    </motion.div>
  )
}
