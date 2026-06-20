'use client'

import { useState } from 'react'
import { forceResetPumps } from './actions'

export default function ResetForm({ adminName }: { adminName: string }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    if (!window.confirm("Are you sure you want to force reset the pump readings? This will override the automatic opening readings for the next shift.")) {
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData(e.currentTarget)
    formData.append('adminName', adminName)

    try {
      const result = await forceResetPumps(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess('Pump readings have been successfully reset. They will be used as the opening values for the next shift.')
        ;(e.target as HTMLFormElement).reset()
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">P1 Nozzle 1 (Petrol)</label>
            <input type="number" step="0.01" name="p1n1" required className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00] shadow-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">P1 Nozzle 2 (Diesel)</label>
            <input type="number" step="0.01" name="p1n2" required className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00] shadow-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">P2 Nozzle 3 (Petrol)</label>
            <input type="number" step="0.01" name="p2n3" required className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00] shadow-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">P2 Nozzle 4 (Diesel)</label>
            <input type="number" step="0.01" name="p2n4" required className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00] shadow-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">2T Oil Dispenser</label>
            <input type="number" step="0.01" name="oil" required className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00] shadow-sm" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
          <button type="button" onClick={() => window.location.href='/admin/dashboard'} className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-sm font-semibold">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-[#ef4444] text-white border-none rounded-xl cursor-pointer hover:bg-red-600 transition-colors text-sm font-semibold shadow-sm" style={{ opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Reseting...' : 'Force Reset Openings'}
          </button>
        </div>
      </form>
    </div>
  )
}
