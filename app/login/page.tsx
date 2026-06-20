'use client'

import { useSearchParams } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { Suspense } from 'react'
import { login } from './actions'
import { motion, AnimatePresence } from 'framer-motion'
import { pageFadeIn, containerVariants, itemVariants, floatMotion, buttonHover } from '@/lib/motion'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <motion.button
      whileHover={!pending ? buttonHover : {}}
      whileTap={!pending ? { scale: 0.98 } : {}}
      type="submit"
      disabled={pending}
      className={`btn-primary w-full py-4 rounded-xl text-[15px] font-bold mt-2 relative overflow-hidden`}
    >
      {pending ? (
        <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Initializing Terminal...</>
      ) : (
        <><i className="fa-solid fa-key mr-2"></i> Authenticate Protocol</>
      )}
    </motion.button>
  )
}

function EnergyNozzleScene() {
  return (
    <div className="w-full h-28 relative mb-6 rounded-2xl overflow-hidden bg-black/60 border border-white/5 flex flex-col items-center justify-center shadow-[inset_0_4px_20px_rgba(0,0,0,0.6)]">
      {/* Grid line overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      
      {/* Background glow orbs */}
      <div className="absolute left-1/4 top-1/4 w-12 h-12 rounded-full bg-blue-500/10 blur-xl"></div>
      <div className="absolute right-1/4 bottom-1/4 w-12 h-12 rounded-full bg-orange-500/10 blur-xl"></div>
      
      {/* Interactive energy nozzle SVG */}
      <svg className="w-56 h-16 relative z-10" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Left fuel dispenser column */}
        <rect x="8" y="10" width="20" height="40" rx="4" fill="#0f172a" stroke="rgba(255,255,255,0.08)" />
        <rect x="12" y="14" width="12" height="10" rx="2" fill="rgba(255, 106, 0, 0.15)" stroke="rgba(255, 106, 0, 0.3)" />
        <line x1="12" y1="32" x2="24" y2="32" stroke="rgba(255,255,255,0.15)" />
        <line x1="12" y1="38" x2="20" y2="38" stroke="rgba(255,255,255,0.15)" />
        
        {/* Right high-tech nozzle lock */}
        <rect x="172" y="10" width="20" height="40" rx="4" fill="#0f172a" stroke="rgba(255,255,255,0.08)" />
        <circle cx="182" cy="30" r="6" fill="#ff6a00" style={{ filter: 'drop-shadow(0 0 10px #ff6a00)' }} />
        <path d="M178 30H186" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M182 26V34" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

        {/* Transfer hose line (Path with glowing dash arrays) */}
        <path d="M28 30C78 30 78 12 118 12C158 12 122 30 172 30" stroke="rgba(255,255,255,0.05)" strokeWidth="4" strokeLinecap="round" />
        <path d="M28 30C78 30 78 12 118 12C158 12 122 30 172 30" stroke="rgba(255, 106, 0, 0.15)" strokeWidth="2" strokeLinecap="round" />
        
        <motion.path 
          d="M28 30C78 30 78 12 118 12C158 12 122 30 172 30" 
          stroke="url(#nozzleFlowGrad)" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeDasharray="18, 48"
          animate={{ strokeDashoffset: [-66, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        />
        
        <defs>
          <linearGradient id="nozzleFlowGrad" x1="28" y1="21" x2="172" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ff6a00" />
            <stop offset="0.5" stopColor="#ffffff" />
            <stop offset="1" stopColor="#ff6a00" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Floating droplets inside the energy display */}
      <motion.div 
        animate={{ x: [0, 20, 0], y: [0, -3, 0], opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/3 top-1/4 w-1.5 h-1.5 rounded-full bg-orange-400 blur-[0.5px]"
      />
      <motion.div 
        animate={{ x: [0, -15, 0], y: [0, 4, 0], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        className="absolute right-1/3 bottom-1/4 w-1.5 h-1.5 rounded-full bg-emerald-400 blur-[0.5px]"
      />
      
      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.25em] absolute bottom-2">Live Fuel Grid link</span>
    </div>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <motion.form 
      action={login}
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-5 mt-6"
    >
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold"
          >
            <i className="fa-solid fa-triangle-exclamation mr-2"></i> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants}>
        <label className="block text-[10px] font-bold mb-2 text-zinc-400 uppercase tracking-widest">
          Operator Terminal ID
        </label>
        <div className="relative">
          <input
            name="email"
            type="email"
            required
            className="w-full pl-11"
            placeholder="admin@saipriyafuels.com"
          />
          <i className="fa-regular fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm"></i>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <label className="block text-[10px] font-bold mb-2 text-zinc-400 uppercase tracking-widest">
          Security Key
        </label>
        <div className="relative">
          <input
            name="password"
            type="password"
            required
            className="w-full pl-11"
            placeholder="••••••••"
          />
          <i className="fa-solid fa-shield-halved absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm"></i>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="pt-2">
        <SubmitButton />
      </motion.div>
    </motion.form>
  )
}

export default function LoginPage() {
  return (
    <motion.div 
      variants={pageFadeIn}
      initial="hidden"
      animate="show"
      exit="exit"
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#060813]"
    >
      {/* 15 Floating fuel droplets in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="droplet-particle w-1.5 h-3 rounded-full bg-gradient-to-t from-[#ff6a00] to-[#ffa600] opacity-50 blur-[0.5px]"
            style={{
              left: `${8 + i * 6.5}%`,
              bottom: `-20px`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${5.5 + (i % 3) * 1.5}s`,
            }}
          />
        ))}
      </div>

      {/* Super Premium Slow-pulsing Ambient Background Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.35, 0.15],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-orange-600/10 blur-[140px] pointer-events-none"
      />

      <div className="w-full max-w-[450px] relative z-10">
        <motion.div 
          className="text-center mb-8 relative"
          variants={itemVariants}
          initial="hidden"
          animate="show"
        >
          {/* Main Hero Icon / Glow */}
          <motion.div 
            variants={floatMotion}
            animate="animate"
            className="w-24 h-24 mx-auto bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl relative z-10 mb-6"
          >
            {/* Inner glow ring */}
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-orange-500/20 to-orange-500/0 pointer-events-none"></div>
            <i className="fa-solid fa-gas-pump text-[#ff6a00] text-4xl" style={{ filter: 'drop-shadow(0 0 15px rgba(255,106,0,0.65))' }}></i>
            
            {/* The animated liquid drop */}
            <motion.div 
              animate={{ 
                y: [0, 16, 0], 
                opacity: [0.25, 1, 0.25],
                scale: [0.75, 1.1, 0.75]
              }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 text-[#ff6a00] text-xl"
            >
              <i className="fa-solid fa-droplet" style={{ filter: 'drop-shadow(0 0 6px #ff6a00)' }}></i>
            </motion.div>
          </motion.div>
          
          <h1 className="text-4xl font-black text-white tracking-tight bg-clip-text bg-gradient-to-r from-white via-white to-zinc-400">Sai Priya Fuels</h1>
          <p className="text-[#ff6a00] font-bold mt-2.5 tracking-[0.25em] uppercase text-xs">
            System Operations Panel
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div 
          variants={itemVariants}
          className="glass-panel p-8 sm:p-10 relative overflow-hidden"
        >
          {/* Top orange brand highlight */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff6a00] to-transparent"></div>
          
          <h2 className="text-xl font-extrabold text-white text-center tracking-tight">Access Terminal</h2>
          <p className="text-center text-xs text-zinc-400 mt-1.5 mb-6">Encrypted credential matrix authentication</p>

          {/* Glowing flow simulation */}
          <EnergyNozzleScene />

          <Suspense fallback={
            <div className="text-zinc-400 text-center py-10 flex flex-col items-center justify-center gap-3">
              <motion.i 
                animate={{ rotate: 360 }} 
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="fa-solid fa-circle-notch text-2xl text-[#ff6a00]"
              />
              <span className="text-[11px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Synchronizing...</span>
            </div>
          }>
            <LoginForm />
          </Suspense>
        </motion.div>
        
        {/* Security badge */}
        <motion.div 
          variants={itemVariants}
          className="mt-8 flex justify-center items-center gap-2.5 text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]"
        >
          <i className="fa-solid fa-circle-check text-emerald-500"></i> SSL Sec_Protocol Active
        </motion.div>
      </div>
    </motion.div>
  )
}