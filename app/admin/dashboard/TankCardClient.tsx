'use client'

import { motion } from 'framer-motion'

export default function TankCardClient({ label, fuelType, current, capacity }: { label: string; fuelType: string; current: number; capacity: number }) {
  const pct = Math.min(100, (current / capacity) * 100)
  const isLow = pct < 20
  const color = fuelType === 'petrol' ? (isLow ? '#e11d48' : '#ea580c') : (isLow ? '#e11d48' : '#2563eb')
  const gradient = fuelType === 'petrol' 
    ? (isLow ? 'linear-gradient(to top, #be123c, #f43f5e)' : 'linear-gradient(to top, #c2410c, #f97316)') 
    : (isLow ? 'linear-gradient(to top, #be123c, #f43f5e)' : 'linear-gradient(to top, #1d4ed8, #3b82f6)')

  return (
    <motion.div 
      className="glass-panel p-6 overflow-hidden relative group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Decorative blurred background orb */}
      <div 
        className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:opacity-20 group-hover:scale-125"
        style={{ background: color }}
      ></div>

      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="font-bold text-slate-200 text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800 border border-slate-700 shadow-sm transition-transform duration-500 group-hover:rotate-[360deg]">
            <i className="fa-solid fa-gas-pump" style={{ color: fuelType === 'petrol' ? 'var(--petrol)' : 'var(--diesel)' }}></i>
          </div>
          {label}
        </h3>
        <span className={isLow ? 'status-pending badge' : 'status-verified badge'}>
          {isLow ? 'Low Stock' : 'Stock OK'}
        </span>
      </div>
      
      <div className="flex gap-6 items-center relative z-10">
        {/* Visual tank */}
        <div className="w-[60px] h-[120px] bg-slate-800/50 rounded-xl border-2 border-slate-700/60 relative overflow-hidden shrink-0 shadow-inner">
          <motion.div 
            className="absolute bottom-0 w-full"
            initial={{ height: '0%' }}
            animate={{ height: `${pct}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ background: gradient, boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4)' }}
          >
            {/* Fluid bubbles effect */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/40"></div>
          </motion.div>
        </div>
        <div>
          <div className="text-4xl font-black text-white tracking-tight">{Math.round(current).toLocaleString()} <span className="text-xl text-slate-500 font-semibold uppercase">L</span></div>
          <div className="text-[13px] text-slate-400 font-medium mt-1">of {capacity.toLocaleString()} L capacity</div>
          
          <div className="mt-4 h-2 w-36 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50 shadow-inner relative">
            <motion.div 
              className="h-full rounded-full" 
              initial={{ width: '0%' }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ background: gradient }}
            ></motion.div>
          </div>
          <div className="text-[12px] text-slate-400 mt-2 font-bold tracking-wide">{pct.toFixed(1)}% FULL</div>
        </div>
      </div>
    </motion.div>
  )
}
