import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowRight, Download, ListChecks, Clock, ShieldCheck, CalendarDays, PauseCircle, Eye, Languages } from 'lucide-react'
import { fetchTestByPath, fetchTestPdf } from '../lib/data'
import { useAuth } from '../lib/authContext'
import Breadcrumbs from '../components/Breadcrumbs'
import RichText from '../components/RichText'
import ProLockedNotice from '../components/ProLockedNotice'
import { useSeo } from '../lib/seo'
import { testExamPath, testPath, testSeo } from '../seo/content'
import { useI18n } from '../i18n'

export default function TestDetailPage() {
  // В адресе — понятный slug (или старый id), в базе — id.
  const { slug } = useParams()
  const { t, lang, path } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const { hasPro, loading: authLoading } = useAuth()
  const [test, setTest] = useState(undefined)
  // Русская версия на чужом языке (перевода нет) — не для поиска: noindex и
  // canonical на русскую страницу (testSeo строит путь по языку версии).
  useSeo(test ? { ...testSeo(test), noindex: Boolean(test.is_fallback) } : null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  useEffect(() => {
    let alive = true
    fetchTestByPath(lang, slug).then(({ test: found, redirect }) => {
      if (!alive) return
      // Старая ссылка с id или есть версия на языке страницы — на её адрес,
      // без лишней записи в истории.
      const target = redirect && testPath(redirect, lang)
      if (target && target !== location.pathname) {
        navigate(`${target}${location.search}`, { replace: true })
        return
      }
      setTest(found)
    })
    return () => {
      alive = false
    }
    // location — только чтобы сравнить адрес; перезагружать на смену ?tab= не нужно
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, slug, navigate])

  async function handleDownloadPdf() {
    if (downloadingPdf) return
    setDownloadingPdf(true)
    try {
      const pdfUrl = await fetchTestPdf(test.id)
      if (!pdfUrl) return
      const a = document.createElement('a')
      a.href = pdfUrl
      a.download = `${test.title}.pdf`
      a.click()
    } finally {
      setDownloadingPdf(false)
    }
  }

  if (test === undefined || authLoading) {
    return <main className="mx-auto max-w-6xl px-6 py-12 text-sm text-ink/40">{t('testDetail.loading')}</main>
  }

  if (test === null) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h1 className="text-2xl font-extrabold">{t('testDetail.notFound')}</h1>
        <p className="mt-2 text-ink/55">{t('testDetail.notFoundText')}</p>
      </main>
    )
  }

  if (test.is_pro && !hasPro) {
    return (
      <main className="page">
        <Breadcrumbs items={[{ label: t('breadcrumbs.tests'), to: path('tests') }, { label: test.title }]} />
        <div className="card mt-6 p-5 sm:mt-8 sm:p-8 lg:p-10">
          <ProLockedNotice testTitle={test.title} />
        </div>
      </main>
    )
  }

  const meta = [
    { icon: ListChecks, text: t('testCard.questions', { count: test.questions_count }) },
    { icon: Clock, text: t('common.minutes', { count: test.duration_minutes }) },
    { icon: ShieldCheck, text: t(`testDetail.originality.${test.originality === 'unofficial' ? 'unofficial' : 'official'}`) },
    { icon: CalendarDays, text: t('testDetail.examYear', { year: test.year }) },
  ]

  return (
    <main className="page">
      <Breadcrumbs items={[{ label: t('breadcrumbs.tests'), to: path('tests') }, { label: test.title }]} />

      {test.is_fallback && (
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Languages size={16} className="mt-0.5 shrink-0" /> {t('testDetail.fallbackNotice')}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 sm:mt-8 lg:grid-cols-[1fr_340px] lg:gap-12">
        {/* --- О пробнике --- */}
        <div className="min-w-0">
          <p className="eyebrow">{test.section?.trim() || t('testDetail.kind')}</p>
          <h1 className="h-page mt-2">{test.title}</h1>

          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2.5 text-sm font-medium text-ink/65">
            {meta.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon size={16} className="text-pine-600" /> {text}
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-line pt-8">
            <h2 className="text-lg font-extrabold">{t('testDetail.description')}</h2>
            <RichText
              text={test.long_description || test.description}
              className="mt-3 max-w-prose leading-relaxed text-ink/75"
            />
          </div>
        </div>

        {/* --- Старт: всегда на виду (на десктопе прилипает при прокрутке) --- */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-paper px-3 py-3 text-center">
                <p className="text-2xl font-extrabold">{test.questions_count}</p>
                <p className="text-xs text-ink/50">{t('testDetail.questionsLabel', { count: test.questions_count })}</p>
              </div>
              <div className="rounded-xl bg-paper px-3 py-3 text-center">
                <p className="text-2xl font-extrabold">{test.duration_minutes}</p>
                <p className="text-xs text-ink/50">{t('testDetail.minutesLabel', { count: test.duration_minutes })}</p>
              </div>
            </div>

            <button onClick={() => navigate(testExamPath(test, lang))} className="btn btn-primary btn-lg mt-5 w-full">
              {t('testCard.start')} <ArrowRight size={17} />
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={!test.has_pdf || downloadingPdf}
              title={test.has_pdf ? undefined : t('testDetail.noPdf')}
              className="btn btn-secondary mt-2.5 w-full"
            >
              <Download size={16} /> {downloadingPdf ? t('testDetail.preparingPdf') : t('testDetail.downloadPdf')}
            </button>

            <ul className="mt-5 space-y-2.5 border-t border-line pt-5 text-[13px] leading-snug text-ink/55">
              <li className="flex gap-2.5">
                <PauseCircle size={16} className="mt-px shrink-0 text-pine-600" /> {t('testDetail.pauseHint')}
              </li>
              <li className="flex gap-2.5">
                <Eye size={16} className="mt-px shrink-0 text-pine-600" /> {t('testDetail.reviewHint')}
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  )
}
