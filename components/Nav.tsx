'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogIn, LogOut, LayoutDashboard, User, PlusSquare, FolderTree, Filter } from 'lucide-react'
import { signOutAction } from '@/app/auth/actions'
import type { User as SupabaseUser } from '@supabase/supabase-js'

function isAdminEmail(email: string | undefined): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase()
  if (!adminEmail) return false
  return (email ?? '').trim().toLowerCase() === adminEmail
}

export function Nav({ user }: { user: SupabaseUser | null }) {
  const router = useRouter()
  const isAdmin = user ? isAdminEmail(user.email ?? undefined) : false

  async function handleSignOut() {
    await signOutAction()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-semibold text-slate-900 dark:text-white"
        >
          SaaS App
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              {isAdmin && (
                <>
                  <Link
                    href="/admin/categories"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <FolderTree className="h-4 w-4" />
                    Kategorie
                  </Link>
                  <Link
                    href="/admin/filters"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Filter className="h-4 w-4" />
                    Filtry
                  </Link>
                </>
              )}
              <Link
                href="/listings/new"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <PlusSquare className="h-4 w-4" />
                Dodaj ogłoszenie
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
              <Link
                href="/dashboard"
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-slate-200 dark:ring-slate-700"
                title={user.email ?? 'Profile'}
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                )}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login?redirectTo=/listings/new"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <PlusSquare className="h-4 w-4" />
                Dodaj ogłoszenie
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <LogIn className="h-4 w-4" />
                Zaloguj się
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Zarejestruj
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
