import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminFiltersForm } from '@/components/AdminFiltersForm'
import { AdminFilterOptionForm } from '@/components/AdminFilterOptionForm'

function isAdminEmail(email: string | undefined): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail) return false
  return (email ?? '').trim().toLowerCase() === adminEmail
}

export default async function AdminFiltersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/admin/filters')
  if (!isAdminEmail(user.email ?? undefined)) redirect('/')

  const { data: filters } = await supabase
    .from('filters')
    .select('id, name, type')
    .order('name')

  const filterIds = (filters ?? []).map((f) => f.id)
  const { data: options } = filterIds.length
    ? await supabase.from('filter_options').select('id, filter_id, value').in('filter_id', filterIds)
    : { data: [] }

  const optionsByFilter = (options ?? []).reduce<Record<string, { id: string; value: string }[]>>((acc, o) => {
    if (!acc[o.filter_id]) acc[o.filter_id] = []
    acc[o.filter_id].push({ id: o.id, value: o.value })
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/categories" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600">
          ← Kategorie
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Filtry (atrybuty)
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Twórz filtry (np. Rodzaj napędu) i dodawaj opcje (np. 4x4, Przód). Przypisanie do kategorii w Kategoriach → Zarządzaj filtrami.
      </p>

      <AdminFiltersForm />

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Lista filtrów i opcji
        </h2>
        {filters && filters.length > 0 ? (
          <ul className="mt-4 space-y-6">
            {filters.map((filter) => (
              <li key={filter.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 dark:text-white">{filter.name}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{filter.type}</span>
                </div>
                {filter.type === 'select' && (
                  <>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Opcje:</p>
                    <ul className="mt-1 flex flex-wrap gap-2">
                      {(optionsByFilter[filter.id] ?? []).map((opt) => (
                        <li key={opt.id} className="rounded bg-slate-100 dark:bg-slate-700 px-2 py-1 text-sm">
                          {opt.value}
                        </li>
                      ))}
                    </ul>
                    <AdminFilterOptionForm filterId={filter.id} filterName={filter.name} />
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-slate-500 dark:text-slate-400">Brak filtrów. Dodaj pierwszy powyżej.</p>
        )}
      </section>
    </div>
  )
}
