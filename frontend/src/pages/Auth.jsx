import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, logout, register } from '../services/api'
import { useUser } from '../contexts/UserContext'
import { getBackendUrl } from '../utils/appConfig'

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.81 12.23c0-.72-.06-1.25-.19-1.81H12.2v3.48h5.53c-.11.87-.73 2.19-2.1 3.07l-.02.12 3.05 2.36.21.02c1.93-1.78 3.04-4.39 3.04-7.24Z"
      />
      <path
        fill="#34A853"
        d="M12.2 22c2.71 0 4.98-.9 6.64-2.44l-3.17-2.46c-.85.59-1.99 1-3.47 1-2.65 0-4.9-1.74-5.7-4.15l-.12.01-3.17 2.46-.04.11C4.82 19.86 8.19 22 12.2 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.5 13.95A5.93 5.93 0 0 1 6.2 12c0-.68.11-1.34.29-1.95l-.01-.13-3.21-2.5-.11.05A9.8 9.8 0 0 0 2 12c0 1.57.38 3.05 1.05 4.37l3.45-2.42Z"
      />
      <path
        fill="#EA4335"
        d="M12.2 5.9c1.87 0 3.13.81 3.85 1.48l2.81-2.74C17.17 3.07 14.91 2 12.2 2 8.19 2 4.82 4.14 3.16 7.47l3.33 2.58c.82-2.41 3.07-4.15 5.71-4.15Z"
      />
    </svg>
  )
}

export default function Auth() {
  const navigate = useNavigate()
  const { refresh, user, loading } = useUser() || {}
  const backendUrl = getBackendUrl()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [msg, setMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      navigate('/profile', { replace: true })
    }
  }, [loading, user, navigate])

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setMsg('')

    try {
      if (mode === 'login') {
        await login({ email, password })
      } else {
        await register({ email, password, displayName })
      }

      await refresh?.()
      navigate('/profile')
    } catch (err) {
      setMsg(err.body?.error || err.message || 'failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogout() {
    await logout()
    await refresh?.()
    setMsg('You have been logged out.')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 p-8 text-white shadow-xl">
        <div className="max-w-xl">
          <div className="text-sm font-medium uppercase tracking-[0.24em] text-blue-200">Welcome Back</div>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">Save your workflow and discover the right tools faster.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-200 sm:text-base">
            Sign in to manage your favorite AI tools, add new finds, and keep your workflow organized across writing,
            study, coding, design, and productivity.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Faster discovery</div>
              <div className="mt-2 text-sm text-slate-300">Find tools by name, keywords, category, and description in one place.</div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Personal workspace</div>
              <div className="mt-2 text-sm text-slate-300">Keep track of useful tools and contribute new ones as your collection grows.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {mode === 'login' ? 'Access your account' : 'Create your account'}
            </h2>
          </div>
          {user && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Logout
            </button>
          )}
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              window.location.href = `${backendUrl}/auth/google`
            }}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 font-medium text-slate-900 transition hover:border-slate-400 hover:bg-slate-50"
          >
            <GoogleMark />
            Continue with Google
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          Or continue with email
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Display name</label>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button
            className="w-full rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 text-sm text-slate-600">
          {mode === 'login' ? 'Need an account?' : 'Already have an account?'}{' '}
          <button
            type="button"
            className="font-semibold text-blue-600"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </div>

        {msg && <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{msg}</p>}
      </section>
    </div>
  )
}
