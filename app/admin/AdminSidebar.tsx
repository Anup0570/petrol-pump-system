'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: 'fa-gauge-high', label: 'Command Center' },
  { href: '/admin/entries',   icon: 'fa-table-list', label: 'Shift Ledger' },
  { href: '/admin/ledger',    icon: 'fa-book-open',  label: 'Credit Directory' },
  { href: '/admin/reports',   icon: 'fa-chart-bar',  label: 'Analytics' },
  { href: '/admin/reset',     icon: 'fa-triangle-exclamation', label: 'Emergency Override' },
  { href: '/admin/tank-reset',icon: 'fa-oil-can',    label: 'Tank Calibration' },
  { href: '/admin/staff', icon: 'fa-users-gear', label: 'Personnel Access' },
]

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Hamburger Header (Premium Light Theme) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/60 z-30 flex items-center justify-between px-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200 shadow-sm">
            <i className="fa-solid fa-gas-pump text-[#ff6a00] text-[13px]"></i>
          </div>
          <div className="font-extrabold text-slate-800 text-[15px] tracking-tight">Sai Priya Fuels</div>
        </div>
        <button onClick={() => setIsOpen(true)} className="p-2 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">
          <i className="fa-solid fa-bars text-sm"></i>
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Pure White & Orange Active highlights */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-[100vh] w-[260px] bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-[4px_0_24px_rgba(0,0,0,0.02)] text-slate-700`}
      >
        {/* Logo Section */}
        <div className="p-6 flex items-center justify-between border-b border-slate-100 relative overflow-hidden">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shadow-sm">
              <i className="fa-solid fa-gas-pump text-[#ff6a00] text-base"></i>
            </div>
            <div>
              <div className="font-black text-slate-800 text-[15px] tracking-tight">Sai Priya Fuels</div>
              <div className="text-[9px] text-[#ff6a00] font-bold tracking-[0.15em] uppercase mt-0.5">ERP Command</div>
            </div>
          </div>
          <button className="md:hidden p-2 text-slate-400 hover:text-slate-900 rounded-lg transition-colors relative z-10" onClick={() => setIsOpen(false)}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Nav list */}
        <nav className="px-3 py-4 flex-1 overflow-y-auto space-y-1 custom-scrollbar">
          <div className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Navigation Modules</div>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className="relative block">
                <motion.div 
                  whileHover={{ x: 2 }}
                  className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                    active 
                      ? 'text-[#ff6a00] bg-orange-50/60 shadow-sm border border-orange-100/50' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  {active && (
                    <motion.div 
                      layoutId="activeNavTab" 
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#ff6a00] rounded-full shadow-[0_0_8px_rgba(255,106,0,0.3)]"
                    />
                  )}
                  <i className={`fa-solid ${item.icon} w-5 text-center text-sm transition-all ${active ? 'text-[#ff6a00]' : 'opacity-70'}`}></i>
                  {item.label}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        {/* User initials + Logout Panel */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 mt-auto">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
              {adminName.charAt(0).toUpperCase()}
            </div>
            <div>
               <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Console User</div>
               <div className="text-[12px] text-slate-800 font-bold mt-0.5 truncate max-w-[150px] leading-none tracking-wide">{adminName}</div>
            </div>
          </div>
          <form action={logout}>
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100/70 border border-red-200/50 transition-all uppercase tracking-wider cursor-pointer"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i> Terminate Session
            </motion.button>
          </form>
        </div>
      </aside>
    </>
  )
}
