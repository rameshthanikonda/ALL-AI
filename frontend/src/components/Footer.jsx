import React from 'react'
import { Link } from 'react-router-dom'

const links = [
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
]

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200/80 bg-white/90">
      <div className="mx-auto grid w-full max-w-[1480px] gap-8 px-4 py-10 sm:px-6 xl:px-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <div className="font-display text-2xl text-slate-900">Student AI Tools</div>
          <p className="max-w-xl text-sm leading-7 text-slate-600">
            A student growth platform built around AI tools, internships, coding practice, and AI news with strong discovery and cleaner focus.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
