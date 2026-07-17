'use client'

import { useSearchParams } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { Suspense, useState } from 'react'
import { login } from './actions'
import { motion, AnimatePresence } from 'framer-motion'
import { pageFadeIn, containerVariants, itemVariants } from '@/lib/motion'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 bg-[#FF6600] hover:bg-[#E65C00] active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-md shadow-[#FF6600]/20 transition-all duration-200 uppercase tracking-wider cursor-pointer"
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <i className="fa-solid fa-circle-notch fa-spin"></i> Authenticating...
        </span>
      ) : (
        'Login'
      )}
    </button>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  
  const [role, setRole] = useState<'staff' | 'admin'>('staff')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  return (
    <form 
      action={login}
      className="flex flex-col gap-4 mt-1"
    >
      {/* Hidden input to pass selected role to server action */}
      <input type="hidden" name="expectedRole" value={role} />

      <AnimatePresence>
        {error && (
          <div 
            className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold"
          >
            <i className="fa-solid fa-triangle-exclamation mr-2"></i> {error}
          </div>
        )}
      </AnimatePresence>

      {/* User ID Field */}
      <div>
        <label className="block text-[11px] font-bold mb-1.5 text-slate-500 uppercase tracking-wider">
          User ID
        </label>
        <div className="relative">
          <input
            name="email"
            type="email"
            required
            className="w-full h-11 pl-10 pr-4 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10 bg-white"
            placeholder="Enter User ID"
          />
          <i className="fa-regular fa-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
        </div>
      </div>

      {/* Password Field */}
      <div>
        <label className="block text-[11px] font-bold mb-1.5 text-slate-500 uppercase tracking-wider">
          Password
        </label>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            className="w-full h-11 pl-10 pr-10 border border-slate-200 rounded-xl text-slate-800 text-sm focus:border-[#FF6600] focus:ring-2 focus:ring-[#FF6600]/10 bg-white"
            placeholder="Enter Password"
          />
          <i className="fa-solid fa-lock absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
          >
            <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
          </button>
        </div>
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mt-1 select-none">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-slate-200 text-[#FF6600] focus:ring-[#FF6600] cursor-pointer"
          />
          Remember me
        </label>
        <a href="#" onClick={(e) => { e.preventDefault(); alert('Please contact the station administrator to reset your credentials.'); }} className="text-slate-400 hover:text-slate-600 transition-colors">
          Forgot Password?
        </a>
      </div>

      {/* Login Button */}
      <div className="pt-2">
        <SubmitButton />
      </div>

      {/* Segmented Control Role Selector */}
      <div className="border-t border-slate-100 pt-5 mt-2">
        <span className="block text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Login as
        </span>
        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 relative">
          <button
            type="button"
            onClick={() => setRole('staff')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              role === 'staff'
                ? 'bg-white text-[#FF6600] shadow-sm border border-slate-100'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <i className="fa-solid fa-users text-sm"></i> Staff
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
              role === 'admin'
                ? 'bg-white text-[#003366] shadow-sm border border-slate-100'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <i className="fa-solid fa-user-tie text-sm"></i> Admin
          </button>
        </div>
      </div>
    </form>
  )
}

export default function LoginPage() {
  return (
    <motion.div 
      variants={pageFadeIn}
      initial="hidden"
      animate="show"
      exit="exit"
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#F5F5F5]"
    >
      {/* Background Soft Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#FF6600]/3 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#003366]/3 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[390px] relative z-10">
        
        {/* Circular Indian Oil Logo & Brand Text */}
        <div className="text-center mb-6">
          <svg className="w-20 h-20 mx-auto mb-3" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="48" fill="#003366" />
            <circle cx="50" cy="50" r="40" fill="#FF6600" />
            <rect x="12" y="42" width="76" height="16" fill="#003366" />
            <text x="50" y="53" fill="#FFFFFF" fontSize="8.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.06em">IndianOil</text>
          </svg>
          <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none">Sai Priya Fuels</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1.5">
            Petrol Pump Management System
          </p>
        </div>

        {/* Premium Authentication Card */}
        <div className="glass-panel bg-white border border-slate-200/60 p-6 sm:p-8 shadow-xl rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#FF6600] to-[#003366]"></div>
          
          <h2 className="text-sm font-bold text-slate-800 text-center uppercase tracking-wide">Login to your account</h2>
          
          <Suspense fallback={
            <div className="text-slate-400 text-center py-10 flex flex-col items-center justify-center gap-3">
              <i className="fa-solid fa-circle-notch fa-spin text-2xl text-[#FF6600]"></i>
              <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Connecting...</span>
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
        
        {/* SSL Indicator */}
        <div className="mt-6 flex justify-center items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
          <i className="fa-solid fa-shield-halved text-xs text-slate-400"></i> SSL Secure Connection Active
        </div>
      </div>

      {/* Decorative Wave Shapes at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none z-0 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,80 C360,110 720,110 1080,80 C1200,70 1320,60 1440,80 L1440,100 L0,100 Z" fill="#003366" opacity="0.6"/>
          <path d="M0,90 C400,105 800,105 1200,90 L1440,95 L1440,100 L0,100 Z" fill="#FF6600"/>
        </svg>
      </div>
    </motion.div>
  )
}