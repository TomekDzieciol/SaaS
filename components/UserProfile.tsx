import { User } from 'lucide-react'

/**
 * Sekcja User Profile – miejsce na przyszłe dane użytkownika
 * (np. edycja nazwy, avatar, preferencje, ustawienia).
 */
export function UserProfile() {
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white p-6 shadow-sm dark:bg-slate-800/50">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
        <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        User Profile
      </h2>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
        Tutaj w przyszłości dodamy edycję profilu, ustawienia i dodatkowe dane
        użytkownika.
      </p>
      <div className="mt-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30 p-6 text-center text-slate-500 dark:text-slate-400">
        Placeholder pod przyszłe funkcje profilu
      </div>
    </section>
  )
}
