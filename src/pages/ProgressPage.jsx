import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Clock,
  Flame,
  ListChecks,
  RotateCcw,
  Target,
  TrendingUp,
} from 'lucide-react'
import { fetchTests, fetchAttempts } from '../lib/data'
import { chapterProgress, lastAttempt, nextTest, summary, weakestTests, attemptRatio } from '../lib/progress'
import { useVocabulary } from '../lib/useVocabulary'
import { useAuth } from '../lib/authContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import PageHeader from '../components/PageHeader'
import GuestSaveBanner from '../components/GuestSaveBanner'

// --- форматирование ---

function percent(ratio) {
  return `${Math.round(ratio * 100)}%`
}

function plural(n, one, few, many) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

function formatStudyTime(totalSeconds) {
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) return `${minutes} мин`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} ч ${m} мин` : `${h} ч`
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

function formatScore(value) {
  return Math.round(Number(value) * 100) / 100
}

// --- мелкие части ---

// Шкала прогресса: один цвет, светлая дорожка, скруглённый край.
function Meter({ ratio, size = 'md' }) {
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-line ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}
      role="progressbar"
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-pine-600 transition-[width]" style={{ width: percent(ratio) }} />
    </div>
  )
}

function StatTile({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
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
    <section className="rounded-2xl border border-line bg-white p-5">
      <h2 className="flex items-center gap-2 text-base font-extrabold">
        {Icon && <Icon size={17} className="text-pine-700" />} {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function ChapterCard({ chapter, expanded, onToggle }) {
  return (
    <div className="rounded-2xl border border-line bg-white">
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
          Пройдено {chapter.done} из {chapter.total} {plural(chapter.total, 'теста', 'тестов', 'тестов')}
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
                    ? `${attempts} ${plural(attempts, 'попытка', 'попытки', 'попыток')} · последняя ${formatDate(last.completed_at)}`
                    : 'Ещё не проходил'}
                </p>
              </div>
              <div className="flex items-center gap-3 sm:w-64">
                <div className="flex-1">
                  <Meter ratio={best} size="sm" />
                </div>
                <span className="w-10 text-right text-sm font-bold tabular-nums">{attempts > 0 ? percent(best) : '—'}</span>
                <Link
                  to={`/probniki/${test.id}`}
                  className="shrink-0 rounded-lg border border-line px-2.5 py-1.5 text-xs font-bold text-ink/70 hover:border-ink/30"
                >
                  {attempts > 0 ? 'Ещё раз' : 'Пройти'}
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

  useEffect(() => {
    if (authLoading) return
    let alive = true
    Promise.all([fetchTests(), fetchAttempts(user?.id)]).then(([ts, as]) => {
      if (!alive) return
      setTests(ts)
      setAttempts(as)
    })
    return () => {
      alive = false
    }
  }, [authLoading, user?.id])

  function toggleChapter(title) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  if (tests === null) {
    return <main className="page text-sm text-ink/40">Загружаем прогресс…</main>
  }

  const stats = summary(tests, attempts)
  const chapters = chapterProgress(tests, attempts)
  const last = lastAttempt(tests, attempts)
  const lastTest = last && tests.find((t) => t.id === last.test_id)
  const next = nextTest(tests, attempts)
  const weakest = weakestTests(tests, attempts)

  return (
    <main className="page">
      <PageHeader icon={TrendingUp} title="Мой прогресс" subtitle="Как продвигается подготовка — по главам и тестам" />

      {(!isSupabaseConfigured || !user) && (
        <GuestSaveBanner className="-mt-2 mb-8">
          Прогресс сохраняется только в этом браузере — войди, чтобы он был в аккаунте и на любом устройстве.
        </GuestSaveBanner>
      )}

      {/* --- Сводка --- */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          icon={ListChecks}
          label="Пройдено тестов"
          value={stats.testsTaken}
          hint={`из ${stats.testsTotal}`}
        />
        <StatTile
          icon={Target}
          label="Средний результат"
          value={stats.averageBest === null ? '—' : percent(stats.averageBest)}
          hint="по лучшей попытке"
        />
        <StatTile icon={Clock} label="Время подготовки" value={formatStudyTime(stats.totalSeconds)} hint="по таймеру тестов" />
        <StatTile
          icon={Flame}
          label="Дней подряд"
          value={stats.streak}
          hint={stats.streak > 0 ? 'не прерывай серию' : 'пройди тест сегодня'}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-8 lg:grid-cols-3">
        {/* --- Прогресс по главам --- */}
        <div className="lg:col-span-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-extrabold tracking-tight">Прогресс по главам</h2>
            <p className="text-xs text-ink/45">по лучшему результату каждой подглавы</p>
          </div>
          {chapters.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-line py-12 text-center text-sm text-ink/50">
              Главы пока не размечены.
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
          <Card title="Последний тест" icon={RotateCcw}>
            {last && lastTest ? (
              <>
                <p className="font-bold">{lastTest.title}</p>
                <p className="mt-0.5 text-xs text-ink/45">{formatDate(last.completed_at)}</p>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold tracking-tight">{percent(attemptRatio(last))}</span>
                  <span className="text-sm text-ink/50">
                    {formatScore(last.score)} из {formatScore(last.max_score)} баллов
                  </span>
                </div>
                <div className="mt-2">
                  <Meter ratio={attemptRatio(last)} />
                </div>
                {last.duration_seconds > 0 && (
                  <p className="mt-2 text-xs text-ink/45">Время: {formatStudyTime(last.duration_seconds)}</p>
                )}
                <Link
                  to={`/probniki/${lastTest.id}/exam`}
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-sm font-bold text-ink/75 hover:border-ink/30"
                >
                  <RotateCcw size={15} /> Пройти ещё раз
                </Link>
              </>
            ) : (
              <p className="text-sm text-ink/50">Здесь появится результат, как только завершишь первый тест.</p>
            )}
          </Card>

          {/* --- Что дальше --- */}
          {next && (
            <Card title="Что дальше" icon={ArrowRight}>
              <p className="text-sm text-ink/55">{next.section ? `${next.section} · следующий по порядку` : 'Следующий по порядку'}</p>
              <p className="mt-1 font-bold">{next.title}</p>
              <Link
                to={`/probniki/${next.id}`}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-pine-600 py-2.5 text-sm font-bold text-white hover:bg-pine-700"
              >
                Начать <ArrowRight size={15} />
              </Link>
            </Card>
          )}

          {/* --- Стоит повторить --- */}
          {weakest.length > 0 && (
            <Card title="Стоит повторить" icon={Target}>
              <ul className="space-y-3">
                {weakest.map(({ test, best }) => (
                  <li key={test.id}>
                    <Link to={`/probniki/${test.id}`} className="group block">
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
          <Card title="Словарь" icon={BookOpen}>
            <div className="flex items-center justify-between gap-3">
              <p>
                <span className="text-3xl font-extrabold tracking-tight">{vocabularyCount}</span>{' '}
                <span className="text-sm text-ink/50">{plural(vocabularyCount, 'слово', 'слова', 'слов')}</span>
              </p>
              <Link to="/slovar" className="text-sm font-bold text-pine-700 hover:text-pine-800">
                Открыть →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
