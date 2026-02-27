'use client'

import { useState } from 'react'
import { Phone, Mail } from 'lucide-react'
import { revealListingContact } from './actions'

type Props = {
  listingId: string
  hasPhone: boolean
  hasEmail: boolean
}

export function ContactReveal({ listingId, hasPhone, hasEmail }: Props) {
  const [phone, setPhone] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReveal() {
    setError(null)
    setLoading(true)
    try {
      const result = await revealListingContact(listingId)
      if (result.error) {
        setError(result.error)
      } else {
        if (result.phone) setPhone(result.phone)
        if (result.email) setEmail(result.email)
      }
    } catch {
      setError('Wystąpił błąd. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  const hasContact = hasPhone || hasEmail
  if (!hasContact) {
    return (
      <p className="mt-3 text-slate-500 dark:text-slate-400">
        Brak podanych danych kontaktowych.
      </p>
    )
  }

  if (phone || email) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        {phone && (
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="flex items-center gap-2 text-lg font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Phone className="h-5 w-5 shrink-0" />
            {phone}
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 text-lg font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Mail className="h-5 w-5 shrink-0" />
            {email}
          </a>
        )}
      </div>
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
        {loading ? 'Ładowanie…' : 'Pokaż dane kontaktowe'}
      </button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
