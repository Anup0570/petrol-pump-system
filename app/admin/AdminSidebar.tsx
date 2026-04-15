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
      {/* Mobile Hamburger Header (Linear Style) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 z-30 flex items-center justify-between px-5 shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 rounded-lg bg-black flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
          >
            <i className="fa-solid fa-gas-pump text-white text-[13px]" style={{ filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.6))' }}></i>
          </motion.div>
          <div className="font-extrabold text-white text-[15px] tracking-tight">Sai Priya Fuels</div>
        </div>
        <button onClick={() => setIsOpen(true)} className="p-2.5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/5">
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
            className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Pure Obsidian SaaS */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-[100vh] w-[280px] bg-[#09090b] border-r border-white/5 flex flex-col transition-transform duration-500 cubic-bezier(0.16, 1, 0.3, 1) md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-[4px_0_40px_rgba(0,0,0,0.6)] text-zinc-200`}
      >
        {/* Logo Section */}
        <div className="p-7 px-6 flex items-center justify-between relative overflow-hidden">
          {/* Subtle gradient top */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <motion.div 
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="w-11 h-11 rounded-xl bg-black border border-white/10 flex items-center justify-center shadow-[0_4px_20px_rgba(59,130,246,0.15)]"
            >
              <i className="fa-solid fa-gas-pump text-white text-[17px]" style={{ filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.5))' }}></i>
            </motion.div>
            <div>
              <div className="font-black text-white text-[16px] tracking-tight">Sai Priya Fuels</div>
              <div className="text-[10px] text-blue-500 font-bold tracking-[0.2em] uppercase mt-1">Architecture</div>
            </div>
          </div>
          <button className="md:hidden p-2 text-zinc-500 hover:text-white rounded-lg transition-colors relative z-10" onClick={() => setIsOpen(false)}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

      {/* Nav */}
      <nav className="px-3 py-2 flex-1 overflow-y-auto space-y-1.5 custom-scrollbar relative z-10">
        <div className="px-4 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Modules</div>
        {NAV_ITEMS.map((item, i) => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} className="relative block">
              <motion.div 
                whileHover={{ x: 4 }}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-semibold transition-colors duration-200 ${
                  active 
                    ? 'text-white bg-white/5 border border-white/5 shadow-inner' 
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                {active && (
                  <motion.div layoutId="activeNavTab" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"></motion.div>
                )}
                <i className={`fa-solid ${item.icon} w-5 text-center transition-all ${active ? 'text-blue-500' : 'opacity-70 group-hover:opacity-100'}`}></i>
                {item.label}
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-5 border-t border-white/5 bg-[#09090b] relative z-10 mt-auto">
        <div className="flex items-center gap-3 mb-4 px-1">
          <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300 font-bold text-xs shadow-inner">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div>
             <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Session</div>
             <div className="text-[13px] text-white font-bold mt-1 truncate leading-none tracking-wide">{adminName}</div>
          </div>
        </div>
        <form action={logout}>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[12px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors uppercase tracking-widest"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Terminate
          </motion.button>
        </form>
      </div>
    </aside>
    </>
  )
}
