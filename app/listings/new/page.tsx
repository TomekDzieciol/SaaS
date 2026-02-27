import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewListingForm, type CloneInitialData } from '@/components/NewListingForm'

type CategoryFlat = { id: string; name: string; parent_id: string | null; is_free: boolean; default_period_id: string | null }

function getCategoryPath(flat: CategoryFlat[], categoryId: string | null): string[] {
  if (!categoryId) return []
  const byId = new Map(flat.map((c) => [c.id, c]))
  const path: string[] = []
  let id: string | null = categoryId
  while (id) {
    const c = byId.get(id)
    if (!c) break
    path.unshift(c.id)
    id = c.parent_id
  }
  return path
}

export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ clone?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/listings/new')
  }

  const { clone: cloneId } = await searchParams
  let initialData: CloneInitialData | null = null

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

  if (cloneId?.trim()) {
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, description, price, location, contact_phone, category_id, region_id, district_id, user_id')
      .eq('id', cloneId.trim())
      .eq('user_id', user.id)
      .single()

    if (!listingError && listing) {
      const { data: filterRows } = await supabase
        .from('listing_filter_values')
        .select('filter_id, value, option_id')
        .eq('listing_id', listing.id)

      const filterValues: Record<string, string> = {}
      for (const row of filterRows ?? []) {
        const val = row.option_id ?? row.value ?? ''
        if (val) filterValues[row.filter_id] = String(val)
      }

      const priceNum = listing.price != null ? Number(listing.price) : null
      const priceDisplay =
        priceNum != null
          ? priceNum.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\s/g, ' ')
          : ''

      initialData = {
        title: listing.title ?? '',
        description: listing.description ?? '',
        priceDisplay,
        location: listing.location ?? '',
        contact_phone: listing.contact_phone ?? '',
        categoryPath: getCategoryPath(flat, listing.category_id),
        region_id: listing.region_id ?? '',
        district_id: listing.district_id ?? '',
        filterValues,
        startAtStep2: true,
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        {initialData ? 'Odśwież ogłoszenie' : 'Nowe ogłoszenie'}
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        {initialData
          ? 'Dane skopiowane z poprzedniego ogłoszenia. Wybierz okres publikacji i zapisz.'
          : 'Wypełnij dane w dwóch krokach. Na końcu wybierzesz okres publikacji.'}
      </p>
      <NewListingForm
        userId={user.id}
        categories={flat}
        categoryPeriods={categoryPeriods}
        initialData={initialData}
      />
    </div>
  )
}
