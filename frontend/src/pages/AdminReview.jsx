import React, { useEffect, useState } from 'react'
// Admin review page (fetches /api/admin/staged)

export default function AdminReview() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch('/api/admin/staged', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        setItems(data.items || [])
      })
      .catch((err) => {
        console.error('Load staged failed', err)
        if (mounted) setError(err)
      })
      .finally(() => mounted && setLoading(false))
    return () => (mounted = false)
  }, [])

  async function approve(slug) {
    await fetch(`/api/admin/staged/${slug}/approve`, { method: 'POST', credentials: 'include' })
    setItems((s) => s.filter((i) => i.slug !== slug))
  }

  async function reject(slug) {
    await fetch(`/api/admin/staged/${slug}/reject`, { method: 'POST', credentials: 'include' })
    setItems((s) => s.filter((i) => i.slug !== slug))
  }

  if (loading) return <div>Loading staged imports…</div>
  if (error) return <div className="text-red-600">Failed to load staged items</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Staged Imports</h1>
      {items.length === 0 && <div>No pending imports</div>}
      <div className="grid gap-4">
        {items.map((it) => (
          <div key={it.slug} className="rounded-xl border bg-white p-4">
            <div className="flex justify-between">
              <div>
                <div className="text-lg font-semibold">{it.name}</div>
                <div className="text-sm text-slate-500">{it.description}</div>
                <div className="mt-2 text-sm text-slate-400">Source: {it.source || 'auto'}</div>
              </div>
              <div className="flex flex-col gap-2">
                <a className="rounded-md border px-3 py-1 text-sm" href={it.url} target="_blank" rel="noreferrer">Visit</a>
                <button onClick={() => approve(it.slug)} className="rounded-md bg-green-600 px-3 py-1 text-sm text-white">Approve</button>
                <button onClick={() => reject(it.slug)} className="rounded-md bg-red-600 px-3 py-1 text-sm text-white">Reject</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
