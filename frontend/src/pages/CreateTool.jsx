import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createTool } from '../services/api'

export default function CreateTool() {
  const [form, setForm] = useState({ name: '', slug: '', description: '', url: '', category: '', tags: '' })
  const [msg, setMsg] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map((value) => value.trim()) : [] }
      const data = await createTool(payload)
      navigate(`/tools/${data.tool.slug}`)
    } catch (err) {
      setMsg(err.body?.error || err.message || 'create_failed')
    }
  }

  return (
    <div className="space-y-6">
      <section className="section-shell p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">Add Tool</div>
            <h1 className="font-display mt-2 text-4xl text-slate-900">Add something worth discovering.</h1>
          </div>
          <Link
            to="/tools"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            Back to tools
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
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Slug</span>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={form.slug}
                onChange={(event) => setForm({ ...form, slug: event.target.value })}
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Description</span>
            <textarea
              rows="5"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Website URL</span>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={form.url}
                onChange={(event) => setForm({ ...form, url: event.target.value })}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Category</span>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Tags</span>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              value={form.tags}
              onChange={(event) => setForm({ ...form, tags: event.target.value })}
              placeholder="writing, coding, research"
            />
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-700"
              type="submit"
            >
              Publish tool
            </button>
            <Link
              to="/tools"
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
