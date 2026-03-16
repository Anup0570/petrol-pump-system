'use client'

import { useState } from 'react'

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
    <div className="mb-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden md:hidden">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 font-semibold text-slate-800">
          <div className="w-8 h-8 rounded bg-slate-50 border border-slate-100 flex items-center justify-center">
            <i className={`fa-solid ${icon} text-blue-600`}></i>
          </div>
          {title}
        </div>
        <div className="w-8 h-8 flex items-center justify-center">
          <i className={`fa-solid fa-chevron-down text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
        </div>
      </button>
      {isOpen && (
        <div className="p-4 pt-0 bg-white">
          <div className="border-t border-slate-100 pt-4">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
