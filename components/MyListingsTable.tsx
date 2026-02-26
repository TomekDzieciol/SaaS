'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExternalLink, Trash2, Archive } from 'lucide-react'
import { deleteListing, archiveListing } from '@/app/listings/actions'

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Oczekuje na płatność',
  active: 'Aktywne',
  archived: 'Archiwum',
  expired: 'Wygasłe',
  rejected: 'Odrzucone',
}

const STATUS_STYLES: Record<string, string> = {
  pending_payment: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  archived: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  expired: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

export type ListingRow = {
  id: string
  title: string
  status: string
  created_at: string
  price: number | null
  user_id: string
}

export function MyListingsTable({
  listings,
  currentUserId,
  isAdmin,
}: {
  listings: ListingRow[]
  currentUserId: string
  isAdmin: boolean
}) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleArchive(row: ListingRow) {
    if (row.user_id !== currentUserId || row.status !== 'active') return
    if (!window.confirm('Czy na pewno chcesz zakończyć to ogłoszenie? Trafi do archiwum i nie będzie widoczne w wyszukiwarce.')) return

    setError(null)
    setArchivingId(row.id)
    const result = await archiveListing(row.id)
    setArchivingId(null)
    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  async function handleDelete(row: ListingRow) {
    const canDelete = isAdmin || row.user_id === currentUserId
    if (!canDelete) return
    if (!window.confirm('Czy na pewno chcesz trwale usunąć to ogłoszenie?')) return

    setError(null)
    setDeletingId(row.id)

    const result = await deleteListing(row.id)

    setDeletingId(null)
    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  if (listings.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30 py-8 text-center text-slate-500 dark:text-slate-400">
        Nie masz jeszcze ogłoszeń. Kliknij „Dodaj ogłoszenie”, aby utworzyć pierwsze.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      {error && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Tytuł
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Cena
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Data
            </th>
            {isAdmin && (
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Użytkownik (ID)
              </th>
            )}
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Akcje
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800/30">
          {listings.map((row) => {
            const isDeleting = deletingId === row.id
            return (
              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-900 dark:text-white line-clamp-1 max-w-[200px] sm:max-w-none">
                    {row.title}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {row.price != null
                    ? `${Number(row.price).toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} zł`
                    : '–'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[row.status] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {STATUS_LABELS[row.status] ?? row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                  {new Date(row.created_at).toLocaleDateString('pl-PL')}
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400" title={row.user_id}>
                    {row.user_id.slice(0, 8)}…
                  </td>
                )}
                <td className="px-4 py-3 text-right">
                  <span className="flex items-center justify-end gap-2">
                    {(row.status === 'active' || row.status === 'archived') && (
                      <Link
                        href={`/listings/${row.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Zobacz
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                    {row.status === 'active' && row.user_id === currentUserId && (
                      <button
                        type="button"
                        onClick={() => handleArchive(row)}
                        disabled={!!archivingId}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-50"
                        title="Zakończ ogłoszenie"
                      >
                        {archivingId === row.id ? '…' : <Archive className="h-4 w-4" />}
                        Zakończ
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(row)}
                        disabled={isDeleting}
                        className="inline-flex items-center rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 disabled:opacity-50"
                        title="Usuń ogłoszenie"
                        aria-label="Usuń ogłoszenie"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
