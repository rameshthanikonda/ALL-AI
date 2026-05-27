import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { fetchInternshipAutomationStatus } from '../services/api'

const internshipAndJobLinks = [
  // Job Portals
  { name: 'Internshala Tech', url: 'https://internshala.com/internships/computer-science-internship', description: 'Tech internships for software development, web, app, data, and testing roles.' },
  { name: 'LinkedIn Software Jobs', url: 'https://www.linkedin.com/jobs/software-engineer-jobs/', description: 'Software engineer, developer, QA, support, and related computer science roles.' },
  { name: 'Naukri IT Jobs', url: 'https://www.naukri.com/information-technology-jobs', description: 'India-focused IT openings for developers, analysts, testers, and support engineers.' },
  { name: 'Unstop Tech Internships', url: 'https://unstop.com/internships?domain=Computer%20Science', description: 'Tech internships, hackathon-linked openings, and student hiring programs.' },
  { name: 'Wellfound Engineering Jobs', url: 'https://wellfound.com/jobs', description: 'Startup jobs for software engineering, backend, frontend, full-stack, and product-tech roles.' },
  { name: 'Indeed Software Jobs', url: 'https://in.indeed.com/jobs?q=software+engineer+fresher', description: 'Quick access to fresher software engineer and developer searches in India.' },

  // Big Tech
  { name: 'Google Careers', url: 'https://www.google.com/about/careers/applications/jobs/results', description: 'Official student and engineering openings across software, systems, data, and research.' },
  { name: 'Microsoft Students', url: 'https://careers.microsoft.com/v2/global/en/programs/students.html', description: 'Student internships and new-grad hiring for software engineering and related tech tracks.' },
  { name: 'Amazon Jobs', url: 'https://www.amazon.jobs/en/teams/internships-for-students', description: 'Student programs and technical hiring for SDE, support, cloud, and operations engineering.' },
  { name: 'Adobe University', url: 'https://careers.adobe.com/us/en/university', description: 'University hiring for software engineering, product development, and platform roles.' },
  { name: 'Meta Careers', url: 'https://www.metacareers.com/jobs', description: 'Engineering and product roles at Meta across AR/VR, AI, infrastructure, and social platforms.' },
  { name: 'Apple Jobs', url: 'https://jobs.apple.com/en-us/search', description: 'Software engineering, hardware, ML, and internship openings at Apple worldwide.' },
  { name: 'NVIDIA Careers', url: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite', description: 'GPU, AI, deep learning, and systems engineering roles at NVIDIA.' },
  { name: 'Oracle Careers', url: 'https://careers.oracle.com/jobs/', description: 'Cloud, database, and enterprise software engineering roles at Oracle.' },
  { name: 'Salesforce Careers', url: 'https://careers.salesforce.com/en/jobs/', description: 'CRM, cloud platform, and AI engineering roles at Salesforce.' },

  // Retail & Consumer
  { name: 'Walmart Tech', url: 'https://careers.walmart.com/technology', description: 'Technology and engineering roles at Walmart including e-commerce, data, and supply chain.' },
  { name: 'Flipkart Careers', url: 'https://www.flipkartcareers.com/', description: 'Engineering, data science, and product roles at India\'s leading e-commerce company.' },
  { name: 'Samsung Careers', url: 'https://www.samsung.com/in/about-us/careers/', description: 'R&D, software, and hardware engineering roles at Samsung India.' },

  // Hardware & Electronics
  { name: 'Dell Careers', url: 'https://jobs.dell.com/', description: 'Software, infrastructure, cloud, and support engineering roles at Dell Technologies.' },

  // Finance & Consulting
  { name: 'Goldman Sachs Students', url: 'https://www.goldmansachs.com/careers/students/', description: 'Student programs, internships, and new analyst roles in engineering and technology.' },
  { name: 'PayPal Careers', url: 'https://careers.pypl.com/home/', description: 'Fintech engineering, payments, and platform roles at PayPal.' },
  { name: 'Deloitte Careers', url: 'https://apply.deloitte.com/', description: 'Technology consulting, cyber, analytics, and engineering roles at Deloitte.' },

  // Indian IT Services
  { name: 'TCS Careers', url: 'https://www.tcs.com/careers', description: 'Campus hiring, NQT, and IT services roles at Tata Consultancy Services.' },
  { name: 'Infosys Careers', url: 'https://www.infosys.com/careers/', description: 'InfyTQ, campus hiring, and IT consulting roles at Infosys.' },
  { name: 'Cognizant Careers', url: 'https://careers.cognizant.com/', description: 'IT services, digital engineering, and GenC hiring programs at Cognizant.' },
  { name: 'Wipro Careers', url: 'https://careers.wipro.com/', description: 'Elite NLTH, campus hiring, and technology roles at Wipro.' },
  { name: 'HCLTech Careers', url: 'https://www.hcltech.com/careers', description: 'Engineering, cloud, and digital services roles at HCLTech.' },

  // Startups & Transport
  { name: 'Uber Careers', url: 'https://www.uber.com/us/en/careers/', description: 'Engineering, ML, and platform roles at Uber across mobility and delivery.' },
  { name: 'Graviton Research', url: 'https://graviton.in/careers', description: 'Quantitative research and technology roles at Graviton.' },
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
  }, [])

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
