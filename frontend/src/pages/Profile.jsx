import React from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { logout } from '../services/api'

export default function Profile() {
  const { user, loading, refresh } = useUser() || {}
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await logout()
    } catch (e) {
      // ignore
    }
    await refresh()
    navigate('/')
  }

  if (loading) {
    return <div className="text-slate-600">Loading profile...</div>
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-8 text-white shadow-xl">
        <div className="text-sm font-medium uppercase tracking-[0.22em] text-blue-200">Your Profile</div>
        <h1 className="mt-4 text-4xl font-semibold leading-tight">
          Welcome back, {user.displayName || user.email?.split('@')[0] || 'there'}.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
          This is your account space for managing saved tools, browsing new additions, and keeping your AI workflow
          organized.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            to="/tools"
            className="rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
          >
            <div className="text-sm font-semibold">Search tools</div>
            <div className="mt-2 text-sm text-slate-300">Find tools by keyword, category, and description.</div>
          </Link>
          <Link
            to="/tools/new"
            className="rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
          >
            <div className="text-sm font-semibold">Add a tool</div>
            <div className="mt-2 text-sm text-slate-300">Share a useful tool with the rest of your directory.</div>
          </Link>
          <Link
            to="/internships"
            className="rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
          >
            <div className="text-sm font-semibold">Explore internships</div>
            <div className="mt-2 text-sm text-slate-300">Jump into opportunities, coding, and fresh AI discoveries.</div>
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Account Details</div>
        <div className="mt-6 space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Display name</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{user.displayName || 'Not provided'}</div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Email</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{user.email || 'Not available'}</div>
          </div>

          <div className="pt-4">
            <button onClick={handleLogout} className="w-full rounded-3xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700">
              Log out
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
