'use client'

import { useState } from 'react'
import { Phone } from 'lucide-react'
import { revealListingPhone } from './actions'

type Props = {
  listingId: string
  hasPhone: boolean
}

export function ContactReveal({ listingId, hasPhone }: Props) {
  const [phone, setPhone] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReveal() {
    setError(null)
    setLoading(true)
    try {
      const result = await revealListingPhone(listingId)
      if (result.phone) {
        setPhone(result.phone)
      } else {
        setError(result.error ?? 'Nie udało się pobrać numeru.')
      }
    } catch {
      setError('Wystąpił błąd. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  if (!hasPhone) {
    return (
      <p className="mt-3 text-slate-500 dark:text-slate-400">
        Brak podanego telefonu.
      </p>
    )
  }

  if (phone) {
    return (
      <a
        href={`tel:${phone.replace(/\s/g, '')}`}
        className="mt-3 flex items-center gap-3 text-lg font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        <Phone className="h-5 w-5" />
        {phone}
      </a>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      <button
        type="button"
        onClick={handleReveal}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-600"
      >
        <Phone className="h-5 w-5" />
        {loading ? 'Ładowanie…' : 'Pokaż numer telefonu'}
      </button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
