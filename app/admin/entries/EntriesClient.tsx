'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { FuelEntry } from '@/lib/types'
import DeleteShiftButton from '../dashboard/DeleteShiftButton'

// OCR Auditing Imports
import { OcrService } from '@/services/ocrService'
import { ReadingImagePreview } from '@/components/ocr/ReadingImagePreview'
import { Loader2 } from 'lucide-react'

export default function EntriesClient({ initialEntries, isAdmin = false }: { initialEntries: FuelEntry[], isAdmin?: boolean }) {
  const [entries, setEntries] = useState<FuelEntry[]>(initialEntries)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // OCR Auditing States
  const [activeAudit, setActiveAudit] = useState<any | null>(null)
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false)
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false)

  const handleReadingClick = async (shiftId: string, nozzleLabel: string, verifiedBy: string) => {
    setLoadingAudit(true)
    try {
      const data = await OcrService.getOcrAuditLog(shiftId, nozzleLabel)
      if (data) {
        setActiveAudit({
          ...data,
          verified_by: data.verified_by || verifiedBy
        })
        setIsAuditOpen(true)
      } else {
        alert("No AI OCR audit log exists for this reading. This reading was typed manually by the operator.")
      }
    } catch (err) {
      console.error('Audit load failed:', err)
      alert("Failed to load OCR audit log.")
    } finally {
      setLoadingAudit(false)
    }
  }

  const filtered = entries.filter(e => {
    const matchSearch = !search || e.staff_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || e.status === statusFilter
    const matchDate = !dateFilter || e.shift_date === dateFilter
    return matchSearch && matchStatus && matchDate
  })

  async function verifyEntry(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('fuel_entries').update({ status: 'Verified' }).eq('id', id)
    if (!error) setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'Verified' } : e))
  }

  return (
    <div>
      {/* Filters (Clean Light Panel) */}
      <div className="glass-panel mb-6 bg-white border border-slate-200 shadow-sm p-6 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Search Operator</label>
            <input 
              placeholder="Search by name..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl focus:border-[#ff6a00]" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Date filter</label>
            <input 
              type="date" 
              value={dateFilter} 
              onChange={e => setDateFilter(e.target.value)} 
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl focus:border-[#ff6a00]" 
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold mb-2 text-slate-400 uppercase tracking-widest">Shift Status</label>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)} 
              className="w-full cursor-pointer bg-white border border-slate-200 text-slate-800 rounded-xl focus:border-[#ff6a00]"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
            </select>
          </div>
          {(search || dateFilter || statusFilter) && (
            <div>
              <button 
                onClick={() => { setSearch(''); setDateFilter(''); setStatusFilter('') }}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl cursor-pointer font-bold text-sm transition-all h-[44px] flex items-center justify-center"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Entries Table */}
      <div className="glass-panel bg-white border border-slate-200 shadow-sm p-6 rounded-2xl overflow-x-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-extrabold text-slate-800 text-base tracking-tight">
            Shift Entries Ledger ({filtered.length} logs)
          </h3>
        </div>
        
        <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {['Date & Time', 'Staff Operator', 'Shift', 'Gross (₹)', 'Expected Cash (₹)', 'UPI (₹)', 'Credit (₹)', 'Petrol (L)', 'Diesel (L)', 'Diff', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-slate-500 font-bold uppercase tracking-wider text-[9px] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={12} className="p-8 text-center text-slate-400 font-medium">No ledger entries found matching criteria.</td></tr>
              ) : filtered.map(entry => {
                const diff = entry.difference || 0
                const creditGivenTotal = (entry.credit_given || []).reduce((s, c) => s + c.amt, 0)
                return (
                  <React.Fragment key={entry.id}>
                    <tr 
                      className="enhanced-row cursor-pointer"
                      onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                    >
                      <td className="px-4 py-4 text-slate-600 font-medium whitespace-nowrap">{format(new Date(entry.created_at), 'dd MMM, hh:mm a')}</td>
                      <td className="px-4 py-4 text-slate-800 font-bold whitespace-nowrap">{entry.staff_name}</td>
                      <td className="px-4 py-4 text-slate-500 font-medium whitespace-nowrap">{entry.shift_type?.replace(' Shift', '')}</td>
                      <td className="px-4 py-4 text-[#ff6a00] font-bold whitespace-nowrap">₹{(entry.gross_sales || 0).toLocaleString()}</td>
                      <td className="px-4 py-4 text-[#059669] font-bold whitespace-nowrap">₹{(entry.expected_cash || 0).toLocaleString()}</td>
                      <td className="px-4 py-4 text-slate-600 font-semibold whitespace-nowrap">₹{(entry.gpay_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-4 text-red-600 font-semibold whitespace-nowrap">₹{creditGivenTotal.toLocaleString()}</td>
                      <td className="px-4 py-4 text-[#cc5200] font-semibold whitespace-nowrap">{(entry.petrol_litres || 0).toFixed(1)}</td>
                      <td className="px-4 py-4 text-slate-600 font-semibold whitespace-nowrap">{(entry.diesel_litres || 0).toFixed(1)}</td>
                      <td className={`px-4 py-4 font-black whitespace-nowrap tracking-tight ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {diff >= 0 ? '+' : ''}₹{diff.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={entry.status === 'Verified' ? 'status-verified badge shadow-sm' : 'status-pending badge shadow-sm'}>{entry.status}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2">
                          {isAdmin && entry.status === 'Pending' && (
                            <button 
                              onClick={() => verifyEntry(entry.id)}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg cursor-pointer text-xs font-bold transition-colors"
                            >
                              <i className="fa-solid fa-check mr-1"></i>Verify
                            </button>
                          )}
                          {isAdmin && (
                            <DeleteShiftButton
                              shiftId={entry.id}
                              petrolLitres={entry.petrol_litres || 0}
                              dieselLitres={entry.diesel_litres || 0}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                    {expanded === entry.id && (
                      <tr key={`${entry.id}-detail`}>
                        <td colSpan={12} className="px-6 py-6 bg-slate-50/50 border-b border-slate-200">
                          <EntryDetail entry={entry} onReadingClick={handleReadingClick} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {loadingAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs select-none">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[#003366] animate-spin" />
            <span className="text-xs font-bold text-slate-700">Loading OCR audit logs...</span>
          </div>
        </div>
      )}

      <ReadingImagePreview
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        auditData={activeAudit}
      />
    </div>
  )
}

function EntryDetail({ 
  entry, 
  onReadingClick 
}: { 
  entry: FuelEntry, 
  onReadingClick: (shiftId: string, nozzleLabel: string, verifiedBy: string) => void 
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px] bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      {/* Nozzle Readings */}
      <div>
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-1.5 border-b border-slate-100">Nozzle Readings</h4>
        <div className="space-y-1.5">
          {(entry.nozzle_readings || []).map((n: any) => (
            <div key={n.id} className="flex justify-between py-1 border-b border-slate-100 items-center">
              <span className="text-slate-500 font-semibold">{n.label}</span>
              <div className="flex items-center gap-1 font-bold text-slate-700">
                <span className="text-slate-500 font-normal">{n.open} → </span>
                <button
                  type="button"
                  onClick={() => onReadingClick(entry.id, n.label, entry.staff_name)}
                  className="text-slate-800 border-b border-dashed border-slate-400 hover:text-[#003366] hover:border-[#003366] cursor-pointer"
                  title="Click to view AI OCR audit details (if used)"
                >
                  {n.close}
                </button>
                <span className="text-slate-400 font-medium">({n.volume?.toFixed(2)}L)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Financials */}
      <div>
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-1.5 border-b border-slate-100">Financial Breakdown</h4>
        <div className="space-y-1.5">
          {[
            { l: 'Rate Petrol', v: `₹${entry.rate_petrol}/L` },
            { l: 'Rate Diesel', v: `₹${entry.rate_diesel}/L` },
            { l: 'GPay/UPI', v: `₹${entry.gpay_amount}` },
            { l: 'Card Swipes', v: `₹${entry.card_amount}` },
            { l: 'Expenses Deducted', v: `₹${entry.expense_amount} ${entry.expense_desc ? `(${entry.expense_desc})` : ''}` },
            { l: 'Counted Cash', v: `₹${entry.counted_cash}` },
          ].map(({ l, v }) => (
            <div key={l} className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-semibold">{l}</span>
              <span className="text-slate-700 font-bold">{v}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Credits */}
      <div>
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-1.5 border-b border-slate-100">Credit Records</h4>
        <div className="space-y-3">
          {(entry.credit_given || []).length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 mb-1">Credit Issued:</p>
              {(entry.credit_given || []).map((c: any, i: number) => (
                <div key={i} className="flex justify-between py-0.5 text-slate-600 font-semibold">
                  <span>{c.name}</span><span className="font-bold text-red-600">₹{c.amt}</span>
                </div>
              ))}
            </div>
          )}
          {(entry.credit_received || []).length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">Credit Recovered:</p>
              {(entry.credit_received || []).map((c: any, i: number) => (
                <div key={i} className="flex justify-between py-0.5 text-slate-600 font-semibold">
                  <span>{c.name}</span><span className="font-bold text-emerald-600">₹{c.amt}</span>
                </div>
              ))}
            </div>
          )}
          {!(entry.credit_given?.length) && !(entry.credit_received?.length) && (
            <p className="text-slate-400 py-2">No credit activity recorded.</p>
          )}
        </div>
      </div>
    </div>
  )
}
