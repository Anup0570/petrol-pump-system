'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { FuelEntry } from '@/lib/types'
import DeleteShiftButton from '../dashboard/DeleteShiftButton'

export default function EntriesClient({ initialEntries, isAdmin = false }: { initialEntries: FuelEntry[], isAdmin?: boolean }) {
  const supabase = createClient()
  const [entries, setEntries] = useState<FuelEntry[]>(initialEntries)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = entries.filter(e => {
    const matchSearch = !search || e.staff_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || e.status === statusFilter
    const matchDate = !dateFilter || e.shift_date === dateFilter
    return matchSearch && matchStatus && matchDate
  })

  async function verifyEntry(id: string) {
    const { error } = await supabase.from('fuel_entries').update({ status: 'Verified' }).eq('id', id)
    if (!error) setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'Verified' } : e))
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this shift entry permanently?')) return
    setDeleting(id)
    await supabase.from('fuel_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    setDeleting(null)
  }

  // Use our centralized DeleteShiftButton component when in Admin mode, 
  // replacing the old deleteEntry function above for Admin users.

  return (
    <div>
      {/* Filters */}
      <div className="glass-panel mb-6" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label className="block text-xs mb-1.5" style={{ color: '#94a3b8' }}>Search Staff</label>
          <input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label className="block text-xs mb-1.5" style={{ color: '#94a3b8' }}>Date</label>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        </div>
        <div style={{ flex: '1 1 150px' }}>
          <label className="block text-xs mb-1.5" style={{ color: '#94a3b8' }}>Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
          </select>
        </div>
        {(search || dateFilter || statusFilter) && (
          <button onClick={() => { setSearch(''); setDateFilter(''); setStatusFilter('') }}
            style={{ background: '#334155', color: '#94a3b8', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer' }}>
            Clear
          </button>
        )}
      </div>

      {/* Entries Table */}
      <div className="glass-panel overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-white">
            {filtered.length} {filtered.length === 1 ? 'Entry' : 'Entries'}
          </h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155' }}>
              {['Date & Time', 'Staff', 'Shift', 'Gross (₹)', 'Cash (₹)', 'UPI (₹)', 'Credit (₹)', 'P.Ltrs', 'D.Ltrs', 'Diff', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={12} style={{ padding: '32px', textAlign: 'center', color: '#4b5563' }}>No entries found</td></tr>
            ) : filtered.map(entry => {
              const diff = entry.difference || 0
              const creditGivenTotal = (entry.credit_given || []).reduce((s, c) => s + c.amt, 0)
              return (
                <>
                  <tr key={entry.id} style={{ borderBottom: '1px solid #1e293b', cursor: 'pointer' }}
                    onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}>
                    <td style={{ padding: '10px 12px', color: '#e2e8f0', whiteSpace: 'nowrap' }}>{format(new Date(entry.created_at), 'dd MMM, hh:mm a')}</td>
                    <td style={{ padding: '10px 12px', color: '#e2e8f0', fontWeight: 500 }}>{entry.staff_name}</td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{entry.shift_type?.replace(' Shift', '')}</td>
                    <td style={{ padding: '10px 12px', color: '#fbbf24', fontWeight: 600 }}>₹{(entry.gross_sales || 0).toFixed(0)}</td>
                    <td style={{ padding: '10px 12px', color: '#34d399' }}>₹{(entry.expected_cash || 0).toFixed(0)}</td>
                    <td style={{ padding: '10px 12px', color: '#60a5fa' }}>₹{(entry.gpay_amount || 0).toFixed(0)}</td>
                    <td style={{ padding: '10px 12px', color: '#f87171' }}>₹{creditGivenTotal.toFixed(0)}</td>
                    <td style={{ padding: '10px 12px', color: '#fbbf24' }}>{(entry.petrol_litres || 0).toFixed(1)}</td>
                    <td style={{ padding: '10px 12px', color: '#60a5fa' }}>{(entry.diesel_litres || 0).toFixed(1)}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: diff > 0 ? '#60a5fa' : diff < 0 ? '#f87171' : '#34d399' }}>
                      {diff >= 0 ? '+' : ''}₹{diff.toFixed(0)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`badge ${entry.status === 'Verified' ? 'status-verified' : 'status-pending'}`}>{entry.status}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                        {isAdmin && entry.status === 'Pending' && (
                          <button onClick={() => verifyEntry(entry.id)}
                            style={{ padding: '5px 10px', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                            <i className="fa-solid fa-check mr-1"></i>Verify
                          </button>
                        )}
                        {isAdmin ? (
                          <DeleteShiftButton
                            shiftId={entry.id}
                            petrolLitres={entry.petrol_litres || 0}
                            dieselLitres={entry.diesel_litres || 0}
                          />
                        ) : (
                           /* Keeping the old dummy delete button block just in case, though staff shouldn't be able to delete anyway per RLS */
                           <button onClick={() => deleteEntry(entry.id)} disabled={deleting === entry.id}
                            style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', display: 'none' }}>
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expanded === entry.id && (
                    <tr key={`${entry.id}-detail`} style={{ background: '#0f172a' }}>
                      <td colSpan={12} style={{ padding: '16px 24px' }}>
                        <EntryDetail entry={entry} />
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EntryDetail({ entry }: { entry: FuelEntry }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', fontSize: '13px' }}>
      {/* Nozzle Readings */}
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: '#94a3b8' }}>Nozzle Readings</h4>
        {(entry.nozzle_readings || []).map((n: any) => (
          <div key={n.id} className="flex justify-between py-1" style={{ borderBottom: '1px solid #1e293b' }}>
            <span style={{ color: '#64748b' }}>{n.label}</span>
            <span style={{ color: '#e2e8f0' }}>{n.open} → {n.close} <span style={{ color: '#64748b' }}>({n.volume?.toFixed(2)}L)</span></span>
          </div>
        ))}
      </div>
      {/* Financials */}
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: '#94a3b8' }}>Financial Breakdown</h4>
        {[
          { l: 'Rate Petrol', v: `₹${entry.rate_petrol}/L` },
          { l: 'Rate Diesel', v: `₹${entry.rate_diesel}/L` },
          { l: 'GPay/UPI', v: `₹${entry.gpay_amount}` },
          { l: 'Card', v: `₹${entry.card_amount}` },
          { l: 'Expenses', v: `₹${entry.expense_amount} ${entry.expense_desc ? `(${entry.expense_desc})` : ''}` },
          { l: 'Counted Cash', v: `₹${entry.counted_cash}` },
        ].map(({ l, v }) => (
          <div key={l} className="flex justify-between py-1" style={{ borderBottom: '1px solid #1e293b' }}>
            <span style={{ color: '#64748b' }}>{l}</span>
            <span style={{ color: '#e2e8f0' }}>{v}</span>
          </div>
        ))}
      </div>
      {/* Credits */}
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: '#94a3b8' }}>Credit Activity</h4>
        {(entry.credit_given || []).length > 0 && (
          <div className="mb-2">
            <p style={{ color: '#f87171', fontSize: '11px', marginBottom: '4px' }}>Credit Given:</p>
            {(entry.credit_given || []).map((c: any, i: number) => (
              <div key={i} className="flex justify-between" style={{ color: '#64748b' }}>
                <span>{c.name}</span><span>₹{c.amt}</span>
              </div>
            ))}
          </div>
        )}
        {(entry.credit_received || []).length > 0 && (
          <div>
            <p style={{ color: '#34d399', fontSize: '11px', marginBottom: '4px' }}>Credit Received:</p>
            {(entry.credit_received || []).map((c: any, i: number) => (
              <div key={i} className="flex justify-between" style={{ color: '#64748b' }}>
                <span>{c.name}</span><span>₹{c.amt}</span>
              </div>
            ))}
          </div>
        )}
        {!(entry.credit_given?.length) && !(entry.credit_received?.length) && (
          <p style={{ color: '#4b5563' }}>No credit activity</p>
        )}
      </div>
    </div>
  )
}
