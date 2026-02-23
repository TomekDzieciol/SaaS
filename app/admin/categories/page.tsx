import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminCategoriesForm } from '@/components/AdminCategoriesForm'

function isAdminEmail(email: string | undefined): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail) return false
  return (email ?? '').trim().toLowerCase() === adminEmail
}

export default async function AdminCategoriesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/admin/categories')
  }

  if (!isAdminEmail(user.email ?? undefined)) {
    redirect('/')
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon_name, parent_id, created_at')
    .order('name')

  type Cat = { id: string; name: string; icon_name: string | null; parent_id: string | null }
  const flat = (categories ?? []) as Cat[]

  function buildTree(parentId: string | null): Cat[] {
    return flat.filter((c) => c.parent_id === parentId)
  }

  function CategoryTree({ parentId, depth = 0 }: { parentId: string | null; depth?: number }) {
    const children = buildTree(parentId)
    if (children.length === 0) return null
    return (
      <>
        {children.map((cat) => (
          <li
            key={cat.id}
            className="flex items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-700 first:border-t-0"
            style={{ paddingLeft: 16 + depth * 24 }}
          >
            <span className="py-3 font-medium text-slate-700 dark:text-slate-300">
              {cat.name}
            </span>
            <span className="flex shrink-0 items-center gap-3 py-3 pr-4 text-sm">
              <span className="text-slate-500 dark:text-slate-400">{cat.icon_name || '–'}</span>
              <Link
                href={`/admin/categories/${cat.id}/filters`}
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Zarządzaj filtrami
              </Link>
            </span>
          </li>
        ))}
        {children.map((cat) => (
          <CategoryTree key={`tree-${cat.id}`} parentId={cat.id} depth={depth + 1} />
        ))}
      </>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Kategorie
        </h1>
        <Link
          href="/admin/filters"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 hover:border-indigo-500 dark:hover:bg-slate-700 dark:hover:border-indigo-500"
        >
          Zarządzaj filtrami →
        </Link>
      </div>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Zarządzaj kategoriami (hierarchia: nadrzędna → podkategoria). Nazwa i opcjonalnie ikona. Przy każdej kategorii: Zarządzaj filtrami.
      </p>

      <AdminCategoriesForm categories={flat} />

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Lista kategorii (drzewo)
        </h2>
        {flat.length > 0 ? (
          <ul className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
            <CategoryTree parentId={null} />
          </ul>
        ) : (
          <p className="mt-4 text-slate-500 dark:text-slate-400">
            Brak kategorii. Dodaj pierwszą powyżej.
          </p>
        )}
      </section>
    </div>
  )
}
