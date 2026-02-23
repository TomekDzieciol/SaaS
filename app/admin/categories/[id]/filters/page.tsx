import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CategoryFiltersManager } from '@/components/CategoryFiltersManager'

function isAdminEmail(email: string | undefined): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail) return false
  return (email ?? '').trim().toLowerCase() === adminEmail
}

export default async function CategoryFiltersPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=/admin/categories')
  if (!isAdminEmail(user.email ?? undefined)) redirect('/')

  const { data: category } = await supabase.from('categories').select('id, name').eq('id', params.id).single()
  if (!category) notFound()

  const { data: allFilters } = await supabase.from('filters').select('id, name, type').order('name')
  const { data: assigned } = await supabase.from('category_filters').select('filter_id').eq('category_id', params.id)
  const assignedSet = new Set((assigned ?? []).map((a) => a.filter_id))

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/categories" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600">← Kategorie</Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Filtry kategorii: {category.name}</h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">Zaznacz filtry, które mają być dostępne w tej kategorii.</p>

      <CategoryFiltersManager
        categoryId={category.id}
        categoryName={category.name}
        filters={allFilters ?? []}
        assignedFilterIds={Array.from(assignedSet)}
      />
    </div>
  )
}
