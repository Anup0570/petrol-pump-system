'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { CreditLedgerEntry } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { buttonHover, modalVariants } from '@/lib/motion'

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
      {/* Summary + Add Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex items-center gap-4 md:col-span-2">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-book-open text-[#dc2626] text-xl"></i>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">₹{totalOutstanding.toLocaleString('en-IN')}</div>
            <div className="text-xs text-slate-500 font-medium">Total Outstanding Ledger ({entries.filter(e => e.status === 'Pending').length} pending accounts)</div>
          </div>
        </div>
        <div className="glass-panel bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex items-center justify-center">
          <motion.button 
            whileHover={buttonHover}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAdd(true)}
            className="btn-primary w-full py-3 text-sm font-bold shadow-sm cursor-pointer"
          >
            <i className="fa-solid fa-plus mr-1.5"></i>Add Credit Record
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel mb-6 bg-white border border-slate-200 shadow-sm p-6 rounded-2xl flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Search Customer / License Plate</label>
          <input 
            placeholder="Search customer, vehicle number..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl focus:border-[#ff6a00]"
          />
        </div>
        <div className="w-[180px]">
          <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Payment Status</label>
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full cursor-pointer bg-white border border-slate-200 text-slate-800 rounded-xl focus:border-[#ff6a00]"
          >
            <option value="">All Accounts</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Credit Ledger Table */}
      <div className="glass-panel bg-white border border-slate-200 shadow-sm p-6 rounded-2xl overflow-x-auto">
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Date', 'Customer Account', 'Vehicle ID', 'Fuel Type', 'Volume', 'Outstanding', 'Justification Notes', 'Account Status', 'Manage'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-slate-500 font-bold uppercase tracking-wider text-[9px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-slate-400 font-medium">No credit accounts found.</td></tr>
              ) : filtered.map(entry => (
                <tr key={entry.id} className="enhanced-row">
                  <td className="px-4 py-4 text-slate-500 whitespace-nowrap">{format(new Date(entry.created_at), 'dd MMM yy')}</td>
                  <td className="px-4 py-4 text-slate-800 font-bold whitespace-nowrap">{entry.customer_name}</td>
                  <td className="px-4 py-4 text-slate-600 font-semibold whitespace-nowrap">{entry.vehicle_number || '—'}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {entry.fuel_type ? <span className={`badge ${entry.fuel_type === 'Petrol' ? 'petrol-badge' : 'diesel-badge'}`}>{entry.fuel_type}</span> : '—'}
                  </td>
                  <td className="px-4 py-4 text-slate-600 whitespace-nowrap">{entry.litres ? `${entry.litres} L` : '—'}</td>
                  <td className="px-4 py-4 text-red-600 font-black whitespace-nowrap">₹{entry.amount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-4 text-slate-500 max-w-[150px] overflow-hidden text-overflow-ellipsis whitespace-nowrap">{entry.notes || '—'}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`badge ${entry.status === 'Paid' ? 'status-verified' : 'status-pending'}`}>{entry.status}</span>
                    {entry.status === 'Paid' && entry.paid_at && (
                      <div className="text-[10px] text-slate-400 mt-1 font-medium">{format(new Date(entry.paid_at), 'dd MMM, HH:mm')}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {entry.status === 'Pending' && (
                        <button 
                          onClick={() => markPaid(entry.id)}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg cursor-pointer text-xs font-bold transition-all"
                        >
                          <i className="fa-solid fa-check mr-1"></i>Mark Paid
                        </button>
                      )}
                      <button 
                        onClick={() => deleteEntry(entry.id)}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg cursor-pointer text-xs font-bold transition-all"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="glass-panel w-full max-w-[420px] bg-white border border-slate-200 shadow-2xl relative overflow-hidden p-8 rounded-2xl"
            >
              {/* Top brand line indicator */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#ff6a00]"></div>

              <h3 className="font-extrabold text-slate-800 mb-6 text-xl tracking-tight flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100">
                  <i className="fa-solid fa-book-open text-[#ff6a00]"></i>
                </div>
                Add Credit Entry
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Customer Name *</label>
                  <input 
                    value={form.customer_name} 
                    onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} 
                    placeholder="e.g. SRS Travels" 
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl focus:border-[#ff6a00]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Vehicle Number</label>
                  <input 
                    value={form.vehicle_number} 
                    onChange={e => setForm(f => ({ ...f, vehicle_number: e.target.value }))} 
                    placeholder="e.g. KA01HX1234" 
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl focus:border-[#ff6a00]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Fuel Type</label>
                    <select 
                      value={form.fuel_type} 
                      onChange={e => setForm(f => ({ ...f, fuel_type: e.target.value }))}
                      className="w-full cursor-pointer bg-white border border-slate-200 text-slate-800 rounded-xl focus:border-[#ff6a00]"
                    >
                      <option>Petrol</option><option>Diesel</option><option>2T Oil</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Litres</label>
                    <input 
                      type="number" 
                      value={form.litres} 
                      onChange={e => setForm(f => ({ ...f, litres: e.target.value }))} 
                      placeholder="0.0" 
                      className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl focus:border-[#ff6a00]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Amount (₹) *</label>
                  <input 
                    type="number" 
                    value={form.amount} 
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} 
                    placeholder="0.00" 
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl focus:border-[#ff6a00]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Notes / Explanations</label>
                  <input 
                    value={form.notes} 
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} 
                    placeholder="e.g. Authorized by Shift Head Manager" 
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl focus:border-[#ff6a00]"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAdd(false)} 
                  className="btn-secondary flex-1 py-3 text-slate-600 font-bold text-sm cursor-pointer"
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileHover={!saving ? buttonHover : {}}
                  whileTap={!saving ? { scale: 0.98 } : {}}
                  onClick={addEntry} 
                  disabled={saving} 
                  className="btn-primary flex-1 py-3 text-sm font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Add Account'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
