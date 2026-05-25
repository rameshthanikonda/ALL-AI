import React from 'react'
import { Link } from 'react-router-dom'

export default function ToolCard({ slug, name, description, category, tags = [], url, recentUpdates, enterprise }) {
  const inner = (
    <div className="flex h-full flex-col rounded-3xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg tool-card">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {category && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{category}</span>}
          {enterprise && (
            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold">Enterprise</span>
          )}
        </div>
        {recentUpdates && recentUpdates.length > 0 && (
          <div className="flex gap-2">
            {recentUpdates.slice(0,2).map((u) => (
              <span key={u} className="text-xs rounded-full border px-2 py-0.5 text-slate-600 bg-slate-50">{u}</span>
            ))}
          </div>
        )}
      </div>

      <h3 className="mt-4 text-xl font-semibold text-slate-900">{name}</h3>

      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{description}</p>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="tool-card-outer">
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="block">
          {inner}
        </a>
      ) : (
        <Link to={`/tools/${slug}`} className="block">
          {inner}
        </Link>
      )}
    </div>
  )
}
