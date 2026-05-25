import React from 'react'

export default function Terms() {
  return (
    <div className="space-y-6">
      <section className="section-shell hero-panel p-8">
        <div className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">Terms</div>
        <h1 className="font-display mt-3 text-4xl text-slate-900">Clear expectations for using the directory.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          Student AI Tools is a discovery platform. We provide listings and links to third-party products, but each
          external service operates independently and may change over time.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['Use responsibly', 'You are responsible for how you use external tools and services.'],
          ['Third-party links', 'We are not responsible for the content, pricing, or availability of external websites.'],
          ['Directory updates', 'Listings may evolve as tools change, improve, or become unavailable.'],
        ].map(([title, description]) => (
          <div key={title} className="section-shell p-5">
            <div className="text-base font-semibold text-slate-900">{title}</div>
            <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
