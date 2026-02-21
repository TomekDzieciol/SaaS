import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Oczekuje na płatność',
  active: 'Aktywne',
  expired: 'Wygasłe',
  rejected: 'Odrzucone',
}

const STATUS_STYLES: Record<string, string> = {
  pending_payment: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  expired: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

export type ListingRow = {
  id: string
  title: string
  status: string
  created_at: string
  price: number | null
}

export function MyListingsTable({ listings }: { listings: ListingRow[] }) {
  if (listings.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30 py-8 text-center text-slate-500 dark:text-slate-400">
        Nie masz jeszcze ogłoszeń. Kliknij „Dodaj ogłoszenie”, aby utworzyć pierwsze.
      </p>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
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
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Akcje
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800/30">
          {listings.map((row) => (
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
              <td className="px-4 py-3 text-right">
                {row.status === 'active' ? (
                  <Link
                    href={`/listings/${row.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Zobacz
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">–</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
