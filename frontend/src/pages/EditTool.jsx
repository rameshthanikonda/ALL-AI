import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchTool, updateTool } from '../services/api'

export default function EditTool() {
  const { slug } = useParams()
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    fetchTool(slug)
      .then((data) => {
        if (!mounted) return
        setForm({ ...data.tool, tags: (data.tool.tags || []).join(', ') })
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [slug])

  if (loading) return <div>Loading...</div>
  if (!form) return <div>Tool not found</div>

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      const updates = { ...form, tags: form.tags ? form.tags.split(',').map((value) => value.trim()) : [] }
      await updateTool(slug, updates)
      navigate(`/tools/${slug}`)
    } catch (err) {
      setMsg(err.body?.error || err.message || 'update_failed')
    }
  }

  return (
    <div className="space-y-6">
      <section className="section-shell p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">Edit Tool</div>
            <h1 className="font-display mt-2 text-4xl text-slate-900">Refine the details and keep the directory sharp.</h1>
          </div>
          <Link
            to={`/tools/${slug}`}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            Back to tool
          </Link>
        </div>
      </section>

      <section className="section-shell p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Name</span>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={form.name || ''}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Category</span>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={form.category || ''}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Description</span>
            <textarea
              rows="5"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              value={form.description || ''}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Website URL</span>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={form.url || ''}
                onChange={(event) => setForm({ ...form, url: event.target.value })}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Tags</span>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={form.tags || ''}
                onChange={(event) => setForm({ ...form, tags: event.target.value })}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
              type="submit"
            >
              Save changes
            </button>
            <Link
              to={`/tools/${slug}`}
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              Cancel
            </Link>
          </div>
        </form>

        {msg && <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{msg}</p>}
      </section>
    </div>
  )
}
