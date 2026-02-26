'use client'

import { useState, useMemo } from 'react'
import { addCategory } from '@/app/admin/categories/actions'
import { Loader2 } from 'lucide-react'

type CategoryRow = {
  id: string
  name: string
  icon_name?: string | null
  parent_id: string | null
  is_free?: boolean
  deleted_at?: string | null
}

type PeriodRow = { id: string; label: string; days_count: number }

const INPUT_CLASS =
  'mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

const PRICE_OPTIONS = [
  { value: 0, label: '0 zł (bezpłatna)' },
  { value: 500, label: '5 zł' },
  { value: 1000, label: '10 zł' },
  { value: 1500, label: '15 zł' },
]

export function AdminCategoriesForm({
  categories,
  publicationPeriods,
}: {
  categories: CategoryRow[]
  publicationPeriods: PeriodRow[]
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const parentOptions = useMemo(() => {
    const out: { id: string; name: string; depth: number }[] = []
    const notDeleted = categories.filter((c) => !c.deleted_at)
    function add(parentId: string | null, depth: number) {
      notDeleted
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

    const result = await addCategory(formData, publicationPeriods.map((p) => p.id))
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
        <select id="parent_id" name="parent_id" className={INPUT_CLASS}>
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
          className={INPUT_CLASS}
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
          className={INPUT_CLASS}
        />
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Nazwa ikony z Lucide (np. Camera, Tag, MapPin).
        </p>
      </div>
      <div>
        <label htmlFor="publication_price_cents" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Koszt publikacji w kategorii
        </label>
        <select
          id="publication_price_cents"
          name="publication_price_cents"
          className={INPUT_CLASS}
          defaultValue={0}
        >
          {PRICE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <p className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Okresy publikacji
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Zaznacz dostępne okresy, podaj cenę (zł) i wskaż okres domyślny.
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Dostępny</th>
                <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Okres</th>
                <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Cena (zł)</th>
                <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Domyślny</th>
              </tr>
            </thead>
            <tbody>
              {publicationPeriods.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      name={`period_${p.id}_enabled`}
                      value="on"
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{p.label}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      name={`period_${p.id}_price`}
                      min={0}
                      step={0.01}
                      defaultValue={0}
                      className="w-24 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-slate-900 dark:text-white"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="radio"
                      name="default_period_id"
                      value={p.id}
                      className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
