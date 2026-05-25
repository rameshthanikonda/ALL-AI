import React from 'react'

export default function Privacy() {
  return (
    <div className="space-y-6">
      <section className="section-shell hero-panel p-8">
        <div className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">Privacy</div>
        <h1 className="font-display mt-3 text-4xl text-slate-900">A simple commitment to respectful data use.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          This website is designed to be useful, not invasive. We aim to collect only what is needed for authentication,
          account features, and improving the directory experience.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['Account data', 'We store the basic details needed for sign-in and account access.'],
          ['Usage data', 'Analytics or service providers may collect limited usage information.'],
          ['Third-party tools', 'External tool websites have their own policies and practices once you leave this site.'],
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
