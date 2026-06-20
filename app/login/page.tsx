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
      className="btn-primary w-full py-3.5 rounded-xl text-[15px] font-bold mt-2 relative overflow-hidden cursor-pointer"
    >
      {pending ? (
        <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Accessing Console...</>
      ) : (
        <><i className="fa-solid fa-key mr-2"></i> Log In to Console</>
      )}
    </motion.button>
  )
}

function StationIllustration() {
  return (
    <div className="w-full h-32 relative mb-6 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex flex-col items-center justify-center shadow-inner">
      {/* Soft layout grid outlines */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      
      {/* Premium vector illustration of a modern petrol pump station */}
      <svg className="w-52 h-24 relative z-10" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Base Platform / Ground */}
        <line x1="10" y1="70" x2="190" y2="70" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
        
        {/* Canopy Structure */}
        <rect x="25" y="12" width="150" height="8" rx="2" fill="#ff6a00" />
        <rect x="25" y="20" width="150" height="2" fill="#005b9e" />
        
        {/* Supporting Pillars */}
        <path d="M45 22L45 70" stroke="#94a3b8" strokeWidth="3" />
        <path d="M155 22L155 70" stroke="#94a3b8" strokeWidth="3" />
        
        {/* Main Brand Logo Banner */}
        <rect x="75" y="25" width="50" height="12" rx="2" fill="#005b9e" />
        <circle cx="100" cy="31" r="3" fill="#ff6a00" />
        
        {/* Fuel Dispenser 1 (Petrol) */}
        <rect x="62" y="44" width="22" height="26" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        <rect x="66" y="48" width="14" height="6" rx="1" fill="#f1f5f9" stroke="#e2e8f0" />
        {/* Dispenser Hose */}
        <path d="M84 52C88 52 88 64 84 64" stroke="#ff6a00" strokeWidth="1.5" fill="none" />
        
        {/* Fuel Dispenser 2 (Diesel) */}
        <rect x="116" y="44" width="22" height="26" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        <rect x="120" y="48" width="14" height="6" rx="1" fill="#f1f5f9" stroke="#e2e8f0" />
        {/* Dispenser Hose */}
        <path d="M116 52C112 52 112 64 116 64" stroke="#005b9e" strokeWidth="1.5" fill="none" />
        
        {/* Cloud decorations */}
        <path d="M15 25C15 23 18 21 21 22C22 21 26 21 27 23C28 23 29 25 28 27C27 28 17 28 15 25Z" fill="#e2e8f0" opacity="0.6" />
        <path d="M172 32C172 30 174 28 176 29C178 28 180 29 181 31C182 31 183 33 182 34C180 35 174 35 172 32Z" fill="#e2e8f0" opacity="0.6" />
      </svg>
      
      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest absolute bottom-1.5">Operations Command Console</span>
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
      className="flex flex-col gap-5 mt-4"
    >
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold"
          >
            <i className="fa-solid fa-triangle-exclamation mr-2"></i> {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants}>
        <label className="block text-[10px] font-bold mb-2 text-slate-500 uppercase tracking-widest">
          Operator ID (Email)
        </label>
        <div className="relative">
          <input
            name="email"
            type="email"
            required
            className="w-full pl-11 border-slate-200 text-slate-900 bg-white"
            placeholder="admin@saipriyafuels.com"
          />
          <i className="fa-regular fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <label className="block text-[10px] font-bold mb-2 text-slate-500 uppercase tracking-widest">
          Security Key
        </label>
        <div className="relative">
          <input
            name="password"
            type="password"
            required
            className="w-full pl-11 border-slate-200 text-slate-900 bg-white"
            placeholder="••••••••"
          />
          <i className="fa-solid fa-shield-halved absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
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
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#f8fafc]"
    >
      {/* Soft warm light theme background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#ff6a00]/3 blur-[110px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#005b9e]/3 blur-[110px] pointer-events-none" />

      <div className="w-full max-w-[450px] relative z-10">
        <motion.div 
          className="text-center mb-6 relative"
          variants={itemVariants}
          initial="hidden"
          animate="show"
        >
          {/* Main Hero Icon / Glow */}
          <motion.div 
            variants={floatMotion}
            animate="animate"
            className="w-20 h-20 mx-auto bg-white border border-slate-200 rounded-[1.75rem] flex items-center justify-center shadow-sm relative z-10 mb-4"
          >
            <i className="fa-solid fa-gas-pump text-[#ff6a00] text-3xl"></i>
          </motion.div>
          
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sai Priya Fuels</h1>
          <p className="text-[#ff6a00] font-bold mt-1.5 tracking-[0.2em] uppercase text-[10px]">
            Enterprise ERP Terminal
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div 
          variants={itemVariants}
          className="glass-panel bg-white border border-slate-200/80 p-8 sm:p-10 shadow-xl relative overflow-hidden"
        >
          {/* Top orange brand bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#ff6a00]"></div>
          
          <h2 className="text-lg font-bold text-slate-800 text-center tracking-tight">System Authentication</h2>
          <p className="text-center text-xs text-slate-400 mt-1 mb-5">Authorized station operators login below</p>

          {/* Station Vector Illustration */}
          <StationIllustration />

          <Suspense fallback={
            <div className="text-slate-400 text-center py-10 flex flex-col items-center justify-center gap-3">
              <motion.i 
                animate={{ rotate: 360 }} 
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="fa-solid fa-circle-notch text-2xl text-[#ff6a00]"
              />
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Connecting...</span>
            </div>
          }>
            <LoginForm />
          </Suspense>
        </motion.div>
        
        {/* Security indicators */}
        <motion.div 
          variants={itemVariants}
          className="mt-6 flex justify-center items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest"
        >
          <i className="fa-solid fa-lock text-slate-400 text-xs"></i> SSL Secure Connection Active
        </motion.div>
      </div>
    </motion.div>
  )
}