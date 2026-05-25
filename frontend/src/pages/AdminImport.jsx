import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { importTools } from '../services/api'
import { useUser } from '../contexts/UserContext'

export default function AdminImport() {
  const { user } = useUser() || {}
  const [text, setText] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  if (!user || !user.isAdmin) return <div className="section-shell p-8">Unauthorized</div>

  async function handlePasteImport(e) {
    e.preventDefault()
    setMsg('')
    try {
      const payload = JSON.parse(text)
      setLoading(true)
      await importTools(payload)
      setLoading(false)
      navigate('/tools')
    } catch (err) {
      setLoading(false)
      setMsg(err.message || err.body?.error || 'import_failed')
    }
  }

  async function handleFile(e) {
    setMsg('')
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        setLoading(true)
        const content = reader.result
        if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
          await importTools(content, { contentType: 'text/csv' })
        } else {
          const parsed = JSON.parse(content)
          await importTools(parsed)
        }
        setLoading(false)
        navigate('/tools')
      } catch (err) {
        setLoading(false)
        setMsg(err.message || err.body?.error || 'import_failed')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      <section className="section-shell p-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.18em] text-sky-700">Admin</div>
            <h1 className="font-display mt-2 text-3xl text-slate-900">Bulk import tools</h1>
          </div>
        </div>
      </section>

      <section className="section-shell p-6 sm:p-8">
        <div className="grid gap-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Paste JSON array</span>
            <textarea rows="8" className="w-full rounded-2xl border p-4" value={text} onChange={(e) => setText(e.target.value)} />
          </label>

          <div className="flex gap-3">
            <button onClick={handlePasteImport} disabled={loading} className="rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white">
              {loading ? 'Importing...' : 'Import JSON'}
            </button>
            <label className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium">
              Upload file (JSON or CSV)
              <input onChange={handleFile} type="file" accept=".json,.csv,application/json,text/csv" className="hidden" />
            </label>
          </div>

          {msg && <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{msg}</p>}
        </div>
      </section>
    </div>
  )
}
