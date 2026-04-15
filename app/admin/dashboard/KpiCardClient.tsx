'use client'

import { useEffect, useState } from 'react'

export default function KpiCardClient({ kpi }: { kpi: any }) {
  const [val, setVal] = useState(0)

  // Extract number from string, animate it
  useEffect(() => {
    // If value is a string like "₹1,234" or "100.5 L"
    const isCurrency = kpi.value.includes('₹')
    const isLiters = kpi.value.includes('L')
    const rawMatch = kpi.value.replace(/[^0-9.]/g, '')
    const targetValue = parseFloat(rawMatch) || 0

    if (targetValue === 0) {
      setVal(0)
      return
    }

    const duration = 1500 // ms
    const frameRate = 1000 / 60
    const totalFrames = Math.round(duration / frameRate)
    let frame = 0

    const counter = setInterval(() => {
      frame++
      const progress = easeOutExpo(frame / totalFrames)
      setVal(progress * targetValue)

      if (frame >= totalFrames) {
        clearInterval(counter)
        setVal(targetValue)
      }
    }, frameRate)

    return () => clearInterval(counter)
  }, [kpi.value])

  const easeOutExpo = (x: number): number => {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)
  }

  // Format the visual output
  const formatValue = (number: number) => {
    if (kpi.value.includes('₹')) {
      return `₹${Math.floor(number).toLocaleString('en-IN')}`
    } else if (kpi.value.includes('L')) {
      return `${number.toFixed(1)} L`
    }
    return String(Math.floor(number))
  }

  return (
    <div className="glass-panel flex items-start justify-between p-5 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] cursor-default group relative overflow-hidden">
      {/* Background glowing orb */}
      <div 
        className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full opacity-10 blur-xl transition-all duration-500 group-hover:opacity-30 group-hover:scale-150"
        style={{ background: kpi.color }}
      ></div>
      <div className="relative z-10">
        <div className="text-[13px] text-slate-400 font-semibold mb-2">{kpi.label}</div>
        <div className="text-2xl font-bold text-white tracking-tight">{formatValue(val)}</div>
      </div>
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm relative z-10 transition-transform group-hover:scale-110"
        style={{ background: kpi.bg }}
      >
        <i className={`fa-solid ${kpi.icon} text-xl`} style={{ color: kpi.color }}></i>
      </div>
    </div>
  )
}
