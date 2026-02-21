'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogIn, LogOut, LayoutDashboard, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export function Nav({ user }: { user: SupabaseUser | null }) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
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
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <LogIn className="h-4 w-4" />
              Get Started
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
