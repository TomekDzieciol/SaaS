'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { activateListing } from '@/app/listings/actions'
import { Loader2, Zap, Star, Crown } from 'lucide-react'

const PACKAGES = [
  { id: 'start', name: 'Pakiet Start', price: 5, icon: Zap },
  { id: 'standard', name: 'Pakiet Standard', price: 10, icon: Star },
  { id: 'premium', name: 'Pakiet Premium', price: 15, icon: Crown },
] as const

export function PayButtons({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(packId: string) {
    setError(null)
    setLoading(packId)

    const result = await activateListing(listingId, 'active')

    setLoading(null)

    if (result.error) {
      setError(result.error)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="mt-8 space-y-4">
      {PACKAGES.map((pack) => {
        const Icon = pack.icon
        return (
          <button
            key={pack.id}
            type="button"
            onClick={() => handleSelect(pack.id)}
            disabled={!!loading}
            className="flex w-full items-center justify-between rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-6 py-5 text-left shadow-sm transition hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <span className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </span>
              <span className="text-lg font-semibold text-slate-900 dark:text-white">
                {pack.name} – {pack.price} zł
              </span>
            </span>
            {loading === pack.id ? (
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            ) : (
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                Wybierz
              </span>
            )}
          </button>
        )
      })}
      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
