'use client'

import { useState } from 'react'
import { login } from './actions'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
               style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
            <i className="fa-solid fa-gas-pump text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-white">Sai Priya Fuels</h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Shift Management System</p>
        </div>

        {/* Card */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <h2 className="text-lg font-semibold mb-6 text-white">Sign In</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>
                Email Address
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="you@saipriyafuels.com"
                autoComplete="email"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm font-medium"
                   style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                <i className="fa-solid fa-circle-exclamation mr-2"></i>
                {error === 'Invalid login credentials' ? 'Incorrect email or password.' : error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all duration-200"
              style={{
                background: loading ? '#334155' : 'linear-gradient(135deg, #2563eb, #7c3aed)',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
                fontSize: '15px'
              }}
            >
              {loading ? (
                <><i className="fa-solid fa-spinner fa-spin mr-2"></i>Signing in...</>
              ) : (
                <><i className="fa-solid fa-arrow-right-to-bracket mr-2"></i>Sign In</>
              )}
            </button>
          </form>
        </div>

        {/* Role hint */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="glass-panel text-center" style={{ padding: '12px 16px' }}>
            <i className="fa-solid fa-clipboard-user mb-1 block" style={{ color: '#60a5fa' }}></i>
            <p className="text-xs font-medium text-white">Staff</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Enter shift data</p>
          </div>
          <div className="glass-panel text-center" style={{ padding: '12px 16px' }}>
            <i className="fa-solid fa-chart-line mb-1 block" style={{ color: '#a78bfa' }}></i>
            <p className="text-xs font-medium text-white">Admin / Owner</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Dashboard & reports</p>
          </div>
        </div>
      </div>
    </div>
  )
}
