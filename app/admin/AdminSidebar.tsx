'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'

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

  return (
    <aside style={{
      width: '240px', minHeight: '100vh', background: 'rgba(15, 23, 42, 0.8)', 
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      borderRight: '1px solid rgba(71, 85, 105, 0.4)', display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, zIndex: 40,
      boxShadow: '4px 0 24px rgba(0,0,0,0.3)'
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(71, 85, 105, 0.3)' }}>
        <div className="flex items-center gap-3">
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa-solid fa-gas-pump text-white" style={{ fontSize: '16px' }}></i>
          </div>
          <div>
            <div className="font-bold text-white text-sm">Sai Priya Fuels</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px', marginBottom: '4px',
              textDecoration: 'none', fontSize: '14px', fontWeight: 500,
              background: active ? 'rgba(37,99,235,0.15)' : 'transparent',
              color: active ? '#60a5fa' : '#9ca3af',
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
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(71, 85, 105, 0.3)' }}>
        <div style={{ padding: '10px 12px', marginBottom: '8px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Signed in as</div>
          <div style={{ fontSize: '14px', color: '#e5e7eb', fontWeight: 500, marginTop: '2px' }}>{adminName}</div>
        </div>
        <form action={logout}>
          <button type="submit" style={{
            width: '100%', padding: '12px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600, textAlign: 'left',
            transition: 'all 0.2s ease', boxShadow: '0 2px 8px rgba(239,68,68,0.05)'
          }}>
            <i className="fa-solid fa-arrow-right-from-bracket mr-2"></i>Logout
          </button>
        </form>
      </div>
    </aside>
  )
}
