import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Eye,
  ChevronDown,
  Clock,
  Flame,
  ListChecks,
  RotateCcw,
  Target,
  TrendingUp,
} from 'lucide-react'
import { fetchTests, fetchAttempts } from '../lib/data'
import { testExamPath, testPath, testResultPath } from '../seo/content'
import {
  attemptsForShownTests,
  chapterProgress,
  lastAttempt,
  localizeSections,
  nextTest,
  summary,
  weakestTests,
  attemptRatio,
} from '../lib/progress'
import { useVocabulary } from '../lib/useVocabulary'
import { useAuth } from '../lib/authContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import PageHeader from '../components/PageHeader'
import GuestSaveBanner from '../components/GuestSaveBanner'
import { useI18n } from '../i18n'

// --- форматирование ---

function percent(ratio) {
  return `${Math.round(ratio * 100)}%`
}

function formatStudyTime(t, totalSeconds) {
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) return t('common.minutes', { count: minutes })
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? t('progress.hoursMinutes', { hours: h, minutes: m }) : t('progress.hours', { hours: h })
}

const DATE = { day: 'numeric', month: 'long' }
const SCORE = { maximumFractionDigits: 2 }

// --- мелкие части ---

// Шкала прогресса: один цвет, светлая дорожка, скруглённый край.
function Meter({ ratio, size = 'md' }) {
  return (
    <div
      className={`w-full overflow-hidden bg-line ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}
      role="progressbar"
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full bg-pine-600 transition-[width]" style={{ width: percent(ratio) }} />
    </div>
  )
}

function StatTile({ icon: Icon, label, value, hint }) {
  return (
    <div className="border border-line bg-white p-4">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-ink/50">
        <Icon size={16} className="text-pine-700" /> {label}
      </div>
      <p className="mt-1.5 text-2xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink/45">{hint}</p>}
    </div>
  )
}

function Card({ title, icon: Icon, children }) {
  return (
    <section className="border border-line bg-white p-5">
      <h2 className="flex items-center gap-2 text-base font-extrabold">
        {Icon && <Icon size={17} className="text-pine-700" />} {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function ChapterCard({ chapter, expanded, onToggle }) {
  const { t, lang, formatDate } = useI18n()
  return (
    <div className="border border-line bg-white">
      <button onClick={onToggle} aria-expanded={expanded} className="w-full px-5 py-4 text-left">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-extrabold tracking-tight">{chapter.title}</h3>
          <span className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight">{percent(chapter.ratio)}</span>
            <ChevronDown size={18} className={`text-ink/40 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </span>
        </div>
        <div className="mt-3">
          <Meter ratio={chapter.ratio} />
        </div>
        <p className="mt-2 text-sm text-ink/50">
          {t('progress.chapterDone', { done: chapter.done, count: chapter.total })}
        </p>
      </button>

      {expanded && (
        <ul className="divide-y divide-line border-t border-line">
          {chapter.tests.map(({ test, best, attempts, last }) => (
            <li key={test.id} className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{test.title}</p>
                <p className="mt-0.5 text-xs text-ink/45">
                  {attempts > 0
                    ? t('progress.attempts', { count: attempts, date: formatDate(last.completed_at, DATE) })
                    : t('progress.notTaken')}
                </p>
              </div>
              <div className="flex items-center gap-3 sm:w-64">
                <div className="flex-1">
                  <Meter ratio={best} size="sm" />
                </div>
                <span className="w-10 text-right text-sm font-bold tabular-nums">{attempts > 0 ? percent(best) : '—'}</span>
                <Link
                  to={testPath(test, lang)}
                  className="shrink-0 border border-ink/25 px-2.5 py-1.5 text-xs font-bold text-ink/70 hover:border-pine-600 hover:bg-pine-50 hover:text-pine-700"
                >
                  {attempts > 0 ? t('progress.again') : t('progress.take')}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth()
  const [tests, setTests] = useState(null)
  const [attempts, setAttempts] = useState([])
  const [expanded, setExpanded] = useState(() => new Set())
  const vocabularyCount = useVocabulary().entries.length
  const { t, lang, path, formatDate, formatNumber } = useI18n()

  // Версии пробников на языке страницы; попытки на других языковых версиях
  // засчитываются показанным (attemptsForShownTests).
  useEffect(() => {
    if (authLoading) return
    let alive = true
    Promise.all([fetchTests({ lang }), fetchAttempts(user?.id)]).then(([ts, as]) => {
      if (!alive) return
      const shown = localizeSections(ts, (number) => t('progress.chapter', { number }))
      setTests(shown)
      setAttempts(attemptsForShownTests(as, shown))
    })
    return () => {
      alive = false
    }
  }, [authLoading, user?.id, lang, t])

  function toggleChapter(title) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  if (tests === null) {
    return <main className="page text-sm text-ink/40">{t('progress.loading')}</main>
  }

  const stats = summary(tests, attempts)
  const chapters = chapterProgress(tests, attempts)
  const last = lastAttempt(tests, attempts)
  const lastTest = last && tests.find((t) => t.id === last.test_id)
  const next = nextTest(tests, attempts)
  const weakest = weakestTests(tests, attempts)

  return (
    <main className="page">
      <PageHeader icon={TrendingUp} title={t('progress.title')} subtitle={t('progress.subtitle')} />

      {(!isSupabaseConfigured || !user) && (
        <GuestSaveBanner className="-mt-2 mb-8">
          {t('progress.guestBanner')}
        </GuestSaveBanner>
      )}

      {/* --- Сводка --- */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          icon={ListChecks}
          label={t('progress.stats.taken')}
          value={stats.testsTaken}
          hint={t('progress.stats.takenOf', { total: stats.testsTotal })}
        />
        <StatTile
          icon={Target}
          label={t('progress.stats.average')}
          value={stats.averageBest === null ? '—' : percent(stats.averageBest)}
          hint={t('progress.stats.averageHint')}
        />
        <StatTile
          icon={Clock}
          label={t('progress.stats.time')}
          value={formatStudyTime(t, stats.totalSeconds)}
          hint={t('progress.stats.timeHint')}
        />
        <StatTile
          icon={Flame}
          label={t('progress.stats.streak')}
          value={stats.streak}
          hint={stats.streak > 0 ? t('progress.stats.streakKeep') : t('progress.stats.streakStart')}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-8 lg:grid-cols-3">
        {/* --- Прогресс по главам --- */}
        <div className="lg:col-span-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-extrabold tracking-tight">{t('progress.chapters')}</h2>
            <p className="text-xs text-ink/45">{t('progress.chaptersHint')}</p>
          </div>
          {chapters.length === 0 ? (
            <p className="mt-4 border border-dashed border-line py-12 text-center text-sm text-ink/50">
              {t('progress.noChapters')}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {chapters.map((chapter) => (
                <ChapterCard
                  key={chapter.title}
                  chapter={chapter}
                  expanded={expanded.has(chapter.title)}
                  onToggle={() => toggleChapter(chapter.title)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* --- Последний тест --- */}
          <Card title={t('progress.lastTest')} icon={RotateCcw}>
            {last && lastTest ? (
              <>
                <p className="font-bold">{lastTest.title}</p>
                <p className="mt-0.5 text-xs text-ink/45">{formatDate(last.completed_at, DATE)}</p>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold tracking-tight">{percent(attemptRatio(last))}</span>
                  <span className="text-sm text-ink/50">
                    {t('result.score', {
                      score: formatNumber(Number(last.score), SCORE),
                      max: formatNumber(Number(last.max_score), SCORE),
                      count: Number(last.max_score),
                    })}
                  </span>
                </div>
                <div className="mt-2">
                  <Meter ratio={attemptRatio(last)} />
                </div>
                {last.duration_seconds > 0 && (
                  <p className="mt-2 text-xs text-ink/45">
                    {t('progress.duration', { time: formatStudyTime(t, last.duration_seconds) })}
                  </p>
                )}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    to={testResultPath(lastTest, last.id, lang)}
                    className="flex items-center justify-center gap-2 border border-ink/25 py-2.5 text-sm font-bold text-ink/75 hover:border-pine-600 hover:bg-pine-50 hover:text-pine-700"
                  >
                    <Eye size={15} /> {t('testCard.results')}
                  </Link>
                  <Link
                    to={testExamPath(lastTest, lang)}
                    className="flex items-center justify-center gap-2 border border-ink/25 py-2.5 text-sm font-bold text-ink/75 hover:border-pine-600 hover:bg-pine-50 hover:text-pine-700"
                  >
                    <RotateCcw size={15} /> {t('testCard.retake')}
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-sm text-ink/50">{t('progress.lastTestEmpty')}</p>
            )}
          </Card>

          {/* --- Что дальше --- */}
          {next && (
            <Card title={t('progress.whatNext')} icon={ArrowRight}>
              <p className="text-sm text-ink/55">
                {next.section ? t('progress.nextInSection', { section: next.section }) : t('progress.nextInOrder')}
              </p>
              <p className="mt-1 font-bold">{next.title}</p>
              <Link
                to={testPath(next, lang)}
                className="mt-4 flex items-center justify-center gap-2 bg-pine-600 py-2.5 text-sm font-bold text-white hover:bg-pine-700"
              >
                {t('dashboard.start')} <ArrowRight size={15} />
              </Link>
            </Card>
          )}

          {/* --- Стоит повторить --- */}
          {weakest.length > 0 && (
            <Card title={t('progress.repeat')} icon={Target}>
              <ul className="space-y-3">
                {weakest.map(({ test, best }) => (
                  <li key={test.id}>
                    <Link to={testPath(test, lang)} className="group block">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm font-bold group-hover:text-pine-700">{test.title}</span>
                        <span className="text-sm font-bold tabular-nums">{percent(best)}</span>
                      </div>
                      <div className="mt-1.5">
                        <Meter ratio={best} size="sm" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* --- Словарь --- */}
          <Card title={t('progress.vocabulary')} icon={BookOpen}>
            <div className="flex items-center justify-between gap-3">
              <p>
                <span className="text-3xl font-extrabold tracking-tight">{vocabularyCount}</span>{' '}
                <span className="text-sm text-ink/50">{t('progress.wordsLabel', { count: vocabularyCount })}</span>
              </p>
              <Link to={path('vocabulary')} className="text-sm font-bold text-pine-700 hover:text-pine-800">
                {t('progress.open')}
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
