import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { fetchInternshipAutomationStatus } from '../services/api'

const internshipAndJobLinks = [
  { name: 'Internshala Tech', url: 'https://internshala.com/internships/computer-science-internship', description: 'Tech internships for software development, web, app, data, and testing roles.' },
  { name: 'LinkedIn Software Jobs', url: 'https://www.linkedin.com/jobs/software-engineer-jobs/', description: 'Software engineer, developer, QA, support, and related computer science roles.' },
  { name: 'Naukri IT Jobs', url: 'https://www.naukri.com/information-technology-jobs', description: 'India-focused IT openings for developers, analysts, testers, and support engineers.' },
  { name: 'Unstop Tech Internships', url: 'https://unstop.com/internships?domain=Computer%20Science', description: 'Tech internships, hackathon-linked openings, and student hiring programs.' },
  { name: 'Wellfound Engineering Jobs', url: 'https://wellfound.com/jobs', description: 'Startup jobs for software engineering, backend, frontend, full-stack, and product-tech roles.' },
  { name: 'Indeed Software Jobs', url: 'https://in.indeed.com/jobs?q=software+engineer+fresher', description: 'Quick access to fresher software engineer and developer searches in India.' },
  { name: 'Google Careers', url: 'https://www.google.com/about/careers/applications/jobs/results', description: 'Official student and engineering openings across software, systems, data, and research.' },
  { name: 'Microsoft Students', url: 'https://careers.microsoft.com/v2/global/en/programs/students.html', description: 'Student internships and new-grad hiring for software engineering and related tech tracks.' },
  { name: 'Amazon Jobs', url: 'https://www.amazon.jobs/en/teams/internships-for-students', description: 'Student programs and technical hiring for SDE, support, cloud, and operations engineering.' },
  { name: 'Adobe University', url: 'https://careers.adobe.com/us/en/university', description: 'University hiring for software engineering, product development, and platform roles.' },
]

function OpportunityCard({ item }) {
  const publishedAt = item.publishedAt ? new Date(item.publishedAt) : null
  const releaseDate = publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt.toLocaleDateString() : 'Recent'

  return (
    <article className="section-shell p-5 transition hover:-translate-y-0.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500">
          Release date: {releaseDate}
        </span>
        {item.source && (
          <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs text-blue-700">
            {item.source}
          </span>
        )}
      </div>
      <h3 className="text-xl font-semibold text-slate-900">{item.title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{item.summary || item.description}</p>
      {item.url && (
        <a href={item.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex text-sm font-semibold text-blue-600">
          Open opportunity
        </a>
      )}
    </article>
  )
}

export default function Internships() {
  const { user } = useUser() || {}
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState(30)

  useEffect(() => {
    if (user) return
    window.alert('Please login to access Internships.')
    navigate('/auth')
  }, [navigate, user])

  useEffect(() => {
    if (!user) return undefined
    let mounted = true

    fetchInternshipAutomationStatus()
      .then((data) => {
        if (mounted) setItems(data.items || [])
      })
      .catch(() => {
        if (mounted) setItems([])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [user])

  if (!user) return null

  const filteredItems = items.filter((item) => {
    if (!item.publishedAt) return true
    const publishedAt = new Date(item.publishedAt)
    if (Number.isNaN(publishedAt.getTime())) return true

    const threshold = new Date()
    threshold.setDate(threshold.getDate() - activeFilter)

    return publishedAt >= threshold
  })

  return (
    <div className="space-y-8">
      <section className="hero-panel overflow-hidden rounded-[2rem] border border-slate-900/80 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 px-8 py-12 text-white shadow-xl lg:px-12">
        <div className="max-w-4xl">
          <div className="text-sm font-medium uppercase tracking-[0.22em] text-sky-200">Internships And Jobs</div>
          <h1 className="font-display mt-4 text-5xl leading-tight text-white sm:text-6xl">
            Curated internships and early-career opportunities.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
            Explore trusted links for computer science internships and jobs across software engineering, web development, backend, frontend, QA, data, and support roles. The openings section below is updated automatically.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">Useful Links</div>
          <h2 className="font-display mt-2 text-3xl text-slate-900">Internship and job links worth checking first.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {internshipAndJobLinks.map((link) => (
            <a key={link.name} href={link.url} target="_blank" rel="noreferrer" className="section-shell p-5 transition hover:-translate-y-0.5">
              <div className="text-lg font-semibold text-slate-900">{link.name}</div>
              <div className="mt-3 text-sm leading-7 text-slate-600">{link.description}</div>
            </a>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">Latest Openings</div>
          <div className="flex flex-wrap gap-2">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setActiveFilter(days)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  activeFilter === days
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                Last {days} days
              </button>
            ))}
          </div>
        </div>
        <div className="text-sm text-slate-600">
          Displays positions posted in the last {activeFilter} days so users can concentrate on opportunities currently accepting applications.
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="section-shell h-48 animate-pulse bg-white/70" />
            ))}
          </div>
        ) : !filteredItems.length ? (
          <div className="section-shell p-5 text-sm text-slate-600">
            No openings are available for this date filter right now.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <OpportunityCard key={`${item.kind}-${item.slug}`} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
