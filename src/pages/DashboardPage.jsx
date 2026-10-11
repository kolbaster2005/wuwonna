import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Crown,
  TrendingUp,
  Flame,
  ListChecks,
  RotateCcw,
} from 'lucide-react'
import { fetchAttempts, fetchTests } from '../lib/data'
import { chapterNextTest, chapterProgress, dayStreak, nextTest, recentTests, summary } from '../lib/progress'
import { getVocabulary } from '../lib/vocabulary'
import { TOPICS } from '../data/topics'
import { useAuth } from '../lib/authContext'
import { useProModal } from '../lib/proModal'

// Дата экзамена для виджета «N дней до экзамена» (формат 'ГГГГ-ММ-ДД').
// Пока null — вместо обратного отсчёта показывается «дней подряд».
const EXAM_DATE = null

// Немецкие названия глав книги — подписи под «Глава 1», «Глава 2»...
const CHAPTER_TITLES = Object.fromEntries(TOPICS.map((t) => [t.chapter_number, t.chapter_title]))

// Белая карточка виджета.
const CARD = 'rounded-2xl border border-line bg-white'


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

function daysUntil(dateString) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${dateString}T00:00:00`)
  return Math.round((target - today) / 86400000)
}

function formatStudyTime(totalSeconds) {
  const minutes = Math.round(totalSeconds / 60)
  if (minutes < 60) return `${minutes} мин`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} ч ${m} мин` : `${h} ч`
}

function StatTile({ value, hint, icon: Icon }) {
  return (
    <div className="rounded-xl bg-paper px-3 py-3 text-center">
      <p className="flex items-center justify-center gap-1.5 text-2xl font-extrabold tracking-tight">
        {Icon && <Icon size={18} className="text-pine-600" />}
        {value}
      </p>
      <p className="mt-0.5 text-xs text-ink/50">{hint}</p>
    </div>
  )
}

