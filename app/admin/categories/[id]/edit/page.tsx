import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminCategoryEditForm } from '@/components/AdminCategoryEditForm'

function isAdminEmail(email: string | undefined): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail) return false
  return (email ?? '').trim().toLowerCase() === adminEmail
}

export default async function CategoryEditPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/admin/categories')
  if (!isAdminEmail(user.email ?? undefined)) redirect('/')

  const { data: category } = await supabase
    .from('categories')
    .select('id, name, icon_name, parent_id, publication_price_cents, default_period_id, deleted_at')
    .eq('id', params.id)
    .single()
  if (!category) notFound()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, parent_id, deleted_at')
    .order('name')

  const { data: periods } = await supabase
    .from('publication_periods')
    .select('id, label, days_count')
    .order('days_count')

  const { data: categoryPeriods } = await supabase
    .from('category_publication_periods')
    .select('publication_period_id, price_cents')
    .eq('category_id', params.id)

  const periodPrices: Record<string, number> = {}
  for (const p of categoryPeriods ?? []) {
    periodPrices[p.publication_period_id] = p.price_cents
  }

  const parentOptions = (categories ?? [])
    .filter((c) => c.id !== category.id && !c.deleted_at)
    .map((c) => ({ id: c.id, name: c.name, parent_id: c.parent_id } as const))

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin/categories"
          className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600"
        >
          ← Kategorie
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Edycja kategorii: {category.name}
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Zmień nazwę, nadrzędną, ikonę, koszt publikacji i okresy.
      </p>

      <AdminCategoryEditForm
        categoryId={category.id}
        initialName={category.name}
        initialIconName={category.icon_name ?? ''}
        initialParentId={category.parent_id ?? ''}
        initialPublicationPriceCents={category.publication_price_cents ?? 0}
        initialDefaultPeriodId={category.default_period_id ?? ''}
        initialPeriodPricesByPeriodId={periodPrices}
        publicationPeriods={periods ?? []}
        parentOptions={parentOptions}
      />
    </div>
  )
}
