'use client'

import { useState, useMemo } from 'react'
import { addCategory } from '@/app/admin/categories/actions'
import { Loader2 } from 'lucide-react'

type CategoryRow = { id: string; name: string; icon_name?: string | null; parent_id: string | null; is_free?: boolean }

export function AdminCategoriesForm({ categories }: { categories: CategoryRow[] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const parentOptions = useMemo(() => {
    const out: { id: string; name: string; depth: number }[] = []
    function add(parentId: string | null, depth: number) {
      categories
        .filter((c) => c.parent_id === parentId)
        .forEach((c) => {
          out.push({ id: c.id, name: c.name, depth })
          add(c.id, depth + 1)
        })
    }
    add(null, 0)
    return out
  }, [categories])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const result = await addCategory(formData)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess(true)
    form.reset()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
        Nowa kategoria
      </h2>
      <div>
        <label htmlFor="parent_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Kategoria nadrzędna
        </label>
        <select
          id="parent_id"
          name="parent_id"
          className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">— Kategoria główna —</option>
          {parentOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {'\u00A0'.repeat(opt.depth * 2)}{opt.depth > 0 ? '└ ' : ''}{opt.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Nazwa *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={100}
          className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label htmlFor="icon_name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Nazwa ikony
        </label>
        <input
          id="icon_name"
          name="icon_name"
          type="text"
          maxLength={80}
          placeholder="np. Camera, Home"
          className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Nazwa ikony z Lucide (np. Camera, Tag, MapPin).
        </p>
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          Kategoria dodana.
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Dodaj kategorię'}
      </button>
    </form>
  )
}
