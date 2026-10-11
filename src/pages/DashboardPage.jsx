import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, ChevronRight, TrendingUp } from 'lucide-react'
import { fetchAttempts, fetchTests } from '../lib/data'
import { attemptRatio, chapterNextTest, chapterProgress, lastAttempt, nextTest, summary } from '../lib/progress'
import { useVocabulary } from '../lib/useVocabulary'
import { TOPICS } from '../data/topics'
import { useAuth } from '../lib/authContext'

// Главная для вошедшего. Сетка 2 колонки × 3 строки (на компьютере всё на
// первом экране):
//   слева на все три строки — карта прогресса по главам (каждая подглава —
//   квадратик, по цвету видно, где прогресс есть, а где нет);
//   справа: 1-я строка — последний результат и «Продолжить»,
//           2-я строка — «Словарь» и «Мой прогресс»,
//           3-я строка — пока свободна.

// Немецкие названия глав книги — подписи под «Глава 1», «Глава 2»...
const CHAPTER_TITLES = Object.fromEntries(TOPICS.map((t) => [t.chapter_number, t.chapter_title]))

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

function formatDate(value) {
  return new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

function chapterNumber(chapter) {
  return Number(chapter.title.match(/\d+/)?.[0])
}

// Цвет квадратика подглавы по лучшему результату.
const LEVELS = [
  { label: 'Не начато', className: 'bg-line', test: (t) => t.attempts === 0 },
  { label: 'До 50%', className: 'bg-pine-200', test: (t) => t.best < 0.5 },
  { label: 'До 85%', className: 'bg-pine-500', test: (t) => t.best < 0.85 },
  { label: '85% и выше', className: 'bg-pine-700', test: () => true },
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
  const overall = chapters.reduce((sum, c) => sum + c.ratio, 0) / chapters.length
  return (
    <section className="card flex flex-col p-6 sm:p-8 lg:row-span-3">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h2 className="h-section">Прогресс по главам</h2>
          <p className="mt-1 text-sm text-ink/50">Каждый квадратик — подглава. Нажми, чтобы пройти её.</p>
        </div>
        <p className="text-right">
          <span className="text-3xl font-extrabold tracking-tight">{percent(overall)}</span>
          <span className="block text-xs text-ink/45">общий прогресс</span>
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
                  const status = item.attempts > 0 ? percent(item.best) : 'не начато'
                  return (
                    <Link
                      key={item.test.id}
                      to={`/probniki/${item.test.id}`}
                      title={`${item.test.title} — ${status}`}
                      aria-label={`${item.test.title}: ${status}`}
                      className={`h-6 w-6 rounded-md transition-transform hover:scale-110 hover:ring-2 hover:ring-pine-600/40 ${levelClass(item)}`}
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
          <li key={l.label} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded ${l.className}`} /> {l.label}
          </li>
        ))}
      </ul>
    </section>
  )
}

// --- справа, 1-я строка: последний результат + «Продолжить» ---

function LastResultCard({ last, lastTest, next }) {
  const button = next && (
    <Link to={`/probniki/${next.id}`} className="btn btn-primary shrink-0">
      {last ? 'Продолжить' : 'Начать'} <ArrowRight size={16} />
    </Link>
  )
  return (
    <section className="card order-first flex flex-col justify-center p-6 lg:order-none">
      <p className="eyebrow">{last ? 'Последний результат' : 'С чего начать'}</p>
      {last && lastTest ? (
        <div className="mt-3 flex items-center gap-4">
          <Ring ratio={attemptRatio(last)} />
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold">{lastTest.title}</p>
            <p className="text-sm text-ink/50">{formatDate(last.completed_at)}</p>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink/55">Здесь появится результат первого теста.</p>
      )}
      {next && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
          <p className="min-w-0 text-sm text-ink/55">
            Дальше: <span className="font-bold text-ink">{next.title}</span>
          </p>
          {button}
        </div>
      )}
    </section>
  )
}

// --- справа, 2-я строка: ссылки ---

function TileLink({ to, icon: Icon, title, subtitle, dark = false }) {
  return (
    <Link
      to={to}
      className={`group flex flex-col justify-between gap-4 rounded-2xl p-5 transition-shadow hover:shadow-pop ${
        dark ? 'bg-pine-700 text-white' : 'border border-pine-100 bg-pine-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${dark ? 'bg-white/10' : 'bg-white text-pine-700'}`}>
          <Icon size={19} />
        </span>
        <ChevronRight size={18} className={`transition-transform group-hover:translate-x-0.5 ${dark ? 'text-white/70' : 'text-ink/40'}`} />
      </div>
      <div>
        <p className="font-extrabold">{title}</p>
        <p className={`text-sm ${dark ? 'text-white/70' : 'text-ink/50'}`}>{subtitle}</p>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [tests, setTests] = useState(null)
  const [attempts, setAttempts] = useState([])
  const wordsCount = useVocabulary().entries.length

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
    return <main className="page text-sm text-ink/40">Загружаем…</main>
  }

  const chapters = chapterProgress(tests, attempts)
  const stats = summary(tests, attempts)
  const last = lastAttempt(tests, attempts)
  const lastTest = last && tests.find((t) => t.id === last.test_id)

  // Откуда продолжать: глава последнего теста, если в ней ещё есть что
  // пройти; иначе первая глава, где есть что пройти; иначе — первый
  // непройденный тест вообще.
  const lastChapter = lastTest && chapters.find((c) => c.tests.some((t) => t.test.id === lastTest.id))
  const chapter = (lastChapter && chapterNextTest(lastChapter) && lastChapter) || chapters.find((c) => chapterNextTest(c))
  const next = chapter ? chapterNextTest(chapter) : nextTest(tests, attempts)

  return (
    <main className="page">
      <div className="grid grid-cols-1 gap-6 lg:grid-flow-col lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:grid-rows-[auto_auto_1fr]">
        {chapters.length > 0 && <ChaptersMap chapters={chapters} />}
        <LastResultCard last={last} lastTest={lastTest} next={next} />
        <div className="grid grid-cols-2 gap-6">
          <TileLink
            to="/slovar"
            icon={BookOpen}
            title="Словарь"
            subtitle={`${wordsCount} ${plural(wordsCount, 'слово', 'слова', 'слов')}`}
          />
          <TileLink
            to="/progress"
            icon={TrendingUp}
            title="Мой прогресс"
            subtitle={`${stats.testsTaken} из ${stats.testsTotal} тестов`}
            dark
          />
        </div>
      </div>
    </main>
  )
}
