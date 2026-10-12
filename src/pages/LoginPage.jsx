import { useState } from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { LogIn, UserPlus, Check, AlertCircle, CheckCircle2 } from 'lucide-react'
import heroIllustration from '../assets/hero-illustration.jpg'
import { useAuth } from '../lib/authContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { useI18n } from '../i18n'
import Trans from '../i18n/Trans'

export default function LoginPage() {
  const { signIn, signUp, user } = useAuth()
  const location = useLocation()
  const { t, path, errorText } = useI18n()

  const [mode, setMode] = useState(location.state?.mode === 'signup' ? 'signup' : 'signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Куда вернуть после входа: туда, откуда прислал RequireAuth (например,
  // /admin), иначе на главную — обычному ученику в админке делать нечего.
  const from = location.state?.from
    ? `${location.state.from.pathname}${location.state.from.search ?? ''}`
    : path('home')

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
        await signUp(email, password, `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, '')}${path('home')}`)
        setNotice(t('login.created'))
        setMode('signin')
      }
    } catch (err) {
      setError(errorText(err))
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode(next) {
    setMode(next)
    setError('')
    setNotice('')
  }

  const benefits = [t('login.benefits.devices'), t('login.benefits.results'), t('login.benefits.pro')]

  return (
    <main className="page">
      <div className="mx-auto grid max-w-5xl grid-cols-1 overflow-hidden border border-line bg-white lg:grid-cols-2">
        {/* --- Форма --- */}
        <div className="p-6 sm:p-10">
          <h1 className="h-page">{mode === 'signin' ? t('login.signInTitle') : t('login.signUpTitle')}</h1>
          <p className="mt-2 text-ink/55">
            {mode === 'signin' ? t('login.signInText') : t('login.signUpText')}
          </p>

          {/* переключатель вход / регистрация */}
          <div role="tablist" className="mt-7 grid grid-cols-2 gap-1 bg-paper p-1">
            {[
              ['signin', t('login.signInTab')],
              ['signup', t('login.signUpTab')],
            ].map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={mode === id}
                onClick={() => switchMode(id)}
                className={`py-2 text-sm font-bold transition-colors ${
                  mode === id ? 'bg-white text-ink shadow-sm' : 'text-ink/50 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {!isSupabaseConfigured && (
            <p className="mt-5 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <Trans
                text={t('login.notConfigured')}
                mark={(chunk) => <code className="bg-amber-100 px-1">{chunk}</code>}
              />
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="label">
                {t('login.email')}
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
                {t('login.password')}
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
                placeholder={t('login.passwordPlaceholder')}
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
              {submitting ? t('login.wait') : mode === 'signin' ? t('login.signIn') : t('login.signUp')}
            </button>
          </form>

          <Link to={path('home')} className="mt-6 inline-block text-sm font-semibold text-ink/45 hover:text-ink">
            {t('login.home')}
          </Link>
        </div>

        {/* --- Что даёт аккаунт (на широком экране) --- */}
        <aside className="hidden flex-col justify-center bg-pine-50 p-10 lg:flex">
          <img src={heroIllustration} alt="" className="mx-auto w-full max-w-sm mix-blend-multiply" />
          <h2 className="mt-8 text-xl font-extrabold tracking-tight">{t('login.benefitsTitle')}</h2>
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
