'use client'

import { motion } from 'framer-motion'
import { liquidFillVariants, magneticHover } from '@/lib/motion'

export default function TankCardClient({ label, fuelType, current, capacity }: { label: string; fuelType: string; current: number; capacity: number }) {
  const pct = Math.min(100, (current / capacity) * 100)
  const isLow = pct < 20
  
  // Neon mapping
  const color = fuelType === 'petrol' ? (isLow ? '#ef4444' : '#f97316') : (isLow ? '#ef4444' : '#0ea5e9')
  const gradient = fuelType === 'petrol' 
    ? (isLow ? 'linear-gradient(to top, #7f1d1d, #ef4444)' : 'linear-gradient(to top, #9a3412, #f97316)') 
    : (isLow ? 'linear-gradient(to top, #7f1d1d, #ef4444)' : 'linear-gradient(to top, #075985, #0ea5e9)')

  return (
    <motion.div 
      whileHover={magneticHover}
      className="glass-panel overflow-hidden relative group cursor-pointer"
      style={{ willChange: "transform" }}
    >
      {/* Decorative blurred background orb */}
      <div 
        className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full opacity-[0.05] blur-[40px] transition-all duration-700 group-hover:opacity-[0.15] group-hover:scale-125"
        style={{ background: color }}
      ></div>

      {/* Top reflection line */}
      <div className="absolute top-0 left-0 right-0 h-px transition-opacity duration-500 opacity-0 group-hover:opacity-100"
           style={{ background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }}></div>

      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="font-bold text-zinc-100 text-[15px] flex items-center gap-3 tracking-wide">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/40 border border-white/5 shadow-2xl transition-all duration-700 group-hover:rotate-[360deg] group-hover:bg-black/60">
            <i className="fa-solid fa-gas-pump" style={{ color: color, filter: `drop-shadow(0 0 8px ${color}80)` }}></i>
          </div>
          {label}
        </h3>
        <span className={isLow ? 'status-pending badge' : 'status-verified badge'}>
          {isLow ? 'Low Stock' : 'Stock OK'}
        </span>
      </div>
      
      <div className="flex gap-6 items-center relative z-10 ml-2">
        {/* Visual tank architecture */}
        <div className="w-[60px] h-[120px] bg-black/60 rounded-xl border border-white/10 relative overflow-hidden shrink-0 shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)]">
          <motion.div 
            className="absolute bottom-0 w-full"
            variants={liquidFillVariants}
            initial="hidden"
            animate="show"
            custom={pct}
            style={{ background: gradient, boxShadow: 'inset 0 4px 6px rgba(255,255,255,0.3)' }}
          >
            {/* Fluid surface specular highlight */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/60 blur-[1px]"></div>
          </motion.div>
        </div>
        
        <div className="flex flex-col">
          <div className="text-4xl font-black text-white tracking-tighter">
            {Math.round(current).toLocaleString()} <span className="text-xl text-zinc-500 font-bold uppercase tracking-wider ml-1">L</span>
          </div>
          <div className="text-xs text-zinc-500 font-medium mt-1 tracking-wider uppercase">of {capacity.toLocaleString()} L capacity</div>
          
          <div className="mt-4 h-1.5 w-40 bg-black/50 rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] relative">
            <motion.div 
              className="h-full rounded-full" 
              initial={{ width: '0%' }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{ background: gradient }}
            ></motion.div>
          </div>
          {/* Animated percentage counter using framer motion layout trick implicitly */}
          <div className="text-[11px] text-zinc-400 mt-2 font-bold tracking-widest">{pct.toFixed(1)}% FILLED</div>
        </div>
      </div>
    </motion.div>
  )
}
