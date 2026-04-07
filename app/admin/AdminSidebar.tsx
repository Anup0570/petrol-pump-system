'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'
import { useState } from 'react'

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
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/60 z-30 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <i className="fa-solid fa-gas-pump text-white text-[14px]"></i>
          </div>
          <div className="font-bold text-slate-800 text-sm tracking-tight">Sai Priya Fuels</div>
        </div>
        <button onClick={() => setIsOpen(true)} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
          <i className="fa-solid fa-bars text-xl"></i>
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-50 h-[100vh] w-[260px] bg-white/95 backdrop-blur-xl border-r border-slate-200/60 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-[2px_0_24px_rgba(15,23,42,0.04)]`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <i className="fa-solid fa-gas-pump text-white text-base"></i>
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-[15px] tracking-tight">Sai Priya Fuels</div>
              <div className="text-[11px] text-slate-500 font-semibold tracking-wide uppercase mt-0.5">Admin Panel</div>
            </div>
          </div>
          <button className="md:hidden p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

      {/* Nav */}
      <nav className="p-4 flex-1 overflow-y-auto space-y-1">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold transition-all duration-200 ${
                active 
                  ? 'bg-blue-50 text-blue-700 shadow-sm shadow-blue-100/50' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <i className={`fa-solid ${item.icon} w-5 text-center ${active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`}></i>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="px-3 pb-3">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Signed in as</div>
          <div className="text-[14px] text-slate-800 font-bold mt-1 truncate">{adminName}</div>
        </div>
        <form action={logout}>
          <button type="submit" 
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[13px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors shadow-sm shadow-red-100/50"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
          </button>
        </form>
      </div>
    </aside>
    </>
  )
}
