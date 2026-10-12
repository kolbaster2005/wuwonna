import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Crown, LogOut, Settings, ShieldCheck } from 'lucide-react'
import { useAuth } from '../lib/authContext'
import { useProModal } from '../lib/proModal'
import { useI18n } from '../i18n'

// Кружок с первой буквой почты — пока у пользователей нет своих фото.
export function Avatar({ email, size = 'md' }) {
  const letter = (email?.trim()[0] ?? '?').toUpperCase()
  const sizes = size === 'lg' ? 'h-11 w-11 text-lg' : 'h-10 w-10 text-base'
  return (
    <span
      className={`flex shrink-0 select-none items-center justify-center rounded-full bg-pine-600 font-extrabold text-white ${sizes}`}
    >
      {letter}
    </span>
  )
}

// Почта + тариф (+ "Админ"). Общая часть для выпадашки на десктопе и
// мобильного меню. onGetPro — открыть PRO-модалку (кнопка только у тех, у
// кого PRO нет).
export function AccountInfo({ onGetPro }) {
  const { user, hasPro, isAdmin } = useAuth()
  const { t } = useI18n()

  return (
    <div>
      <div className="flex items-center gap-3">
        <Avatar email={user.email} size="lg" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink/40">{t('userMenu.account')}</p>
          <p className="truncate text-sm font-bold" title={user.email}>
            {user.email}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 bg-paper px-3.5 py-3">
        <div>
          <p className="text-xs font-semibold text-ink/40">{t('userMenu.plan')}</p>
          {hasPro ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-extrabold text-pine-700">
              <Crown size={15} /> PRO <span className="font-semibold text-ink/45">{t('userMenu.forever')}</span>
            </p>
          ) : (
            <p className="mt-0.5 text-sm font-extrabold">{t('userMenu.basic')}</p>
          )}
        </div>
        {!hasPro && (
          <button
            onClick={onGetPro}
            className="flex shrink-0 items-center gap-1.5 bg-pine-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-pine-700"
          >
            <Crown size={13} /> {t('userMenu.getPro')}
          </button>
        )}
      </div>

      {isAdmin && (
        <p className="mt-3 flex items-center gap-1.5 px-1 text-xs font-semibold text-ink/50">
          <ShieldCheck size={14} className="text-pine-700" /> {t('userMenu.admin')}
        </p>
      )}
    </div>
  )
}

// Аватарка в шапке (десктоп) с выпадающим "личным кабинетом".
export default function UserMenu({ onSignOut }) {
  const { user, isAdmin } = useAuth()
  const { openProModal } = useProModal()
  const { t } = useI18n()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Закрываем по клику мимо, по Esc и при переходе на другую страницу.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => setOpen(false), [location.pathname])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t('userMenu.open')}
        aria-expanded={open}
        title={user.email}
        className={`rounded-full ring-offset-2 ring-offset-paper transition-shadow ${
          open ? 'ring-2 ring-pine-600' : 'hover:ring-2 hover:ring-pine-600/40'
        }`}
      >
        <Avatar email={user.email} />
      </button>

      {/* На телефоне и планшете справа от аватарки стоит бургер (40px + отступ 8px) —
          окошко сдвинуто на его ширину, чтобы правый край совпал с краем
          экрана, и не шире самого экрана. */}
      {open && (
        <div className="absolute -right-12 top-full z-40 mt-3 w-[min(18rem,calc(100vw-2rem))] lg:right-0 border border-line bg-white p-4 shadow-[0_16px_40px_-16px_rgba(20,23,26,0.25)]">
          <AccountInfo
            onGetPro={() => {
              setOpen(false)
              openProModal()
            }}
          />

          <div className="mt-3 space-y-0.5 border-t border-line pt-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="flex w-full items-center gap-2 px-2.5 py-2 text-sm font-semibold text-ink/75 transition-colors hover:bg-black/5"
              >
                <Settings size={16} /> {t('userMenu.adminPanel')}
              </Link>
            )}
            <button
              onClick={() => {
                setOpen(false)
                onSignOut()
              }}
              className="flex w-full items-center gap-2 px-2.5 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={16} /> {t('userMenu.signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
