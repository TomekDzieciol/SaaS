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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
        Nowe ogłoszenie
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400">
        Wypełnij dane. Po zapisie przejdziesz do wyboru pakietu promowania.
      </p>
      <NewListingForm userId={user.id} />
    </div>
  )
}
