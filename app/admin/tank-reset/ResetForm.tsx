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
      {error && <div className="mb-4 p-3 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
      {success && <div className="mb-4 p-3 rounded" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">Petrol Tank Current Stock (Litres)</label>
              <span className="text-xs text-slate-500">Capacity: {petrolCapacity.toLocaleString()} L</span>
            </div>
            <input type="number" step="0.01" name="petrolStock" defaultValue={petrolStock} required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-blue-500 shadow-sm" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">Diesel Tank Current Stock (Litres)</label>
              <span className="text-xs text-slate-500">Capacity: {dieselCapacity.toLocaleString()} L</span>
            </div>
            <input type="number" step="0.01" name="dieselStock" defaultValue={dieselStock} required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-blue-500 shadow-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Correction (Optional)</label>
            <textarea name="reason" rows={2} className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-blue-500 shadow-sm" placeholder="e.g., Fixing incorrect delivery entry"></textarea>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <button type="button" onClick={() => window.location.href='/admin/dashboard'} style={{ padding: '8px 16px', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Updating...' : 'Update Tank Stock'}
          </button>
        </div>
      </form>
    </div>
  )
}
