import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../lib/authContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export default function RequireAuth() {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()

  if (!isSupabaseConfigured) {
    // Без Supabase аутентификации нет вообще — не блокируем локальную
    // разработку, но явно предупреждаем на самой странице логина.
    return <Outlet />
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl px-6 py-10 text-sm text-ink/40">Проверяем вход...</div>
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <ShieldAlert size={32} className="mx-auto text-ink/30" />
        <h1 className="mt-4 text-xl font-extrabold">Доступ только для администраторов</h1>
        <p className="mt-2 text-sm text-ink/55">
          У твоего аккаунта пока нет роли admin. Как её выдать — см. README, раздел «Защита админки» (роль
          выдаётся через SQL в app_metadata, после этого нужно выйти и войти заново).
        </p>
        <Link to="/" className="mt-6 inline-block text-sm font-semibold text-pine-700 hover:text-pine-800">
          ← На главную
        </Link>
      </main>
    )
  }

  return <Outlet />
}
