import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, Eye, Lock, RotateCcw } from 'lucide-react'
import { fetchAttempts, fetchTests } from '../lib/data'
import {
  attemptRatio,
  attemptsForShownTests,
  chapterNextTest,
  chapterProgress,
  lastAttempt,
  localizeSections,
  nextTest,
  recentTests,
  statsByTest,
} from '../lib/progress'
import { TOPICS } from '../data/topics'
import { useAuth } from '../lib/authContext'
import { testPath, testResultPath } from '../seo/content'
import { useProModal } from '../lib/proModal'
import { useI18n } from '../i18n'

// Главная для вошедшего. Сетка 2 колонки × 2 строки:
//   слева на обе строки — карта прогресса по главам (каждая подглава —
//   квадратик, по цвету видно, где прогресс есть, а где нет);
//   справа: 1-я строка — два последних результата с переходом к разбору
//           ответов (пока ничего не пройдено — «С чего начать»),
//           2-я строка — пробники в формате экзамена (сразу начать, без меню).

// Немецкие названия глав книги — подписи под «Глава 1», «Глава 2»...
const CHAPTER_TITLES = Object.fromEntries(TOPICS.map((t) => [t.chapter_number, t.chapter_title]))

function percent(ratio) {
  return `${Math.round(ratio * 100)}%`
}

function chapterNumber(chapter) {
  return Number(chapter.title.match(/\d+/)?.[0])
}

// Цвет квадратика подглавы по лучшему результату (подпись — dashboard.levels.<id>).
const LEVELS = [
  { id: 'notStarted', className: 'bg-line', test: (t) => t.attempts === 0 },
  { id: 'below50', className: 'bg-pine-200', test: (t) => t.best < 0.5 },
  { id: 'below85', className: 'bg-pine-500', test: (t) => t.best < 0.85 },
  { id: 'above85', className: 'bg-pine-700', test: () => true },
]

function levelClass(item) {
  return LEVELS.find((l) => l.test(item)).className
}

function Ring({ ratio, size = 64 }) {
  const r = 42
  const length = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="10" className="stroke-line" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={length}
          strokeDashoffset={length * (1 - ratio)}
          className="stroke-pine-600"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold">{percent(ratio)}</span>
    </div>
  )
}

// --- слева: карта прогресса по главам ---

