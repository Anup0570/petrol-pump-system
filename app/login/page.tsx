'use client'

import { login } from './actions'

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Sai Priya Fuels</h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
            Shift Management System
          </p>
        </div>

        {/* Card */}
        <div
          className="glass-panel"
          style={{ padding: '32px', background: '#1e293b', borderRadius: '12px' }}
        >
          <h2 className="text-lg font-semibold mb-6 text-white">Sign In</h2>

          {/* IMPORTANT */}
          <form action={login}>

            <div className="mb-4">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: '#94a3b8' }}
              >
                Email Address
              </label>

              <input
                name="email"
                type="email"
                required
                className="w-full p-2 rounded bg-slate-800 text-white"
                placeholder="you@saipriyafuels.com"
              />
            </div>

            <div className="mb-6">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: '#94a3b8' }}
              >
                Password
              </label>

              <input
                name="password"
                type="password"
                required
                className="w-full p-2 rounded bg-slate-800 text-white"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                border: 'none'
              }}
            >
              Sign In
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}