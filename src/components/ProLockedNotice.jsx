import { Link, useLocation } from 'react-router-dom'
import { Crown } from 'lucide-react'
import { useAuth } from '../lib/authContext'
import { PRO_PURCHASE_URL } from './ProOffer'
import { useI18n } from '../i18n'
import Trans from '../i18n/Trans'

// Показывается вместо пробника, если он только для PRO, а у пользователя
// нет подписки (или он не вошёл). Используется и на странице пробника, и на
// странице прохождения — чтобы прямая ссылка на /exam тоже не открывала тест.
export default function ProLockedNotice({ testTitle }) {
  const { user } = useAuth()
  const location = useLocation()
  const { t, path } = useI18n()

  return (
    <div className="mx-auto max-w-lg py-6 text-center sm:py-10">
      <span className="mx-auto flex h-14 w-14 items-center justify-center bg-amber-50 text-amber-600 sm:h-16 sm:w-16">
        <Crown size={26} />
      </span>
      <h1 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">{t('proLocked.title')}</h1>
      <p className="mt-3 leading-relaxed text-ink/60">
        {testTitle ? (
          <Trans
            text={t('proLocked.namedTest', { title: testTitle })}
            mark={(chunk) => <span className="font-semibold text-ink">{chunk}</span>}
          />
        ) : (
          t('proLocked.thisTest')
        )}{' '}
        {t('proLocked.cta')}
      </p>

      <a
        href={PRO_PURCHASE_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-7 inline-flex w-full items-center justify-center gap-2 bg-pine-600 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-pine-700 sm:w-auto sm:py-3.5"
      >
        <Crown size={16} /> {t('proLocked.getPro')}
      </a>

      {!user && (
        <p className="mt-4 text-sm text-ink/50">
          {t('proLocked.alreadyPro')}{' '}
          <Link to={path('login')} state={{ from: location }} className="font-semibold text-pine-700 hover:text-pine-800">
            {t('proLocked.login')}
          </Link>
        </p>
      )}
    </div>
  )
}
