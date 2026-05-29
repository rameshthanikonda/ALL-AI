import React from 'react'

export default function SearchResultsBanner({ presentation, loading, query }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <p className="text-sm font-medium text-slate-700">Searching…</p>
        {query ? (
          <p className="mt-1 text-sm text-slate-500">Looking for AI tools matching “{query}”</p>
        ) : null}
      </div>
    )
  }

  if (!presentation) return null

  const isDiscovery = presentation.mode === 'discovery'

  return (
    <div
      className={`rounded-2xl border px-5 py-4 ${
        isDiscovery
          ? 'border-indigo-200 bg-indigo-50/80'
          : 'border-slate-200 bg-white'
      }`}
    >
      <p className={`text-base font-semibold ${isDiscovery ? 'text-indigo-950' : 'text-slate-900'}`}>
        {presentation.headline}
      </p>
      {presentation.detail ? (
        <p className={`mt-1 text-sm ${isDiscovery ? 'text-indigo-800' : 'text-slate-600'}`}>
          {presentation.detail}
        </p>
      ) : null}
    </div>
  )
}
