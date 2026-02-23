'use client'

import { useState } from 'react'
import { createFilter } from '@/app/admin/filters/actions'
import { Loader2 } from 'lucide-react'

export function AdminFiltersForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    const form = e.currentTarget
    const result = await createFilter(new FormData(form))
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
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Nowy filtr</h2>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nazwa *</label>
        <input id="name" name="name" type="text" required maxLength={100} placeholder="np. Rodzaj napędu" className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Typ *</label>
        <select id="type" name="type" required className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          <option value="select">select (lista opcji)</option>
          <option value="number">number</option>
          <option value="text">text</option>
        </select>
      </div>
      {error && <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">{error}</p>}
      {success && <p className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">Filtr dodany.</p>}
      <button type="submit" disabled={loading} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Dodaj filtr'}
      </button>
    </form>
  )
}
