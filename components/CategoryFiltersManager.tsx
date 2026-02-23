'use client'

import { useState } from 'react'
import { assignFilterToCategory, unassignFilterFromCategory } from '@/app/admin/categories/[id]/filters/actions'

type FilterRow = { id: string; name: string; type: string }

export function CategoryFiltersManager({
  categoryId,
  categoryName: _categoryName,
  filters,
  assignedFilterIds,
}: {
  categoryId: string
  categoryName: string
  filters: FilterRow[]
  assignedFilterIds: string[]
}) {
  const [assigned, setAssigned] = useState<Set<string>>(new Set(assignedFilterIds))
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggle(filterId: string) {
    setError(null)
    setLoading(filterId)
    const isAssigned = assigned.has(filterId)
    const result = isAssigned
      ? await unassignFilterFromCategory(categoryId, filterId)
      : await assignFilterToCategory(categoryId, filterId)
    setLoading(null)
    if (result.error) {
      setError(result.error)
      return
    }
    setAssigned((prev) => {
      const next = new Set(prev)
      if (isAssigned) next.delete(filterId)
      else next.add(filterId)
      return next
    })
  }

  if (filters.length === 0) {
    return (
      <p className="mt-6 text-slate-500 dark:text-slate-400">
        Brak filtrów. Utwórz filtry w <a href="/admin/filters" className="text-indigo-600 dark:text-indigo-400 hover:underline">Filtry</a>, a następnie przypisz je tutaj.
      </p>
    )
  }

  return (
    <div className="mt-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
      {error && <p className="rounded-t-xl bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm text-red-700 dark:text-red-400">{error}</p>}
      <ul className="divide-y divide-slate-200 dark:divide-slate-700">
        {filters.map((filter) => (
          <li key={filter.id} className="flex items-center justify-between px-4 py-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={assigned.has(filter.id)}
                onChange={() => toggle(filter.id)}
                disabled={loading !== null}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-slate-900 dark:text-white">{filter.name}</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">({filter.type})</span>
            </label>
            {loading === filter.id && <span className="text-sm text-slate-400">Zapisywanie…</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
