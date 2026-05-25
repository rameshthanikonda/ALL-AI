import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import ToolCard from '../components/ToolCard'
import { fetchTools } from '../services/api'

export default function ToolsList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [facets, setFacets] = useState({ categories: [], tags: [] })

  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const tags = searchParams.get('tags') || ''

  async function load(params) {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchTools({ ...params, perPage: 500 })
      setTools(data.tools || [])
      setFacets(data.facets || { categories: [], tags: [] })
    } catch (err) {
      console.error('Load tools error', err)
      setError(err)
      setTools([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load({ q, category, tags })
  }, [q, category, tags])

  function runSearch(next) {
    const params = {}
    if (next.q) params.q = next.q
    if (next.category) params.category = next.category
    if (next.tags) params.tags = next.tags
    setSearchParams(params)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-xl lg:px-12 lg:py-10">
        <div className="max-w-5xl">
          <div className="text-sm font-medium uppercase tracking-[0.2em] text-slate-300">Tool Directory</div>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Find the right AI tool quickly across a large catalog</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
            Search by name, category, tag, or description to discover useful tools for study, writing, design, coding,
            and productivity.
          </p>
        </div>
      </section>

      <SearchBar
        initialQuery={q}
        initialCategory={category}
        initialTags={tags}
        categories={facets.categories}
        popularTags={facets.tags}
        onSearch={runSearch}
      />

      {!loading && !error && tools.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          Showing <span className="font-semibold text-slate-900">{tools.length}</span> tools with the main platforms first,
          so users notice the strongest options quickly while still being able to browse the full catalog.
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
          ))}
        </div>
      )}

      {error && <div className="text-red-600">Error loading tools: {error.message || 'unknown'}</div>}

      {!loading && !error && tools.length === 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600">
          No tools matched your search. Try a broader term or remove one of the filters.
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool._id || tool.id || tool.slug} {...tool} />
          ))}
        </div>
      )}
    </div>
  )
}