// Кольцо с процентом (последняя попытка).
function Ring({ ratio }) {
  const r = 22
  const length = 2 * Math.PI * r
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 56 56" className="h-16 w-16 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="6" className="stroke-line" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          strokeWidth="6"
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

function RecentTestCard({ item }) {
  const { test, last, counts } = item
  const lastRatio = last.max_score ? Math.min(1, last.score / last.max_score) : 0
  const parts = [
    { label: 'Верно', value: counts.correct, dot: 'bg-pine-600' },
    { label: 'Частично', value: counts.partial, dot: 'bg-amber-500' },
    { label: 'Неверно', value: counts.incorrect, dot: 'bg-red-500' },
    { label: 'Без ответа', value: counts.unanswered, dot: 'bg-ink/25' },
  ].filter((p) => p.value > 0 || p.label === 'Верно' || p.label === 'Неверно')

  return (
    <div className={`flex h-full flex-col p-5 ${CARD}`}>
      <div className="flex items-center gap-4">
        <Ring ratio={lastRatio} />
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold">{test.title}</p>
          <p className="mt-0.5 text-xs text-ink/45">
            {new Date(last.completed_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            {item.attempts > 1 && ` · ${item.attempts} ${plural(item.attempts, 'попытка', 'попытки', 'попыток')}`}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] text-ink/60">
        {parts.map((p) => (
          <span key={p.label} className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${p.dot}`} />
            {p.label} <span className="font-bold text-ink">{p.value}</span>
          </span>
        ))}
      </div>
      {/* mt-auto — кнопки на одной высоте у соседних карточек */}
      <div className="mt-auto grid grid-cols-2 gap-2.5 pt-5">
        <Link
          to={`/probniki/${test.id}/exam`}
          className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-pine-600 px-3 py-2.5 text-sm font-bold text-pine-700 hover:bg-pine-50"
        >
          <RotateCcw size={15} /> Ещё раз
        </Link>
        <Link
          to={`/probniki/${test.id}`}
          className="flex items-center justify-center rounded-xl bg-pine-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-pine-700"
        >
          К пробнику
        </Link>
      </div>
    </div>
  )
}

function ChapterCard({ chapter }) {
  const number = Number(chapter.title.match(/\d+/)?.[0])
  const next = chapterNextTest(chapter)
  const isDone = chapter.done === chapter.total
  const label = isDone ? 'Повторить' : chapter.done === 0 ? 'Начать' : 'Продолжить'

  // Компактная карточка: главы стоят сеткой 2×2, все четыре видны сразу.
  return (
    <div className="card flex flex-col p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pine-50 text-sm font-extrabold text-pine-700">
          {Number.isNaN(number) ? <ListChecks size={16} /> : number}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold leading-tight">{chapter.title}</p>
          {CHAPTER_TITLES[number] && (
            <p className="truncate text-xs text-ink/50" title={CHAPTER_TITLES[number]}>
              {CHAPTER_TITLES[number]}
            </p>
          )}
        </div>
        <p className="shrink-0 text-base font-extrabold tabular-nums">{percent(chapter.ratio)}</p>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-pine-600" style={{ width: percent(chapter.ratio) }} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-ink/60">
          <CheckCircle2 size={13} className="text-pine-600" /> Подглавы: {chapter.done} из {chapter.total}
        </p>
        {next ? (
          <Link
            to={`/probniki/${next.id}`}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-pine-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-pine-700"
          >
            {label} <ArrowRight size={13} />
          </Link>
        ) : (
          <span className="flex shrink-0 items-center gap-1 rounded-lg bg-pine-50 px-3 py-1.5 text-xs font-bold text-pine-700">
            <CheckCircle2 size={13} /> Всё на 100%
          </span>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, hasPro } = useAuth()
  const { openProModal } = useProModal()
  const [tests, setTests] = useState(null)
  const [attempts, setAttempts] = useState([])
  const vocabularyCount = getVocabulary().length

  useEffect(() => {
    let alive = true
    Promise.all([fetchTests(), fetchAttempts(user.id)]).then(([ts, as]) => {
      if (!alive) return
      setTests(ts)
      setAttempts(as)
    })
    return () => {
      alive = false
    }
  }, [user.id])

  if (tests === null) {
    return <main className="mx-auto max-w-6xl px-6 py-12 text-sm text-ink/40">Загружаем…</main>
  }

  const recent = recentTests(tests, attempts, 2)
  const chapters = chapterProgress(tests, attempts)
  const stats = summary(tests, attempts)
  const firstTest = nextTest(tests, attempts)
  const streak = dayStreak(attempts)
  const examDays = EXAM_DATE ? daysUntil(EXAM_DATE) : null

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:gap-8">
        {/* --- Левая колонка --- */}
        <div className="min-w-0 space-y-8">
          <section>
            <h2 className="text-xl font-extrabold tracking-tight">Мои пробники</h2>
            {recent.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {recent.map((item) => (
                  <RecentTestCard key={item.test.id} item={item} />
                ))}
              </div>
            ) : (
              <div className={`mt-4 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between ${CARD}`}>
                <div>
                  <p className="font-extrabold">Ты ещё не прошёл ни одного теста</p>
                  <p className="mt-1 text-sm text-ink/55">
                    {firstTest ? `Начни с «${firstTest.title}» — результат появится здесь.` : 'Результаты появятся здесь.'}
                  </p>
                </div>
                <Link
                  to={firstTest ? `/probniki/${firstTest.id}` : '/probniki'}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-pine-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-pine-700"
                >
                  Начать <ArrowRight size={15} />
                </Link>
              </div>
            )}
          </section>

          {chapters.length > 0 && (
            <section>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xl font-extrabold tracking-tight">Мои главы</h2>
                <Link to="/progress" className="text-sm font-semibold text-pine-700 hover:underline">
                  Весь прогресс →
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {chapters.map((chapter) => (
                  <ChapterCard key={chapter.title} chapter={chapter} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* --- Правая колонка --- */}
        <aside className="space-y-4">
          <h2 className="text-xl font-extrabold tracking-tight">Сводка</h2>

          <div className={`p-4 ${CARD}`}>
            <div className="grid grid-cols-2 gap-2.5">
              <StatTile value={`${stats.testsTaken}`} hint={`из ${stats.testsTotal} пройдено`} />
              <StatTile
                value={stats.averageBest === null ? '—' : percent(stats.averageBest)}
                hint="средний результат"
              />
              {examDays !== null ? (
                <StatTile
                  icon={CalendarDays}
                  value={Math.max(0, examDays)}
                  hint={`${plural(Math.max(0, examDays), 'день', 'дня', 'дней')} до экзамена`}
                />
              ) : (
                <StatTile icon={Flame} value={streak} hint={`${plural(streak, 'день', 'дня', 'дней')} подряд`} />
              )}
              <StatTile value={formatStudyTime(stats.totalSeconds)} hint="время подготовки" />
            </div>

            {!hasPro && (
              <button
                onClick={() => openProModal()}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-pine-600 py-2.5 text-sm font-bold text-white hover:bg-pine-700"
              >
                <Crown size={15} /> Получить PRO
              </button>
            )}
          </div>

          {/* Быстрые ссылки */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/slovar"
              className="group relative flex min-h-[148px] flex-col justify-end rounded-2xl border border-pine-100 bg-pine-50 p-4 text-ink transition-colors hover:border-pine-200"
            >
              <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-pine-700">
                <BookOpen size={19} />
              </span>
              <ArrowRight size={16} className="absolute right-4 top-4 text-ink/40 transition-transform group-hover:translate-x-0.5" />
              <p className="font-extrabold">Словарь</p>
              <p className="text-xs text-ink/55">
                {vocabularyCount} {plural(vocabularyCount, 'слово', 'слова', 'слов')}
              </p>
            </Link>
            <Link
              to="/progress"
              className="group relative flex min-h-[148px] flex-col justify-end rounded-2xl bg-pine-700 p-4 text-white transition-colors hover:bg-pine-800"
            >
              <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <TrendingUp size={19} />
              </span>
              <ArrowRight size={16} className="absolute right-4 top-4 opacity-70 transition-transform group-hover:translate-x-0.5" />
              <p className="font-extrabold">Мой прогресс</p>
              <p className="text-xs text-white/80">Подробно по главам</p>
            </Link>
          </div>
        </aside>
      </div>
    </main>
  )
}
