import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ToolCard from '../components/ToolCard'
import { useUser } from '../contexts/UserContext'
import { bootstrapPortalContent, fetchPortalOverview } from '../services/api'

export default function Home() {
  const { user } = useUser() || {}
  const [overview, setOverview] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      setError(null)

      try {
        let data = await fetchPortalOverview()

        const toolsCount = Number(data?.stats?.tools || 0)

        if (toolsCount === 0) {
          await bootstrapPortalContent()
          data = await fetchPortalOverview()
        }

        if (!mounted) return
        setOverview(data)
      } catch (err) {
        if (!mounted) return
        setError(err)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  const featuredTools = overview?.sections?.tools || []

  return (
    <div className="space-y-8">
      <section className="hero-panel overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 px-8 py-14 text-white shadow-xl lg:px-12">
        <div className="max-w-5xl">
          <div className="text-sm font-medium uppercase tracking-[0.22em] text-blue-200">AI Tools Platform</div>
          <h1 className="font-display mt-4 text-5xl leading-tight text-white sm:text-6xl">
            Find the right AI tools quickly across a large catalog.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
            Discover real student tools for study, writing, coding, research, design, productivity, and daily academic work.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/tools"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Explore tools
            </Link>
          </div>
        </div>
      </section>

      {user ? (
        <>
          {error && (
            <div className="section-shell p-5 text-sm text-rose-700">
              Some homepage content could not be loaded right now. Please check that the backend and data sources are available.
            </div>
          )}

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">Core Directory</div>
                <h2 className="font-display mt-2 text-3xl text-slate-900">Tools that support student workflows.</h2>
              </div>
              <Link to="/tools" className="text-sm font-semibold text-blue-600">
                View all tools
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {featuredTools.map((tool) => (
                <ToolCard key={tool.slug} slug={tool.slug} name={tool.title} description={tool.summary} category={tool.category} tags={tool.tags} />
              ))}
            </div>
          </section>

          <section className="hero-panel overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white via-sky-50 to-blue-100 px-8 py-12 shadow-lg lg:px-12">
            <div className="max-w-5xl">
              <div className="text-sm font-medium uppercase tracking-[0.22em] text-sky-700">Why This Website</div>
              <h2 className="font-display mt-4 text-4xl leading-tight text-slate-900 sm:text-5xl">
                One place for students to discover practical AI tools without fake listings, clutter, or confusing search.
              </h2>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
                Student AI Tools is designed to highlight useful platforms for study, coding, writing, documents, research, and productivity.
                The goal is simple: help students find what they actually need faster.
              </p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  ['Real tools', 'Curated tool names, direct website links, and short descriptions students can understand quickly.'],
                  ['Student-first search', 'A simpler way to explore tools for notes, resumes, coding, presentations, PDFs, and research.'],
                  ['Growing directory', 'The website is built to keep expanding with better tools, stronger categories, and cleaner discovery.'],
                ].map(([title, copy]) => (
                  <div key={title} className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 shadow-sm">
                    <div className="text-lg font-semibold text-slate-900">{title}</div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">Featured Tools</div>
                <h2 className="font-display mt-2 text-3xl text-slate-900">Popular tools students can start using right away.</h2>
              </div>
              <Link to="/tools" className="text-sm font-semibold text-blue-600">
                View all tools
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {featuredTools.map((tool) => (
                <ToolCard
                  key={tool.slug}
                  slug={tool.slug}
                  name={tool.title}
                  description={tool.summary}
                  category={tool.category}
                  tags={tool.tags}
                />
              ))}
            </div>
          </section>

          <section className="section-shell p-8">
            <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">Member Access</div>
            <h3 className="font-display mt-3 text-2xl text-slate-900">Login to unlock internships, coding, and AI news.</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Before login the homepage promotes your tool directory. After login, users can access the remaining student sections.
            </p>
            <div className="mt-6">
              <Link
                to="/auth"
                className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Login
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
