'use client'

import { motion } from 'framer-motion'
import { liquidFillVariants, magneticHover } from '@/lib/motion'
import React from 'react'

export default function TankCardClient({ label, fuelType, current, capacity }: { label: string; fuelType: string; current: number; capacity: number }) {
  const pct = Math.min(100, (current / capacity) * 100)
  const isLow = pct < 20
  
  // High-fidelity light theme fuel colors
  let color = '#ff6a00' // Petrol Orange
  let gradient = 'linear-gradient(180deg, #ff7b00 0%, #e65c00 100%)'
  
  if (fuelType === 'diesel') {
    color = '#005b9e' // Diesel Blue
    gradient = 'linear-gradient(180deg, #0ea5e9 0%, #0284c7 100%)'
  }
  
  if (isLow) {
    color = '#ef4444' // Low stock alert red
    gradient = 'linear-gradient(180deg, #f87171 0%, #dc2626 100%)'
  }

  return (
    <motion.div 
      whileHover={magneticHover}
      className="glass-panel overflow-hidden relative bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 cursor-pointer"
      style={{ willChange: "transform" }}
    >
      {/* Soft background glow orb */}
      <div 
        className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full opacity-[0.02] blur-2xl transition-all duration-700 ease-out group-hover:opacity-[0.05] pointer-events-none"
        style={{ background: color }}
      />

      {/* Top reflection brand line */}
      <div 
        className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />

      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="font-bold text-slate-800 text-[15px] flex items-center gap-3 tracking-wide">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
            <i className="fa-solid fa-droplet text-base" style={{ color: color }}></i>
          </div>
          {label}
        </h3>
        <span className={isLow ? 'status-pending badge shadow-sm border border-orange-200/50' : 'status-verified badge shadow-sm border border-emerald-100/50'}>
          {isLow ? 'Low Stock' : 'Stock OK'}
        </span>
      </div>
      
      <div className="flex gap-6 items-center relative z-10 ml-2">
        {/* Light-theme cylinder telemetry tank */}
        <div className="w-[60px] h-[130px] bg-slate-100/85 rounded-2xl border border-slate-200/80 relative overflow-hidden shrink-0 shadow-[inset_0_2px_6px_rgba(0,0,0,0.06)]">
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
            {/* Rippling Waves (Layered SVGs) */}
            <div className="absolute top-[-8px] left-0 w-[200%] h-4 pointer-events-none">
              <svg className="absolute w-full h-full top-0 left-0 fill-current opacity-20 fuel-wave-anim" viewBox="0 0 120 20" preserveAspectRatio="none" style={{ fill: '#ffffff' }}>
                <path d="M0,10 C15,5 35,5 60,10 C85,15 105,15 120,10 L120,20 L0,20 Z" />
              </svg>
              <svg className="absolute w-full h-full top-0 left-0 fill-current opacity-30 fuel-wave-anim" viewBox="0 0 120 20" preserveAspectRatio="none" style={{ fill: '#ffffff', animationDelay: '-4s', animationDuration: '6s' }}>
                <path d="M0,12 C20,15 40,7 60,12 C80,17 100,9 120,12 L120,20 L0,20 Z" />
              </svg>
            </div>
            
            {/* Rising light bubbles */}
            {pct > 5 && [...Array(4)].map((_, i) => (
              <div 
                key={i} 
                className="absolute bubble-anim w-0.5 h-0.5 rounded-full bg-white/50 pointer-events-none"
                style={{
                  left: `${20 + i * 20}%`,
                  bottom: `-6px`,
                  animationDelay: `${i * 0.8}s`,
                  animationDuration: `${3.5 + (i % 2) * 0.5}s`,
                  '--bubble-drift': `${(i % 2 === 0 ? 4 : -4)}px`
                } as React.CSSProperties}
              />
            ))}

            {/* In-liquid glare reflection bar */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/40"></div>
          </motion.div>
          
          {/* External glare reflect */}
          <div className="absolute top-0 right-[4px] bottom-0 w-2 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
        </div>
        
        <div className="flex flex-col">
          <div className="text-4xl font-black text-slate-800 tracking-tighter">
            {Math.round(current).toLocaleString()} <span className="text-lg text-slate-400 font-bold uppercase tracking-wider ml-0.5">L</span>
          </div>
          <div className="text-[10px] text-slate-500 font-semibold mt-1 tracking-wider uppercase">Capacity: {capacity.toLocaleString()} L</div>
          
          {/* Progress bar container */}
          <div className="mt-4 h-1.5 w-44 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 relative">
            <motion.div 
              className="h-full rounded-full" 
              initial={{ width: '0%' }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
              style={{ background: gradient }}
            />
          </div>
          
          <div className="text-[9px] text-slate-400 mt-2 font-bold tracking-widest">{pct.toFixed(1)}% VOL INDEXED</div>
        </div>
      </div>
    </motion.div>
  )
}
