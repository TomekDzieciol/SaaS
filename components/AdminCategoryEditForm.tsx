'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateCategory, softDeleteCategory } from '@/app/admin/categories/actions'
import { Loader2, Trash2 } from 'lucide-react'

type PeriodRow = { id: string; label: string; days_count: number }
type ParentOption = { id: string; name: string; parent_id: string | null }

const INPUT_CLASS =
  'mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'

const PRICE_OPTIONS = [
  { value: 0, label: '0 zł (bezpłatna)' },
  { value: 500, label: '5 zł' },
  { value: 1000, label: '10 zł' },
  { value: 1500, label: '15 zł' },
]

export function AdminCategoryEditForm({
  categoryId,
  initialName,
  initialIconName,
  initialParentId,
  initialPublicationPriceCents,
  initialDefaultPeriodId,
  initialPeriodPricesByPeriodId,
  publicationPeriods,
  parentOptions,
}: {
  categoryId: string
  initialName: string
  initialIconName: string
  initialParentId: string
  initialPublicationPriceCents: number
  initialDefaultPeriodId: string
  initialPeriodPricesByPeriodId: Record<string, number>
  publicationPeriods: PeriodRow[]
  parentOptions: ParentOption[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    const result = await updateCategory(categoryId, formData, publicationPeriods.map((p) => p.id))
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }
    setSuccess(true)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Czy na pewno chcesz usunąć tę kategorię? Ogłoszenia w tej kategorii pozostaną aktywne do wygaśnięcia.')) {
      return
    }
    setError(null)
    setDeleteLoading(true)
    const result = await softDeleteCategory(categoryId)
    setDeleteLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.push('/admin/categories')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6 shadow-sm">
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
          defaultValue={initialName}
          className={INPUT_CLASS}
        />
      </div>
      <div>
        <label htmlFor="parent_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Kategoria nadrzędna
        </label>
        <select id="parent_id" name="parent_id" className={INPUT_CLASS} defaultValue={initialParentId}>
          <option value="">— Kategoria główna —</option>
          {parentOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.name}
            </option>
          ))}
        </select>
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
          defaultValue={initialIconName}
          className={INPUT_CLASS}
        />
      </div>
      <div>
        <label htmlFor="publication_price_cents" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Koszt publikacji w kategorii
        </label>
        <select
          id="publication_price_cents"
          name="publication_price_cents"
          className={INPUT_CLASS}
          defaultValue={initialPublicationPriceCents}
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
              {publicationPeriods.map((p) => {
                const priceCents = initialPeriodPricesByPeriodId[p.id] ?? 0
                const priceZl = priceCents / 100
                const isDefault = initialDefaultPeriodId === p.id
                return (
                  <tr key={p.id} className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        name={`period_${p.id}_enabled`}
                        value="on"
                        defaultChecked={p.id in initialPeriodPricesByPeriodId}
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
                        defaultValue={priceZl}
                        className="w-24 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-slate-900 dark:text-white"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="radio"
                        name="default_period_id"
                        value={p.id}
                        defaultChecked={isDefault}
                        className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                  </tr>
                )
              })}
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
          Zapisano.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Zapisz'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteLoading}
          className="rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 inline-flex items-center gap-2"
        >
          {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Usuń kategorię
        </button>
      </div>
    </form>
  )
}
