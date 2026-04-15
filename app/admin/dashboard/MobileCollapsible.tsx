'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function MobileCollapsible({ 
  title, 
  icon,
  children 
}: { 
  title: string, 
  icon: string,
  children: React.ReactNode 
}) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="mb-4 glass-panel rounded-2xl border border-slate-700/50 shadow-sm overflow-hidden md:hidden">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3 font-semibold text-slate-200">
          <div className="w-8 h-8 rounded bg-slate-800/80 border border-slate-700/50 flex items-center justify-center shadow-sm">
            <i className={`fa-solid ${icon} text-blue-500`}></i>
          </div>
          {title}
        </div>
        <div className="w-8 h-8 flex items-center justify-center">
          <motion.i 
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="fa-solid fa-chevron-down text-slate-500"
          ></motion.i>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0">
              <div className="border-t border-slate-700/50 pt-4">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
