'use client'

import { useSearchParams } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { Suspense } from 'react'
import { login } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-3 rounded-xl font-semibold text-white ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
        border: 'none'
      }}
    >
      {pending ? 'Signing in...' : 'Sign In'}
    </button>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <form action={login}>
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm">
          {error}
        </div>
      )}

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
          className="w-full p-2 rounded bg-white border border-slate-300 text-slate-900"
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
          className="w-full p-2 rounded bg-white border border-slate-300 text-slate-900"
          placeholder="••••••••"
        />
      </div>

      <SubmitButton />
    </form>
  )
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#f8fafc' }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Sai Priya Fuels</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>
            Shift Management System
          </p>
        </div>

        {/* Card */}
        <div
          className="glass-panel"
          style={{ padding: '32px', background: '#ffffff', borderRadius: '12px' }}
        >
          <h2 className="text-lg font-semibold mb-6 text-slate-800">Sign In</h2>

          <Suspense fallback={<div className="text-slate-600 text-center">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}