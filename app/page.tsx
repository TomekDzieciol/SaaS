import Link from 'next/link'
import { ArrowRight, Shield, Zap, Layers } from 'lucide-react'

export default function HomePage() {
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
            profilem użytkownika. Rozpocznij w minutę.
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
              Rozszerzalny profil
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Sekcja User Profile gotowa na Twoje dane.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
