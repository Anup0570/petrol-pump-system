'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { CreditLedgerEntry } from '@/lib/types'

export default function LedgerClient({ initialEntries }: { initialEntries: CreditLedgerEntry[] }) {
  const [entries, setEntries] = useState<CreditLedgerEntry[]>(initialEntries)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Pending')

  // New entry form
  const [form, setForm] = useState({ customer_name: '', vehicle_number: '', fuel_type: 'Petrol', litres: '', amount: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const filtered = entries.filter(e => {
    const matchSearch = !search || e.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.vehicle_number || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || e.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalOutstanding = entries.filter(e => e.status === 'Pending').reduce((s, e) => s + e.amount, 0)

  async function addEntry() {
    const amt = parseFloat(form.amount)
    if (!form.customer_name.trim() || isNaN(amt) || amt <= 0) { alert('Enter customer name and valid amount'); return }
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('credit_ledger').insert({
      customer_name: form.customer_name.trim(),
      vehicle_number: form.vehicle_number.trim(),
      fuel_type: form.fuel_type,
      litres: parseFloat(form.litres) || 0,
      amount: amt,
      notes: form.notes.trim(),
      status: 'Pending'
    }).select().single()
    if (!error && data) {
      setEntries(prev => [data, ...prev])
      setForm({ customer_name: '', vehicle_number: '', fuel_type: 'Petrol', litres: '', amount: '', notes: '' })
      setShowAdd(false)
    }
    setSaving(false)
  }

  async function markPaid(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('credit_ledger')
      .update({ status: 'Paid', paid_at: new Date().toISOString() }).eq('id', id)
    if (!error) setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'Paid', paid_at: new Date().toISOString() } : e))
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this credit entry?')) return
    const supabase = createClient()
    await supabase.from('credit_ledger').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div>
      {/* Summary + Add */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa-solid fa-book-open" style={{ color: '#f87171', fontSize: '20px' }}></i>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">₹{totalOutstanding.toLocaleString('en-IN')}</div>
            <div style={{ color: '#64748b', fontSize: '13px' }}>Total Outstanding ({entries.filter(e => e.status === 'Pending').length} accounts)</div>
          </div>
        </div>
        <div className="glass-panel flex items-center justify-center">
          <button onClick={() => setShowAdd(true)}
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
            <i className="fa-solid fa-plus mr-2"></i>Add Credit Entry
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel mb-4" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label className="block text-xs mb-1" style={{ color: '#94a3b8' }}>Search Customer / Vehicle</label>
          <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ flex: '0 0 160px' }}>
          <label className="block text-xs mb-1" style={{ color: '#94a3b8' }}>Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-x-auto">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              {['Date', 'Customer', 'Vehicle', 'Fuel', 'Litres', 'Amount', 'Notes', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: '#4b5563' }}>No credit entries found</td></tr>
            ) : filtered.map(entry => (
              <tr key={entry.id} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '10px 12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{format(new Date(entry.created_at), 'dd MMM yy')}</td>
                <td style={{ padding: '10px 12px', color: '#e2e8f0', fontWeight: 500 }}>{entry.customer_name}</td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{entry.vehicle_number || '—'}</td>
                <td style={{ padding: '10px 12px' }}>
                  {entry.fuel_type ? <span className={`badge ${entry.fuel_type === 'Petrol' ? 'petrol-badge' : 'diesel-badge'}`}>{entry.fuel_type}</span> : '—'}
                </td>
                <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{entry.litres ? `${entry.litres}L` : '—'}</td>
                <td style={{ padding: '10px 12px', color: '#f87171', fontWeight: 700 }}>₹{entry.amount.toLocaleString()}</td>
                <td style={{ padding: '10px 12px', color: '#64748b', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.notes || '—'}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span className={`badge ${entry.status === 'Paid' ? 'status-verified' : 'status-pending'}`}>{entry.status}</span>
                  {entry.status === 'Paid' && entry.paid_at && (
                    <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>{format(new Date(entry.paid_at), 'dd MMM')}</div>
                  )}
                </td>
                <td style={{ padding: '10px 12px' }}>
                  <div className="flex gap-2">
                    {entry.status === 'Pending' && (
                      <button onClick={() => markPaid(entry.id)}
                        style={{ padding: '5px 10px', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        <i className="fa-solid fa-check mr-1"></i>Mark Paid
                      </button>
                    )}
                    <button onClick={() => deleteEntry(entry.id)}
                      style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '28px' }}>
            <h3 className="font-bold text-white mb-5 text-lg">
              <i className="fa-solid fa-plus mr-2" style={{ color: '#60a5fa' }}></i>Add Credit Entry
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#94a3b8' }}>Customer Name *</label>
                <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} placeholder="Name" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#94a3b8' }}>Vehicle Number</label>
                <input value={form.vehicle_number} onChange={e => setForm(f => ({ ...f, vehicle_number: e.target.value }))} placeholder="e.g. MH12AB1234" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#94a3b8' }}>Fuel Type</label>
                  <select value={form.fuel_type} onChange={e => setForm(f => ({ ...f, fuel_type: e.target.value }))}>
                    <option>Petrol</option><option>Diesel</option><option>2T Oil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: '#94a3b8' }}>Litres</label>
                  <input type="number" value={form.litres} onChange={e => setForm(f => ({ ...f, litres: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#94a3b8' }}>Amount (₹) *</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#94a3b8' }}>Notes</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '10px', background: '#334155', color: '#94a3b8', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={addEntry} disabled={saving} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                {saving ? 'Saving...' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
