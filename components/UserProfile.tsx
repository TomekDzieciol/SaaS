import Link from 'next/link'
import { User, Settings } from 'lucide-react'

/**
 * Sekcja User Profile – link do ustawień konta.
 */
export function UserProfile() {
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white p-6 shadow-sm dark:bg-slate-800/50">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
        <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        Profil
      </h2>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
        Zarządzaj danymi kontaktowymi, hasłem i lokalizacją.
      </p>
      <Link
        href="/dashboard/settings"
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
      >
        <Settings className="h-4 w-4" />
        Ustawienia konta
      </Link>
    </section>
  )
}
