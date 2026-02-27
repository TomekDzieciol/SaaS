'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { renewListing } from '@/app/listings/actions'
import { Loader2 } from 'lucide-react'

export type RenewPeriodOption = {
  id: string
  label: string
  days_count: number
  price_cents: number
}

export function RenewListingForm({
  listingId,
  periods,
  currentPeriodId,
}: {
  listingId: string
  periods: RenewPeriodOption[]
  currentPeriodId?: string | null
}) {
  const router = useRouter()
  const [periodId, setPeriodId] = useState<string>(
    currentPeriodId && periods.some((p) => p.id === currentPeriodId)
      ? currentPeriodId
      : periods[0]?.id ?? ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = periods.find((p) => p.id === periodId) ?? periods[0]
  const priceZl =
    selected && typeof selected.price_cents === 'number'
      ? (selected.price_cents / 100).toFixed(2)
      : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!periodId) {
      setError('Wybierz okres publikacji.')
      return
    }
    setError(null)
    setLoading(true)
    const result = await renewListing(listingId, periodId)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Wybierz nowy okres publikacji
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Ogłoszenie zostanie ponownie aktywne na wybrany czas, a po jego upływie trafi z powrotem do archiwum.
        </p>
        <label
          htmlFor="renew_period"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Okres publikacji
        </label>
        <select
          id="renew_period"
          value={periodId}
          onChange={(e) => setPeriodId(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          required
        >
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} – {(p.price_cents / 100).toFixed(2)} zł
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !periodId}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-lg font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : priceZl != null ? (
          <>Odśwież ogłoszenie za {priceZl} zł</>
        ) : (
          <>Odśwież ogłoszenie</>
        )}
      </button>
    </form>
  )
}
