'use client'

import { useState } from 'react'
import { resetTankStock } from './actions'

export default function ResetForm({ adminName, petrolStock, dieselStock, petrolCapacity, dieselCapacity }: { 
  adminName: string;
  petrolStock: number;
  dieselStock: number;
  petrolCapacity: number;
  dieselCapacity: number;
}) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (!window.confirm("Are you sure you want to override the tank stock values? This should only be used to correct mistakes.")) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData(e.currentTarget)
    formData.append('adminName', adminName)

    try {
      const result = await resetTankStock(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess('Tank stock has been successfully updated.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during reset.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-panel" style={{ maxWidth: '600px' }}>
      {error && <div className="mb-4 p-3 rounded text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
      {success && <div className="mb-4 p-3 rounded text-sm" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Petrol Tank Current Stock (Litres)</label>
              <span className="text-xs text-slate-400 font-medium">Capacity: {petrolCapacity.toLocaleString()} L</span>
            </div>
            <input type="number" step="0.01" name="petrolStock" defaultValue={petrolStock} required className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00] shadow-sm" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Diesel Tank Current Stock (Litres)</label>
              <span className="text-xs text-slate-400 font-medium">Capacity: {dieselCapacity.toLocaleString()} L</span>
            </div>
            <input type="number" step="0.01" name="dieselStock" defaultValue={dieselStock} required className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00] shadow-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Reason for Correction (Optional)</label>
            <textarea name="reason" rows={2} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00] shadow-sm placeholder-slate-400" placeholder="e.g., Fixing incorrect delivery entry"></textarea>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
          <button type="button" onClick={() => window.location.href='/admin/dashboard'} className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-sm font-semibold">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-[#ef4444] text-white border-none rounded-xl cursor-pointer hover:bg-red-600 transition-colors text-sm font-semibold shadow-sm" style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Updating...' : 'Update Tank Stock'}
          </button>
        </div>
      </form>
    </div>
  )
}
