'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: 'fa-gauge-high', label: 'Dashboard' },
  { href: '/admin/entries',   icon: 'fa-table-list', label: 'Shift Entries' },
  { href: '/admin/ledger',    icon: 'fa-book-open',  label: 'Credit Ledger' },
  { href: '/admin/reports',   icon: 'fa-chart-bar',  label: 'Reports' },
  { href: '/admin/reset',     icon: 'fa-triangle-exclamation', label: 'Emergency Pump Reset' },
  { href: '/admin/tank-reset',icon: 'fa-oil-can',    label: 'Tank Stock Reset' },
  { href: '/admin/staff', icon: 'fa-users-gear', label: 'Staff Management' },
]

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Hamburger Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[rgba(15,23,42,0.85)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.1)] z-30 flex items-center justify-between px-4 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20"
          >
            <i className="fa-solid fa-gas-pump text-white text-[14px]"></i>
          </motion.div>
          <div className="font-bold text-white text-sm tracking-tight">Sai Priya Fuels</div>
        </div>
        <button onClick={() => setIsOpen(true)} className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
          <i className="fa-solid fa-bars text-xl"></i>
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-[100vh] w-[260px] bg-[rgba(15,23,42,0.95)] backdrop-blur-xl border-r border-[rgba(255,255,255,0.1)] flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-[0_0_40px_rgba(0,0,0,0.5)] text-slate-200`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)]"
            >
              <i className="fa-solid fa-gas-pump text-white text-base"></i>
            </motion.div>
            <div>
              <div className="font-extrabold text-white text-[15px] tracking-tight">Sai Priya Fuels</div>
              <div className="text-[11px] text-blue-400 font-semibold tracking-wide uppercase mt-0.5">Admin Panel</div>
            </div>
          </div>
          <button className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

      {/* Nav */}
      <nav className="p-4 flex-1 overflow-y-auto space-y-2 custom-scrollbar">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-all duration-200 ${
                active 
                  ? 'bg-blue-600/20 text-blue-400 shadow-[inset_2px_0_0_#3b82f6]' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <i className={`fa-solid ${item.icon} w-5 text-center ${active ? 'text-blue-400 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]' : 'text-slate-500 group-hover:text-slate-300'}`}></i>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.2)]">
        <div className="px-3 pb-3">
          <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Signed in as</div>
          <div className="text-[14px] text-white font-bold mt-1 truncate">{adminName}</div>
        </div>
        <form action={logout}>
          <button type="submit" 
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[13px] font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all shadow-[0_0_10px_rgba(244,63,94,0.1)] hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
          </button>
        </form>
      </div>
    </aside>
    </>
  )
}
