 'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { addStaffName, deleteStaffName } from './actions'

export default function StaffManager({ initialStaff }: { initialStaff: any[] }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData(e.currentTarget)
    try {
      const result = await addStaffName(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(`Staff name added!`)
        ;(e.target as HTMLFormElement).reset()
      }
    } catch (err: any) {
      setError(err.message || 'Error adding staff name.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return
    
    setLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('id', id)

    try {
      const result = await deleteStaffName(formData)
      if (result?.error) {
        setError(result.error)
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting staff name.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_350px] gap-6 items-start">
      {/* Left Col: Staff List */}
      <div className="glass-panel">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-base">
          <i className="fa-solid fa-users text-[#ff6a00]"></i> Active Staff Names
        </h3>

        {error && <div className="mb-4 p-3 rounded text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
        {success && <div className="mb-4 p-3 rounded text-sm" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>{success}</div>}

        <div className="overflow-x-auto">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <AnimatePresence>
              <motion.tbody>
                {initialStaff.length === 0 ? (
                  <tr><td colSpan={2} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>No staff names added yet.</td></tr>
                ) : initialStaff.map((staff: any) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={staff.id} 
                    style={{ borderBottom: '1px solid #f1f5f9' }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td style={{ padding: '12px', color: '#334155', fontWeight: 500 }}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#ff6a00]/10 border border-[#ff6a00]/20 flex items-center justify-center text-xs text-[#ff6a00] font-bold">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        {staff.name}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDelete(staff.id, staff.name)}
                        disabled={loading}
                        className="hover:scale-110 transition-transform cursor-pointer text-xs font-semibold"
                        style={{ background: 'transparent', color: '#ef4444', border: 'none', opacity: loading ? 0.5 : 1 }}>
                        <i className="fa-solid fa-trash-can mr-1"></i> Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </AnimatePresence>
          </table>
        </div>
      </div>

      {/* Right Col: Add Form */}
      <div className="glass-panel">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-base">
          <i className="fa-solid fa-user-plus text-[#ff6a00]"></i> Add New Staff
        </h3>

        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Staff Name</label>
            <input type="text" name="name" required placeholder="e.g., Ravi" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00] text-sm shadow-sm placeholder-slate-400" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full shadow-md py-2.5 text-sm font-bold cursor-pointer" style={{ 
             borderRadius: '12px', 
             opacity: loading ? 0.7 : 1, marginTop: '20px'
          }}>
            {loading ? 'Adding...' : 'Add Staff'}
          </button>
        </form>
      </div>
    </div>
  )
}
