import React from 'react'
import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="space-y-6">
      <section className="section-shell hero-panel p-8">
        <div className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">About</div>
        <h1 className="font-display mt-3 text-4xl text-slate-900">Built to make AI tool discovery feel effortless.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          Student AI Tools is a curated directory focused on clarity, speed, and usefulness. The goal is simple: help
          students find the right tool without wasting time on cluttered lists or confusing search experiences.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['Curated', 'We focus on relevance and practical value instead of overwhelming users with noise.'],
          ['Search-first', 'The experience is designed so users can reach the right tool quickly from any page.'],
          ['Maintainable', 'The structure is meant to scale as your catalog and audience grow.'],
        ].map(([title, description]) => (
          <div key={title} className="section-shell p-5">
            <div className="text-base font-semibold text-slate-900">{title}</div>
            <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
          </div>
        ))}
      </section>

      <section className="section-shell p-8">
        <h2 className="font-display text-3xl text-slate-900">Why this directory exists</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          Students often need different tools for different moments: drafting an essay, summarizing notes, preparing a
          presentation, writing code, or exploring creative ideas. This website is designed to be the place where those
          needs connect to the right products quickly and confidently.
        </p>
        <div className="mt-6">
          <Link
            to="/tools"
            className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            Explore the directory
          </Link>
        </div>
      </section>
    </div>
  )
}
