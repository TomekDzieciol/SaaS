import { createClient } from '@/lib/supabase/server'
import { Shield, Zap, Layers } from 'lucide-react'
import { HeroSearch } from '@/components/HeroSearch'

export default async function HomePage() {
  const supabase = await createClient()
  const [
    { data: listings },
    { data: regions },
    { data: districts },
  ] = await Promise.all([
    supabase
      .from('listings')
      .select('id, title, price, location, category, images, description, tags, region_id, district_id')
      .eq('status', 'active') // tylko aktywne; archiwalne dostępne wyłącznie przez bezpośredni link (SEO)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('regions').select('id, name').order('name'),
    supabase.from('districts').select('id, region_id, name').order('name'),
  ])

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.15),transparent)]" />
      <HeroSearch
        listings={listings ?? []}
        regions={regions ?? []}
        districts={districts ?? []}
      />
      <section className="relative mx-auto max-w-6xl px-4 pb-24">
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
