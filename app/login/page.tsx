import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string; error?: string }
}) {
  const { redirectTo, error } = searchParams
  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white p-8 shadow-sm dark:bg-slate-800/50">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Zaloguj się
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Użyj emaila i hasła lub konta Google.
        </p>
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">
            {error === 'auth_callback_error'
              ? 'Błąd podczas logowania. Spróbuj ponownie.'
              : 'Wystąpił błąd. Sprawdź dane i spróbuj ponownie.'}
          </p>
        )}
        <AuthForm mode="login" redirectTo={redirectTo ?? '/dashboard'} />
        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Nie masz konta?{' '}
          <Link
            href="/signup"
            className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Zarejestruj się
          </Link>
        </p>
      </div>
    </div>
  )
}
