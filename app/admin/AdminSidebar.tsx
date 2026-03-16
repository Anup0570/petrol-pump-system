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
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div className="flex items-center gap-3">
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa-solid fa-gas-pump text-white" style={{ fontSize: '14px' }}></i>
          </div>
          <div className="font-bold text-slate-800 text-sm">Sai Priya Fuels</div>
        </div>
        <button onClick={() => setIsOpen(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
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
        className={`fixed top-0 left-0 z-50 h-[100vh] w-[240px] bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ boxShadow: '1px 0 10px rgba(0,0,0,0.03)' }}
      >
        {/* Logo Section */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="flex items-center gap-3">
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(37,99,235,0.2)' }}>
              <i className="fa-solid fa-gas-pump text-white" style={{ fontSize: '16px' }}></i>
            </div>
            <div>
              <div className="font-bold text-slate-800 text-sm">Sai Priya Fuels</div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>Admin Panel</div>
            </div>
          </div>
          <button className="md:hidden p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg" onClick={() => setIsOpen(false)}>
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px', marginBottom: '4px',
              textDecoration: 'none', fontSize: '14px', fontWeight: 600,
              background: active ? '#eff6ff' : 'transparent',
              color: active ? '#2563eb' : '#64748b',
              borderLeft: active ? '3px solid #2563eb' : '3px solid transparent',
              transition: 'all 0.15s'
            }}>
              <i className={`fa-solid ${item.icon} w-4`}></i>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ padding: '10px 12px', marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Signed in as</div>
          <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: 700, marginTop: '2px' }}>{adminName}</div>
        </div>
        <form action={logout}>
          <button type="submit" style={{
            width: '100%', padding: '12px', borderRadius: '12px',
            background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left',
            transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(239,68,68,0.05)'
          }}>
            <i className="fa-solid fa-arrow-right-from-bracket mr-2"></i>Logout
          </button>
        </form>
      </div>
    </aside>
    </>
  )
}
