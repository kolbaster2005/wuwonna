import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowRight, Download, ListChecks, Clock, ShieldCheck, CalendarDays, PauseCircle, Eye } from 'lucide-react'
import { fetchTestById, fetchTestPdf } from '../lib/data'
import { originalityLabel } from '../lib/originality'
import { useAuth } from '../lib/authContext'
import Breadcrumbs from '../components/Breadcrumbs'
import RichText from '../components/RichText'
import ProLockedNotice from '../components/ProLockedNotice'
import { useSeo } from '../lib/seo'
import { testSeo } from '../seo/content'

export default function TestDetailPage() {
  const { testId } = useParams()
  const navigate = useNavigate()
  const { hasPro, loading: authLoading } = useAuth()
  const [test, setTest] = useState(undefined)
  useSeo(test ? testSeo(test) : null)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  useEffect(() => {
    let alive = true
    fetchTestById(testId).then((data) => {
      if (alive) setTest(data)
    })
    return () => {
      alive = false
    }
  }, [testId])

  async function handleDownloadPdf() {
    if (downloadingPdf) return
    setDownloadingPdf(true)
    try {
      const pdfUrl = await fetchTestPdf(testId)
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
    return <main className="mx-auto max-w-6xl px-6 py-12 text-sm text-ink/40">Загружаем пробник...</main>
  }

  if (test === null) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h1 className="text-2xl font-extrabold">Пробник не найден</h1>
        <p className="mt-2 text-ink/55">Возможно, он был удалён или ссылка устарела.</p>
      </main>
    )
  }

  if (test.is_pro && !hasPro) {
    return (
      <main className="page">
        <Breadcrumbs items={[{ label: 'Пробники', to: '/probniki' }, { label: test.title }]} />
        <div className="card mt-6 p-5 sm:mt-8 sm:p-8 lg:p-10">
          <ProLockedNotice testTitle={test.title} />
        </div>
      </main>
    )
  }

  const meta = [
    { icon: ListChecks, text: `${test.questions_count} заданий` },
    { icon: Clock, text: `${test.duration_minutes} мин` },
    { icon: ShieldCheck, text: `${originalityLabel(test.originality)} пробник` },
    { icon: CalendarDays, text: `Экзамен ${test.year}` },
  ]

  return (
    <main className="page">
      <Breadcrumbs items={[{ label: 'Пробники', to: '/probniki' }, { label: test.title }]} />

      <div className="mt-6 grid grid-cols-1 gap-8 sm:mt-8 lg:grid-cols-[1fr_340px] lg:gap-12">
        {/* --- О пробнике --- */}
        <div className="min-w-0">
          <p className="eyebrow">{test.section?.trim() || 'Пробник'}</p>
          <h1 className="h-page mt-2">{test.title}</h1>

          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2.5 text-sm font-medium text-ink/65">
            {meta.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon size={16} className="text-pine-600" /> {text}
              </li>
            ))}
          </ul>

          <div className="mt-8 border-t border-line pt-8">
            <h2 className="text-lg font-extrabold">Описание</h2>
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
                <p className="text-xs text-ink/50">заданий</p>
              </div>
              <div className="rounded-xl bg-paper px-3 py-3 text-center">
                <p className="text-2xl font-extrabold">{test.duration_minutes}</p>
                <p className="text-xs text-ink/50">минут</p>
              </div>
            </div>

            <button onClick={() => navigate(`/probniki/${test.id}/exam`)} className="btn btn-primary btn-lg mt-5 w-full">
              Начать тест <ArrowRight size={17} />
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={!test.has_pdf || downloadingPdf}
              title={test.has_pdf ? undefined : 'Файл ещё не загружен'}
              className="btn btn-secondary mt-2.5 w-full"
            >
              <Download size={16} /> {downloadingPdf ? 'Готовим файл…' : 'Скачать в PDF'}
            </button>

            <ul className="mt-5 space-y-2.5 border-t border-line pt-5 text-[13px] leading-snug text-ink/55">
              <li className="flex gap-2.5">
                <PauseCircle size={16} className="mt-px shrink-0 text-pine-600" /> Таймер можно поставить на паузу
              </li>
              <li className="flex gap-2.5">
                <Eye size={16} className="mt-px shrink-0 text-pine-600" /> После теста — разбор каждого ответа
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  )
}
