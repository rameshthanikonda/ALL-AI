import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchTool } from '../services/api'
import { useUser } from '../contexts/UserContext'

export default function ToolDetail() {
  const { slug } = useParams()
  const { user } = useUser() || {}
  const [tool, setTool] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    fetchTool(slug)
      .then((data) => {
        if (!mounted) return
        setTool(data.tool)
        setLoading(false)
      })
      .catch((err) => {
        if (!mounted) return
        setError(err)
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [slug])

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-600">Error loading tool</div>
  if (!tool) return <div className="text-slate-600">Tool not found</div>

  return (
    <div className="space-y-5">
      <div>
        <Link
          to={`/tools?q=${encodeURIComponent(tool.name)}`}
          className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          Search similar tools
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{tool.name}</h1>
          {tool.enterprise && <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-xs font-semibold">Enterprise</span>}
        </div>
        <p className="mt-2 text-slate-700">{tool.description}</p>
        {tool.recentUpdates && tool.recentUpdates.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tool.recentUpdates.map((u) => (
              <span key={u} className="text-xs rounded-full border px-2 py-0.5 text-slate-600 bg-slate-50">{u}</span>
            ))}
          </div>
        )}
      </div>

      {tool.url && (
        <a
          className="inline-block rounded bg-blue-600 px-4 py-2 text-white"
          href={tool.url}
          target="_blank"
          rel="noreferrer"
        >
          Visit Site
        </a>
      )}

      {user && (
        <Link to={`/tools/${tool.slug}/edit`} className="inline-block rounded border px-4 py-2">
          Edit
        </Link>
      )}
    </div>
  )
}
