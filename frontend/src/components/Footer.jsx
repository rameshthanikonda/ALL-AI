import React from 'react'
import { Link } from 'react-router-dom'

const links = [
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/disclaimer', label: 'Disclaimer' },
]

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200/80 bg-white/95 py-12">
      <div className="mx-auto grid w-full max-w-[1480px] gap-8 px-4 sm:px-6 xl:px-8 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shrink-0">
            <img
              src="/logo.png"
              alt="Student AI Tools logo"
              className="h-full w-full object-contain p-1"
            />
          </div>
          <div className="space-y-3">
            <div className="font-display text-2xl font-bold text-slate-900">Student AI Tools</div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              A comprehensive student edge platform packed with curated AI tools, structured internship updates, rigorous coding practice, and fresh AI news. Build your competitive academic advantage.
            </p>
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Student AI Tools. All rights reserved.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-center text-center"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
