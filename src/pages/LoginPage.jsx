import { useState } from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { LogIn, UserPlus, Check, AlertCircle, CheckCircle2 } from 'lucide-react'
import heroIllustration from '../assets/hero-illustration.jpg'
import { useAuth } from '../lib/authContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'

export default function LoginPage() {
  const { signIn, signUp, user } = useAuth()
  const location = useLocation()

  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Куда вернуть после входа: туда, откуда прислал RequireAuth (например,
  // /admin), иначе на главную — обычному ученику в админке делать нечего.
  const from = location.state?.from?.pathname ?? '/'

  // Как только сессия появилась (сразу после успешного входа или если уже
  // вошёл) — уходим. <Navigate>, а не navigate() прямо во время рендера.
  if (user) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setNotice(
          'Аккаунт создан. Если на почту пришло письмо — перейди по ссылке из него, а потом войди.',
        )
        setMode('signin')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode(next) {
    setMode(next)
    setError('')
    setNotice('')
  }

  const benefits = [
    'Прогресс по главам — на любом устройстве',
    'Результаты всех пройденных пробников',
    'PRO-доступ привязывается к аккаунту',
  ]

  return (
    <main className="page">
      <div className="mx-auto grid max-w-5xl grid-cols-1 overflow-hidden rounded-2xl border border-line bg-white lg:grid-cols-2">
        {/* --- Форма --- */}
        <div className="p-6 sm:p-10">
          <h1 className="h-page">{mode === 'signin' ? 'С возвращением' : 'Создай аккаунт'}</h1>
          <p className="mt-2 text-ink/55">
            {mode === 'signin' ? 'Войди, чтобы продолжить подготовку.' : 'Это бесплатно и займёт минуту.'}
          </p>

          {/* переключатель вход / регистрация */}
          <div role="tablist" className="mt-7 grid grid-cols-2 gap-1 rounded-xl bg-paper p-1">
            {[
              ['signin', 'Вход'],
              ['signup', 'Регистрация'],
            ].map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={mode === id}
                onClick={() => switchMode(id)}
                className={`rounded-lg py-2 text-sm font-bold transition-colors ${
                  mode === id ? 'bg-white text-ink shadow-sm' : 'text-ink/50 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {!isSupabaseConfigured && (
            <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Supabase не подключен — вход пока не работает. Настрой <code className="rounded bg-amber-100 px-1">.env</code>{' '}
              по инструкции в README.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="label">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="label">
                Пароль
              </label>
              <input
                id="login-password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Минимум 6 символов"
              />
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 text-sm text-red-600">
                <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
              </p>
            )}
            {notice && (
              <p className="flex items-start gap-2 text-sm text-pine-700">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> {notice}
              </p>
            )}

            <button type="submit" disabled={submitting || !isSupabaseConfigured} className="btn btn-primary btn-lg w-full">
              {mode === 'signin' ? <LogIn size={17} /> : <UserPlus size={17} />}
              {submitting ? 'Подожди…' : mode === 'signin' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>

          <Link to="/" className="mt-6 inline-block text-sm font-semibold text-ink/45 hover:text-ink">
            ← На главную
          </Link>
        </div>

        {/* --- Что даёт аккаунт (на широком экране) --- */}
        <aside className="hidden flex-col justify-center bg-pine-50 p-10 lg:flex">
          <img src={heroIllustration} alt="" className="mx-auto w-full max-w-sm rounded-xl mix-blend-multiply" />
          <h2 className="mt-8 text-xl font-extrabold tracking-tight">Аккаунт хранит всю подготовку</h2>
          <ul className="mt-4 space-y-3">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm font-medium text-ink/75">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-pine-700">
                  <Check size={14} strokeWidth={3} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  )
}
