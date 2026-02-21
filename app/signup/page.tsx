import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white p-8 shadow-sm dark:bg-slate-800/50">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Utwórz konto
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Zarejestruj się przez email lub Google.
        </p>
        <AuthForm mode="signup" redirectTo="/dashboard" />
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Masz już konto?{' '}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  )
}
