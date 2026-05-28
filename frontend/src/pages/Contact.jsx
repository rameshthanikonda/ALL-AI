import React from 'react'

export default function Contact() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto py-6">
      <section className="section-shell hero-panel p-8 md:p-12">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Contact Us</div>
        <h1 className="font-display mt-4 text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Let's Improve the Student AI Ecosystem Together
        </h1>
        <p className="mt-4 text-sm sm:text-base leading-7 text-slate-600">
          Have an idea to improve the search interface? Noticed a tool link that is broken or outdated? Or perhaps you've built an incredible AI tool that deserves a spot in our directory? Reach out to us. We read every email and constantly improve based on your feedback.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="section-shell p-8 space-y-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">Official Inbox</div>
            <a 
              href="mailto:studentairelated@gmail.com" 
              className="mt-2 block font-display text-2xl font-bold text-blue-600 hover:underline hover:text-blue-700"
            >
              studentairelated@gmail.com
            </a>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              For general support, feedback, correction requests, business or academic partnerships, email our official team directly. We strive to reply within 24 to 48 hours.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Response Guarantees</h4>
            <ul className="text-xs space-y-2 text-slate-500 list-disc pl-4">
              <li>Verified tool creators receive expedited review replies.</li>
              <li>Accessibility and display bugs are addressed on a high-priority basis.</li>
              <li>Academic and university organization partnership inquiries are routed to operations.</li>
            </ul>
          </div>
        </section>

        <section className="section-shell p-8 space-y-6">
          <h3 className="font-display text-2xl font-bold text-slate-900">Submission Guidelines</h3>
          <p className="text-sm leading-6 text-slate-600">
            If you want to suggest a new artificial intelligence tool for student workflows, please include:
          </p>
          <ul className="text-sm space-y-3 text-slate-600 list-inside list-decimal">
            <li><strong className="text-slate-800">Tool Name & Official URL:</strong> Must lead to the active landing page.</li>
            <li><strong className="text-slate-800">Feature Description:</strong> A 2-3 sentence overview of why this helps students.</li>
            <li><strong className="text-slate-800">Categorization:</strong> Writing, coding, research, productivity, etc.</li>
            <li><strong className="text-slate-800">Pricing Status:</strong> Highlight free tiers, trials, or student discounts.</li>
          </ul>
          <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
            Note: We enforce high quality control standards. Automated spam or low-utility template landing pages will not be accepted.
          </p>
        </section>
      </div>

      <section className="section-shell p-8 md:p-12 space-y-6">
        <h3 className="font-display text-2xl font-bold text-slate-900">Our Committment to Open Access</h3>
        <p className="text-sm sm:text-base leading-7 text-slate-600">
          This portal was built by students, for students. We believe in keeping access to digital learning tools open, transparent, and democratic. If you represent an educational institution or student body and want to integrate our curated dataset or internship feed, please contact us. We are happy to coordinate open integrations.
        </p>
      </section>
    </div>
  )
}
