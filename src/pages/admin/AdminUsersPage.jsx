import { useEffect, useState } from 'react'
import { Crown, Search, ShieldCheck, UserRound } from 'lucide-react'
import { fetchUsers, setUserPlan } from '../../lib/data'
import { isSupabaseConfigured } from '../../lib/supabaseClient'
import { useAuth } from '../../lib/authContext'
import { useConfirm } from '../../lib/confirmDialog'
import { translateError } from '../../i18n/translate'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

const FILTERS = [
  { value: 'all', label: 'Все' },
  { value: 'pro', label: 'PRO' },
  { value: 'free', label: 'Без PRO' },
]

export default function AdminUsersPage() {
  const confirmAction = useConfirm()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch((err) => {
        setLoadError(translateError('ru', err))
        setUsers([])
      })
  }, [])

  async function handleTogglePro(user) {
    const nextPlan = user.plan === 'pro' ? 'free' : 'pro'
    if (nextPlan === 'free') {
      const ok = await confirmAction({
        title: 'Забрать PRO?',
        message: `У ${user.email} закроются PRO-пробники.`,
        confirmLabel: 'Забрать PRO',
        danger: true,
      })
      if (!ok) return
    }

    setSavingId(user.id)
    try {
      await setUserPlan(user.id, nextPlan)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, plan: nextPlan } : u)))
    } catch (err) {
      alert(`Не получилось изменить PRO: ${translateError('ru', err)}`)
    } finally {
      setSavingId(null)
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Supabase не подключен — без него нет ни регистрации, ни пользователей. Заполни{' '}
        <code className="rounded bg-amber-100 px-1">.env</code> по инструкции в README.
      </p>
    )
  }

  const proCount = users?.filter((u) => u.plan === 'pro').length ?? 0
  const query = search.trim().toLowerCase()
  const visible = (users ?? []).filter((u) => {
    if (filter !== 'all' && u.plan !== filter) return false
    if (query && !u.email?.toLowerCase().includes(query)) return false
    return true
  })

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">Пользователи</h2>
        {users && users.length > 0 && (
          <p className="text-sm text-ink/50">
            Всего {users.length} · PRO {proCount}
          </p>
        )}
      </div>
      <p className="mt-1 text-sm text-ink/50">
        PRO открывает пробники с пометкой «Только PRO». Изменение подхватится у пользователя при следующем входе или
        в течение часа (когда обновится его сессия).
      </p>

      {loadError && (
        <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Не получилось загрузить пользователей: {loadError}
        </p>
      )}

      {users === null ? (
        <p className="mt-6 text-sm text-ink/40">Загрузка...</p>
      ) : (
        !loadError && (
          <>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 py-2.5">
                <Search size={16} className="shrink-0 text-ink/40" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по email..."
                  className="w-full bg-transparent text-sm font-medium focus:outline-none"
                />
              </div>
              <div className="flex gap-1 rounded-xl border border-line bg-white p-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                      filter === f.value ? 'bg-pine-600 text-white' : 'text-ink/60 hover:bg-black/5'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {visible.length === 0 ? (
              <p className="mt-5 rounded-xl border border-dashed border-line py-10 text-center text-sm text-ink/50">
                {users.length === 0 ? 'Пока никто не зарегистрировался.' : 'Никого не нашлось.'}
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-white">
                {visible.map((u) => {
                  const isPro = u.plan === 'pro'
                  const isAdmin = u.role === 'admin'
                  return (
                    <li key={u.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pine-50 text-pine-700">
                          <UserRound size={16} />
                        </span>
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 font-semibold">
                            <span className="truncate">{u.email}</span>
                            {u.id === currentUser?.id && <span className="text-xs font-semibold text-ink/40">это ты</span>}
                            {isAdmin && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-pine-50 px-2 py-0.5 text-xs font-bold text-pine-700">
                                <ShieldCheck size={12} /> Админ
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-ink/50">
                            Регистрация {formatDate(u.created_at)} · последний вход {formatDate(u.last_sign_in_at)}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleTogglePro(u)}
                        disabled={savingId === u.id}
                        title={isPro ? 'Нажми, чтобы забрать PRO' : 'Нажми, чтобы выдать PRO'}
                        className={`flex shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                          isPro
                            ? 'border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400'
                            : 'border-line text-ink/70 hover:border-ink/30'
                        }`}
                      >
                        <Crown size={14} />
                        {savingId === u.id ? 'Сохраняем…' : isPro ? 'PRO · забрать' : 'Выдать PRO'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )
      )}
    </div>
  )
}
