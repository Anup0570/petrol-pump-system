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
      className={`btn-primary w-full py-3.5 rounded-xl text-[15px] font-bold ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {pending ? (
        <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Signing in...</>
      ) : (
        <><i className="fa-solid fa-arrow-right-to-bracket mr-2"></i> Sign In</>
      )}
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
        <input
          name="email"
          type="email"
          required
          className="w-full text-[15px]"
          placeholder="you@saipriyafuels.com"
        />
      </div>

      <div className="mb-6">
        <label
          className="block text-sm font-semibold mb-2 text-slate-500 uppercase tracking-wider text-[11px]"
        >
          Password
        </label>

        <input
          name="password"
          type="password"
          required
          className="w-full text-[15px]"
          placeholder="••••••••"
        />
      </div>

      <SubmitButton />
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-[420px] relative z-10 animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 transform transition-transform hover:scale-105">
            <i className="fa-solid fa-gas-pump text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sai Priya Fuels</h1>
          <p className="text-slate-500 font-medium mt-2">
            Shift Management System
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-8 sm:p-10">
          <h2 className="text-xl font-bold mb-6 text-slate-800 text-center">Sign In to Continue</h2>

          <Suspense fallback={<div className="text-slate-500 text-center py-4 flex items-center justify-center gap-2"><i className="fa-solid fa-spinner fa-spin"></i> Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}