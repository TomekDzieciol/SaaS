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
    .select('id, name, parent_id, is_free')
    .order('name')
  const flat = (categories ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    parent_id: c.parent_id,
    is_free: c.is_free ?? false,
  }))

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Nowe ogłoszenie
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Wypełnij dane. Po zapisie przejdziesz do wyboru pakietu promowania.
      </p>
      <NewListingForm userId={user.id} categories={flat} />
    </div>
  )
}
