'use client'

import { useState } from 'react'
import { addFilterOption } from '@/app/admin/filters/actions'
import { Loader2 } from 'lucide-react'

export function AdminFilterOptionForm({ filterId, filterName }: { filterId: string; filterName: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('filter_id', filterId)
    const result = await addFilterOption(formData)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    setSuccess(true)
    form.reset()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-wrap items-end gap-2">
      <input type="hidden" name="filter_id" value={filterId} />
      <div>
        <label htmlFor={`opt-${filterId}`} className="sr-only">Nowa opcja dla {filterName}</label>
        <input id={`opt-${filterId}`} name="value" type="text" required maxLength={120} placeholder="np. 4x4" className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-40" />
      </div>
      <button type="submit" disabled={loading} className="rounded-lg bg-slate-200 dark:bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Dodaj opcję'}
      </button>
      {error && <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>}
      {success && <p className="w-full text-sm text-emerald-600 dark:text-emerald-400">Opcja dodana.</p>}
    </form>
  )
}
