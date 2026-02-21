import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserProfile } from '@/components/UserProfile'
import { MyListingsTable } from '@/components/MyListingsTable'
import { PlusSquare } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: myListings } = await supabase
    .from('listings')
    .select('id, title, status, created_at, price')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Witaj w chronionej strefie aplikacji.
        </p>
        <Link
          href="/listings/new"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <PlusSquare className="h-4 w-4" />
          Dodaj ogłoszenie
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Moje ogłoszenia
        </h2>
        <MyListingsTable listings={myListings ?? []} />
      </section>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white p-6 shadow-sm dark:bg-slate-800/50">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Twoje konto
        </h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-14 w-14 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-slate-200 dark:ring-slate-700">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-indigo-600 dark:text-indigo-400">
                <span className="text-xl font-semibold">
                  {user.email?.slice(0, 1).toUpperCase() ?? '?'}
                </span>
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-slate-900 dark:text-white">
              {user.user_metadata?.full_name ?? user.email}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {user.email}
            </p>
          </div>
        </div>
      </div>
      <UserProfile />
    </div>
  )
}
