import React, { useEffect, useState } from 'react'
import { fetchPortalFeed, refreshAINewsAutomation } from '../services/api'

function NewsCard({ item }) {
  return (
    <article className="section-shell p-5 transition hover:-translate-y-0.5">
      <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
        {item.source || item.category || 'AI News'}
      </div>
      <h3 className="mt-3 text-xl font-semibold text-slate-900">{item.title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{item.summary || item.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(item.tags || []).slice(0, 5).map((tag) => (
          <span key={tag} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
            {tag}
          </span>
        ))}
      </div>
      {item.url && (
        <a href={item.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex text-sm font-semibold text-blue-600">
          Read article
        </a>
      )}
    </article>
  )
}

export default function AINews() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function loadNews() {
    const response = await fetchPortalFeed('ai_news', 12)
    setItems(response.items || [])
  }

  useEffect(() => {
    let mounted = true

    loadNews()
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

  async function handleRefresh() {
    try {
      setRefreshing(true)
      await refreshAINewsAutomation()
      await loadNews()
    } catch (error) {
      console.error('AI news refresh failed', error)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="hero-panel overflow-hidden rounded-[2rem] border border-slate-900/80 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 px-8 py-12 text-white shadow-xl lg:px-12">
        <div className="max-w-4xl">
          <div className="text-sm font-medium uppercase tracking-[0.22em] text-blue-200">Daily AI News</div>
          <h1 className="font-display mt-4 text-5xl leading-tight text-white sm:text-6xl">
            Scraped and refreshed AI news in one place.
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
            This page pulls recent AI news from selected feeds and safe source pages, then keeps the latest updates ready in a cleaner daily stream.
          </p>
          <div className="mt-8">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {refreshing ? 'Refreshing...' : 'Refresh daily news'}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">News Feed</div>
          <h2 className="font-display mt-2 text-3xl text-slate-900">Latest AI updates from automated sources.</h2>
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="section-shell h-56 animate-pulse bg-white/70" />
            ))}
          </div>
        ) : !items.length ? (
          <div className="section-shell p-5 text-sm text-slate-600">
            No AI news is showing right now. Run the refresh button or start the news scheduler to fill this page.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.map((item) => (
              <NewsCard key={`${item.kind}-${item.slug}`} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
