import React, { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'

const publicNavLinks = [
  { to: '/tools', label: 'Explore Tools' },
  { to: '/internships', label: 'Internships' },
  { to: '/coding', label: 'Coding' },
  { to: '/news', label: 'AI News' },
]

const privateNavLinks = [
  { to: '/tools', label: 'Explore Tools' },
  { to: '/internships', label: 'Internships' },
  { to: '/coding', label: 'Coding' },
  { to: '/news', label: 'AI News' },
]

export default function Header() {
  const { user } = useUser() || {}
  const navigate = useNavigate()
  const location = useLocation()
  const [logoMissing, setLogoMissing] = useState(false)
  const navLinks = user ? privateNavLinks : publicNavLinks
  const isProfileOpen = location.pathname === '/profile'

  function handleProtectedNavigation(event, link) {
    if (user || !link.requiresAuth) return
    event.preventDefault()
    window.alert(`Please login to access ${link.label}.`)
    navigate('/auth')
  }

  function handleProfileToggle() {
    if (!isProfileOpen) {
      navigate('/profile')
      return
    }

    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4 px-4 py-4 sm:px-6 xl:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="group flex items-center gap-4" aria-label="Home">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-100 via-white to-blue-100 shadow-sm">
              {!logoMissing && (
                <img
                  src="/logo.png"
                  alt="Student AI Tools logo"
                  className="h-full w-full object-contain p-2"
                  onError={() => setLogoMissing(true)}
                />
              )}
              {logoMissing && <span className="text-sm font-extrabold uppercase tracking-[0.24em] text-sky-700">SAI</span>}
            </div>

            <div>
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-sky-700">Student AI Tools</div>
              <div className="font-display text-2xl text-slate-900 transition group-hover:text-sky-700">Build your student edge</div>
            </div>
          </Link>

          <Link
            to="/tools"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
          >
            Search
          </Link>
        </div>

        <nav className="flex flex-wrap items-center gap-2 lg:justify-end" aria-label="Main navigation">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={(event) => handleProtectedNavigation(event, link)}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          {user ? (
            <>
              {user.isAdmin && (
                <NavLink
                  to="/admin/import"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Admin Import
                </NavLink>
              )}
              {user.isAdmin && (
                <NavLink
                  to="/admin/review"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Review Imports
                </NavLink>
              )}
              <button
                type="button"
                onClick={handleProfileToggle}
                className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition ${
                  isProfileOpen ? 'bg-slate-900' : 'bg-blue-600'
                }`}
              >
                {user.displayName || 'Profile'}
              </button>
            </>
          ) : (
            <NavLink
              to="/auth"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Login
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}