function ChaptersMap({ chapters }) {
  const { t, lang } = useI18n()
  const overall = chapters.reduce((sum, c) => sum + c.ratio, 0) / chapters.length
  return (
    <section className="card flex flex-col p-6 sm:p-8 lg:row-span-2">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="h-section">{t('dashboard.chapters.title')}</h2>
          <p className="mt-1 text-sm text-ink/50">{t('dashboard.chapters.hint')}</p>
        </div>
        <p className="text-right">
          <span className="text-3xl font-extrabold tracking-tight">{percent(overall)}</span>
          <span className="block text-xs text-ink/45">{t('dashboard.chapters.overall')}</span>
        </p>
      </div>

      <ul className="mt-5 mb-6 space-y-4">
        {chapters.map((chapter) => {
          const number = chapterNumber(chapter)
          return (
            <li key={chapter.title} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2">
              <div className="min-w-0">
                <p className="text-sm font-bold">{chapter.title}</p>
                <p className="truncate text-xs text-ink/45">{CHAPTER_TITLES[number] ?? ''}</p>
              </div>
              <span className="text-right text-sm font-extrabold tabular-nums">{percent(chapter.ratio)}</span>
              <div className="col-span-2 flex flex-wrap gap-1.5">
                {chapter.tests.map((item) => {
                  const status = item.attempts > 0 ? percent(item.best) : t('dashboard.notStarted')
                  return (
                    <Link
                      key={item.test.id}
                      to={testPath(item.test, lang)}
                      title={`${item.test.title} — ${status}`}
                      aria-label={`${item.test.title}: ${status}`}
                      className={`h-6 w-6 transition-transform hover:scale-110 hover:ring-2 hover:ring-pine-600/40 ${levelClass(item)}`}
                    />
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>

      <ul className="mt-auto flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-5 text-xs text-ink/55">
        {LEVELS.map((l) => (
          <li key={l.id} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 ${l.className}`} /> {t(`dashboard.levels.${l.id}`)}
          </li>
        ))}
      </ul>
    </section>
  )
}

// --- справа, 1-я строка, пока ничего не пройдено: «С чего начать» ---

function LastResultCard({ last, lastTest, next }) {
  const { t, lang, formatDate } = useI18n()
  const button = next && (
    <Link to={testPath(next, lang)} className="btn btn-primary shrink-0">
      {last ? t('dashboard.continue') : t('dashboard.start')} <ArrowRight size={16} />
    </Link>
  )
  return (
    <section className="card order-first flex flex-col justify-center p-6 lg:order-none">
      <p className="eyebrow">{last ? t('dashboard.lastResult') : t('dashboard.whereToStart')}</p>
      {last && lastTest ? (
        <div className="mt-3 flex items-center gap-4">
          <Ring ratio={attemptRatio(last)} />
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold">{lastTest.title}</p>
            <p className="text-sm text-ink/50">{formatDate(last.completed_at, { day: 'numeric', month: 'long' })}</p>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink/55">{t('dashboard.firstResultHint')}</p>
      )}
      {next && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
          <p className="min-w-0 text-sm text-ink/55">
            {t('dashboard.next')} <span className="font-bold text-ink">{next.title}</span>
          </p>
          {button}
        </div>
      )}
    </section>
  )
}

// Маленькая кнопка в строке виджета: белая или зелёная.
const smallButton = (primary) =>
  `flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap border px-3 text-[12px] font-bold transition-colors ${
    primary
      ? 'border-transparent bg-pine-600 text-white hover:bg-pine-700'
      : 'border-ink/25 bg-white text-ink/75 hover:border-pine-600 hover:bg-pine-50 hover:text-pine-700'
  }`

// --- справа, 2-я строка: пробники в формате экзамена ---

function ExamsWidget({ exams, attempts }) {
  const { t, lang, path } = useI18n()
  const { hasPro } = useAuth()
  const { openProModal } = useProModal()
  const byTest = statsByTest(attempts)
  return (
    <section className="card flex flex-col p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-extrabold">
          <ClipboardList size={17} className="text-pine-700" /> {t('dashboard.exams.title')}
        </h2>
        <Link
          to={path('tests', { tab: 'probniki' })}
          className="shrink-0 whitespace-nowrap text-sm font-bold text-pine-700 hover:text-pine-800"
        >
          {t('dashboard.exams.all')}
        </Link>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {exams.map((test) => {
          const stats = byTest[test.id]
          const locked = Boolean(test.is_pro) && !hasPro
          return (
            <li key={test.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <Link to={testPath(test, lang)} className="block truncate text-sm font-bold hover:text-pine-700">
                  {test.title}
                </Link>
                <p className="mt-0.5 text-xs text-ink/50">
                  {locked
                    ? t('testCard.proOnly')
                    : stats
                      ? t('dashboard.exams.best', { percent: Math.round(stats.best * 100) })
                      : t('dashboard.exams.notTaken')}
                </p>
              </div>
              {locked ? (
                <button onClick={() => openProModal()} className={smallButton(false)}>
                  <Lock size={13} /> PRO
                </button>
              ) : (
                <Link to={testPath(test, lang)} className={smallButton(!stats)}>
                  {stats ? (
                    <>
                      <RotateCcw size={13} /> {t('dashboard.exams.again')}
                    </>
                  ) : (
                    <>
                      {t('dashboard.start')} <ArrowRight size={13} />
                    </>
                  )}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

// --- справа, 1-я строка: два последних результата ---

function RecentResults({ items }) {
  const { t, lang, formatDate } = useI18n()
  return (
    <section className="order-first lg:order-none">
      <p className="eyebrow">{t('dashboard.recent.title')}</p>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {items.map(({ test, last, counts }) => (
          <div key={test.id} className="card flex flex-col p-5">
            <div className="flex items-center gap-4">
              <Ring ratio={attemptRatio(last)} size={56} />
              <div className="min-w-0">
                <p className="truncate font-extrabold">{test.title}</p>
                <p className="text-xs text-ink/50">{formatDate(last.completed_at, { day: 'numeric', month: 'long' })}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-ink/55">
              {t('dashboard.recent.counts', { correct: counts.correct, partial: counts.partial, incorrect: counts.incorrect })}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 pt-1 sm:mt-auto lg:mt-4">
              <Link to={testResultPath(test, last.id, lang)} className={smallButton(false)}>
                <Eye size={13} /> {t('testCard.results')}
              </Link>
              <Link to={testPath(test, lang)} className={smallButton(true)}>
                <RotateCcw size={13} /> {t('dashboard.exams.again')}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { t, lang } = useI18n()
  const [tests, setTests] = useState(null)
  const [attempts, setAttempts] = useState([])

  // Версии пробников на языке страницы; попытки на других языковых версиях
  // засчитываются показанным (attemptsForShownTests).
  useEffect(() => {
    let alive = true
    Promise.all([fetchTests({ lang }), fetchAttempts(user.id)]).then(([ts, as]) => {
      if (!alive) return
      const shown = localizeSections(ts, (number) => t('progress.chapter', { number }))
      setTests(shown)
      setAttempts(attemptsForShownTests(as, shown))
    })
    return () => {
      alive = false
    }
  }, [user.id, lang, t])

  if (tests === null) {
    return <main className="page text-sm text-ink/40">{t('dashboard.loading')}</main>
  }

  const chapters = chapterProgress(tests, attempts)
  const last = lastAttempt(tests, attempts)
  const lastTest = last && tests.find((t) => t.id === last.test_id)

  // Откуда продолжать: глава последнего теста, если в ней ещё есть что
  // пройти; иначе первая глава, где есть что пройти; иначе — первый
  // непройденный тест вообще.
  const lastChapter = lastTest && chapters.find((c) => c.tests.some((t) => t.test.id === lastTest.id))
  const chapter = (lastChapter && chapterNextTest(lastChapter) && lastChapter) || chapters.find((c) => chapterNextTest(c))
  const next = chapter ? chapterNextTest(chapter) : nextTest(tests, attempts)
  const exams = tests.filter((test) => !test.section?.trim())
  const recent = recentTests(tests, attempts, 2)

  return (
    <main className="page">
      <div className="grid grid-cols-1 gap-6 lg:grid-flow-col lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">
        {chapters.length > 0 && <ChaptersMap chapters={chapters} />}
        {recent.length > 0 ? (
          <RecentResults items={recent} />
        ) : (
          <LastResultCard last={last} lastTest={lastTest} next={next} />
        )}
        {exams.length > 0 && <ExamsWidget exams={exams} attempts={attempts} />}
      </div>
    </main>
  )
}
