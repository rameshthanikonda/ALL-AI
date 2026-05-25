import React, { useEffect, useRef, useState } from 'react'

export default function SearchBar({
  initialQuery = '',
  initialCategory = '',
  initialTags = '',
  categories = [],
  popularTags = [],
  onSearch,
}) {
  const [q, setQ] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)
  const [tags, setTags] = useState(initialTags)
  const hasMountedRef = useRef(false)

  useEffect(() => setQ(initialQuery), [initialQuery])
  useEffect(() => setCategory(initialCategory), [initialCategory])
  useEffect(() => setTags(initialTags), [initialTags])

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    const timeoutId = setTimeout(() => {
      onSearch &&
        onSearch({
          q: q.trim(),
          category: category.trim(),
          tags: tags.trim(),
        })
    }, 180)

    return () => clearTimeout(timeoutId)
  }, [q, category, tags, onSearch])

  function submit(event) {
    event.preventDefault()
    onSearch &&
      onSearch({
        q: q.trim(),
        category: category.trim(),
        tags: tags.trim(),
      })
  }

  function applyTag(tag) {
    const current = tags
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)

    if (current.includes(tag)) return
    setTags([...current, tag].join(', '))
  }

  function clearAll() {
    setQ('')
    setCategory('')
    setTags('')
    onSearch && onSearch({ q: '', category: '', tags: '' })
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="flex-1">
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search by tool name, feature, or description"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-[28rem]">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              placeholder="Tags: writing, coding"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {popularTags.slice(0, 8).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => applyTag(tag)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearAll}
              className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </button>
            <button
              className="rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              type="submit"
            >
              Search
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
