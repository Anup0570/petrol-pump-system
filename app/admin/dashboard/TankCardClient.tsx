'use client'

import { motion } from 'framer-motion'
import { liquidFillVariants, magneticHover } from '@/lib/motion'
import React from 'react'

export default function TankCardClient({ label, fuelType, current, capacity }: { label: string; fuelType: string; current: number; capacity: number }) {
  const pct = Math.min(100, (current / capacity) * 100)
  const isLow = pct < 20
  
  // High-fidelity brand color mappings
  let color = '#ff6a00' // Petrol Orange
  let gradient = 'linear-gradient(180deg, #ff7b00 0%, #cc5200 100%)'
  
  if (fuelType === 'diesel') {
    color = '#0ea5e9' // Diesel Blue
    gradient = 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)'
  }
  
  if (isLow) {
    color = '#f43f5e' // Low stock warning rose
    gradient = 'linear-gradient(180deg, #fb7185 0%, #be123c 100%)'
  }

  return (
    <motion.div 
      whileHover={magneticHover}
      className="glass-panel overflow-hidden relative group cursor-pointer"
      style={{ willChange: "transform" }}
    >
      {/* Dynamic background glow ring */}
      <div 
        className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full opacity-[0.04] blur-[40px] transition-all duration-700 group-hover:opacity-[0.16] group-hover:scale-125"
        style={{ background: color }}
      />

      {/* Top brand line reflect */}
      <div 
        className="absolute top-0 left-0 right-0 h-[1.5px] transition-opacity duration-500 opacity-0 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${color}90, transparent)` }}
      />

      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="font-bold text-zinc-100 text-[15px] flex items-center gap-3.5 tracking-wide">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/50 border border-white/5 shadow-2xl transition-all duration-700 group-hover:rotate-[360deg] group-hover:bg-black/80">
            <i className="fa-solid fa-droplet text-lg" style={{ color: color, filter: `drop-shadow(0 0 8px ${color}80)` }}></i>
          </div>
          {label}
        </h3>
        <span className={isLow ? 'status-pending badge shadow-sm border border-rose-500/20' : 'status-verified badge shadow-sm border border-emerald-500/20'}>
          {isLow ? 'Low Stock alert' : 'Inventory Secured'}
        </span>
      </div>
      
      <div className="flex gap-6 items-center relative z-10 ml-2">
        {/* Telemetry vertical tank cylinder */}
        <div className="w-[64px] h-[130px] bg-black/60 rounded-2xl border border-white/10 relative overflow-hidden shrink-0 shadow-[inset_0_4px_16px_rgba(0,0,0,0.9)]">
          <motion.div 
            className="absolute bottom-0 w-full overflow-hidden"
            variants={liquidFillVariants}
            initial="hidden"
            animate="show"
            custom={pct}
            style={{ 
              background: gradient,
            }}
          >
            {/* Rippling Waves using out-of-phase overlay SVGs */}
            <div className="absolute top-[-8px] left-0 w-[200%] h-5 pointer-events-none">
              <svg className="absolute w-full h-full top-0 left-0 fill-current opacity-30 fuel-wave-anim" viewBox="0 0 120 20" preserveAspectRatio="none" style={{ fill: '#ffffff' }}>
                <path d="M0,10 C15,5 35,5 60,10 C85,15 105,15 120,10 L120,20 L0,20 Z" />
              </svg>
              <svg className="absolute w-full h-full top-0 left-0 fill-current opacity-40 fuel-wave-anim" viewBox="0 0 120 20" preserveAspectRatio="none" style={{ fill: '#ffffff', animationDelay: '-5s', animationDuration: '7s' }}>
                <path d="M0,12 C20,15 40,7 60,12 C80,17 100,9 120,12 L120,20 L0,20 Z" />
              </svg>
            </div>
            
            {/* Rising gas fuel bubbles */}
            {pct > 5 && [...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className="absolute bubble-anim w-1 h-1 rounded-full bg-white/40 pointer-events-none"
                style={{
                  left: `${15 + i * 15}%`,
                  bottom: `-8px`,
                  animationDelay: `${i * 0.7}s`,
                  animationDuration: `${3.2 + (i % 2) * 0.8}s`,
                  '--bubble-drift': `${(i % 2 === 0 ? 5 : -5)}px`
                } as React.CSSProperties}
              />
            ))}

            {/* Specular glass reflection bar inside liquid */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-white/35 blur-[0.5px]"></div>
          </motion.div>
          
          {/* Glass glare line on the cylinder itself */}
          <div className="absolute top-0 right-[4px] bottom-0 w-2.5 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
        </div>
        
        <div className="flex flex-col">
          <div className="text-4xl font-black text-white tracking-tighter">
            {Math.round(current).toLocaleString()} <span className="text-lg text-slate-500 font-extrabold uppercase tracking-wide ml-0.5">L</span>
          </div>
          <div className="text-[10px] text-slate-400 font-bold mt-1.5 tracking-wider uppercase">Capacity: {capacity.toLocaleString()} L</div>
          
          {/* Progress bar fill */}
          <div className="mt-4 h-1.5 w-44 bg-black/50 rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] relative border border-white/5">
            <motion.div 
              className="h-full rounded-full" 
              initial={{ width: '0%' }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              style={{ background: gradient }}
            />
          </div>
          
          <div className="text-[10px] text-slate-400 mt-2.5 font-black tracking-[0.15em]">{pct.toFixed(1)}% TELEMETRY LEVEL</div>
        </div>
      </div>
    </motion.div>
  )
}
