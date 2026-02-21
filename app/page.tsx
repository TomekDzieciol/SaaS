import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowRight, Shield, Zap, Layers } from 'lucide-react'
import { ListingCard } from '@/components/ListingCard'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, price, location, category, images')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(12)

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
      <section className="relative mx-auto max-w-6xl px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            Zbuduj więcej z{' '}
            <span className="text-indigo-600 dark:text-indigo-400">
              profesjonalnym SaaS
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
            Bezpieczna aplikacja z pełnym uwierzytelnianiem, dashboardem i
            tablicą ogłoszeń. Rozpocznij w minutę.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-6 py-3 text-base font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Create account
            </Link>
          </div>
        </div>

        <section className="relative mx-auto mt-24 max-w-6xl">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Ostatnie ogłoszenia
          </h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Aktywne oferty w portalu
          </p>
          {listings && listings.length > 0 ? (
            <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <li key={listing.id}>
                  <ListingCard listing={listing} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30 py-12 text-center text-slate-500 dark:text-slate-400">
              Brak aktywnych ogłoszeń. Zaloguj się i dodaj pierwsze.
            </p>
          )}
        </section>

        <div className="mx-auto mt-24 grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white p-6 shadow-sm dark:bg-slate-800/50">
            <Shield className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
              Bezpieczne logowanie
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Email, hasło i logowanie przez Google z Supabase Auth.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white p-6 shadow-sm dark:bg-slate-800/50">
            <Zap className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
              Chroniony dashboard
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Dostęp tylko dla zalogowanych użytkowników.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white p-6 shadow-sm dark:bg-slate-800/50">
            <Layers className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">
              Tablica ogłoszeń
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Publikuj oferty i zarządzaj nimi w jednym miejscu.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
