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
      {error && <div className="mb-4 p-3 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
      {success && <div className="mb-4 p-3 rounded" style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">P1 Nozzle 1 (Petrol)</label>
            <input type="number" step="0.01" name="p1n1" required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-blue-500 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">P1 Nozzle 2 (Diesel)</label>
            <input type="number" step="0.01" name="p1n2" required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-blue-500 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">P2 Nozzle 3 (Petrol)</label>
            <input type="number" step="0.01" name="p2n3" required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-blue-500 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">P2 Nozzle 4 (Diesel)</label>
            <input type="number" step="0.01" name="p2n4" required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-blue-500 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">2T Oil Dispenser</label>
            <input type="number" step="0.01" name="oil" required className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-blue-500 shadow-sm" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
          <button type="button" onClick={() => window.location.href='/admin/dashboard'} style={{ padding: '8px 16px', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer' }}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Reseting...' : 'Force Reset Openings'}
          </button>
        </div>
      </form>
    </div>
  )
}
