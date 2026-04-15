'use client'

import { useSearchParams } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { Suspense } from 'react'
import { login } from './actions'
import { motion, AnimatePresence } from 'framer-motion'
import { pageFadeIn, containerVariants, itemVariants, floatMotion, magneticHover } from '@/lib/motion'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <motion.button
      whileHover={!pending ? magneticHover : {}}
      whileTap={!pending ? { scale: 0.98 } : {}}
      type="submit"
      disabled={pending}
      className={`btn-primary w-full py-4 rounded-xl text-[15px] font-bold mt-2
        ${pending ? 'opacity-50 cursor-not-allowed' : ''} 
        relative overflow-hidden`}
    >
      {pending ? (
        <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Initializing...</>
      ) : (
        <><i className="fa-solid fa-arrow-right-to-bracket mr-2"></i> Access Terminal</>
      )}
    </motion.button>
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
            className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-medium"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants}>
        <label className="block text-xs font-bold mb-1.5 text-zinc-400 uppercase tracking-widest">
          Operator ID
        </label>
        <input
          name="email"
          type="email"
          required
          className="w-full"
          placeholder="admin@saipriyafuels.com"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <label className="block text-xs font-bold mb-1.5 text-zinc-400 uppercase tracking-widest">
          Security Key
        </label>
        <input
          name="password"
          type="password"
          required
          className="w-full"
          placeholder="••••••••"
        />
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
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#09090b]"
    >
      {/* Super Premium Ambient Background */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[130px] pointer-events-none"
      />

      <div className="w-full max-w-[440px] relative z-10">
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
            className="w-24 h-24 mx-auto bg-black/50 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl relative z-10 mb-6"
          >
            {/* Inner glow ring */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-500/0 pointer-events-none"></div>
            <i className="fa-solid fa-gas-pump text-white text-4xl" style={{ filter: 'drop-shadow(0 0 12px rgba(59,130,246,0.6))' }}></i>
            
            {/* The animated liquid drop */}
            <motion.div 
              animate={{ 
                y: [0, 15, 0], 
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.1, 0.8]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-4 text-blue-500 text-xl"
            >
              <i className="fa-solid fa-droplet"></i>
            </motion.div>
          </motion.div>
          
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Sai Priya Fuels</h1>
          <p className="text-zinc-500 font-medium mt-2 tracking-wide uppercase text-sm">
            Operations Console
          </p>
        </motion.div>

        {/* Card */}
        <motion.div 
          variants={itemVariants}
          className="glass-panel p-8 sm:p-10 relative overflow-hidden"
        >
          {/* Subtle top edge highlight */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          
          <h2 className="text-xl font-bold text-white text-center">System Authentication</h2>
          <p className="text-center text-sm text-zinc-500 mt-1">Authorized personnel only</p>

          <Suspense fallback={
            <div className="text-zinc-400 text-center py-10 flex flex-col items-center justify-center gap-3">
              <motion.i 
                animate={{ rotate: 360 }} 
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="fa-solid fa-spinner text-2xl text-blue-500"
              />
              <span className="text-sm font-medium tracking-widest uppercase">Connecting...</span>
            </div>
          }>
            <LoginForm />
          </Suspense>
        </motion.div>
        
        {/* Security badge */}
        <motion.div 
          variants={itemVariants}
          className="mt-8 flex justify-center items-center gap-2 text-xs text-zinc-600 font-semibold uppercase tracking-widest"
        >
           <i className="fa-solid fa-lock text-zinc-500"></i> Encrypted Session
        </motion.div>
      </div>
    </motion.div>
  )
}