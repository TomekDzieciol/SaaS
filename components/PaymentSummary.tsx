'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { activateListing } from '@/app/listings/actions'
import { Loader2 } from 'lucide-react'

export function PaymentSummary({
  listingId,
  categoryCostCents,
  periodCostCents,
  totalCents,
}: {
  listingId: string
  categoryCostCents: number
  periodCostCents: number
  totalCents: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setError(null)
    setLoading(true)
    const result = await activateListing(listingId, 'active')
    setLoading(false)
    if (result.error) {
      setError(result.error)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  const categoryZl = (categoryCostCents / 100).toFixed(2)
  const periodZl = (periodCostCents / 100).toFixed(2)
  const totalZl = (totalCents / 100).toFixed(2)

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 p-6">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Koszty publikacji
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600 dark:text-slate-400">Koszt publikacji w kategorii</dt>
            <dd className="font-medium text-slate-900 dark:text-white">{categoryZl} zł</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600 dark:text-slate-400">Koszt wybranego okresu</dt>
            <dd className="font-medium text-slate-900 dark:text-white">{periodZl} zł</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-3 mt-3 text-base">
            <dt className="font-semibold text-slate-700 dark:text-slate-300">Suma</dt>
            <dd className="font-semibold text-slate-900 dark:text-white">{totalZl} zł</dd>
          </div>
        </dl>
      </div>

      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 text-lg font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>Zapłać {totalZl} zł</>
        )}
      </button>

      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
