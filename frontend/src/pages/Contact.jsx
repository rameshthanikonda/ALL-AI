import React from 'react'

export default function Contact() {
  return (
    <div className="space-y-6">
      <section className="section-shell hero-panel p-8">
        <div className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">Contact</div>
        <h1 className="font-display mt-3 text-4xl text-slate-900">Let's keep improving the directory together.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          If you have feedback, ideas, or a tool recommendation, reach out. The best directories get better through
          thoughtful suggestions from the people who use them.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="section-shell p-6">
          <div className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">Support</div>
          <div className="mt-3 text-2xl font-semibold text-slate-900">Add your official support email here</div>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Replace this placeholder with your real contact inbox before publishing so users never see a fake example address.
          </p>
        </div>

        <div className="section-shell p-6">
          <div className="text-sm font-medium uppercase tracking-[0.16em] text-slate-400">What to send</div>
          <ul className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
            <li>Suggestions to improve search, navigation, or design</li>
            <li>Useful AI tools that should be added to the directory</li>
            <li>Corrections to listings, descriptions, or categories</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
