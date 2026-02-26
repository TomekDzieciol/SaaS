import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewListingForm } from '@/components/NewListingForm'

export default async function NewListingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/listings/new')
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, parent_id, is_free, default_period_id')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name')
  const flat = (categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    parent_id: c.parent_id,
    is_free: c.is_free ?? false,
    default_period_id: c.default_period_id ?? null,
  }))

  const { data: cppRows } = await supabase
    .from('category_publication_periods')
    .select('category_id, publication_period_id, price_cents')
  const { data: periods } = await supabase
    .from('publication_periods')
    .select('id, label, days_count')
    .order('days_count')

  const periodById = new Map((periods ?? []).map((p) => [p.id, p]))
  const categoryPeriods: Record<
    string,
    { periods: { id: string; label: string; days_count: number; price_cents: number }[]; defaultPeriodId: string | null }
  > = {}
  for (const c of flat) {
    const rows = (cppRows ?? []).filter((r) => r.category_id === c.id)
    categoryPeriods[c.id] = {
      periods: rows
        .map((r) => {
          const p = periodById.get(r.publication_period_id)
          return p ? { ...p, price_cents: r.price_cents } : null
        })
        .filter((p): p is NonNullable<typeof p> => p != null)
        .sort((a, b) => a.days_count - b.days_count),
      defaultPeriodId: c.default_period_id,
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Nowe ogłoszenie
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Wypełnij dane w dwóch krokach. Na końcu wybierzesz okres publikacji.
      </p>
      <NewListingForm
        userId={user.id}
        categories={flat}
        categoryPeriods={categoryPeriods}
      />
    </div>
  )
}
