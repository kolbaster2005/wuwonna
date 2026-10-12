import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
import { useI18n } from '../i18n'

// Любой несуществующий адрес. Раньше показывалась пустая страница.
export default function NotFoundPage() {
  const { t, path } = useI18n()
  return (
    <main className="page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pine-50 text-pine-700">
        <Compass size={26} />
      </span>
      <p className="eyebrow mt-6">{t('notFound.eyebrow')}</p>
      <h1 className="h-page mt-2">{t('notFound.title')}</h1>
      <p className="lead mt-3 max-w-md">{t('notFound.text')}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to={path('home')} className="btn btn-primary">
          <ArrowLeft size={16} /> {t('notFound.home')}
        </Link>
        <Link to={path('tests')} className="btn btn-secondary">
          {t('notFound.tests')}
        </Link>
      </div>
    </main>
  )
}
