import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, ClipboardCheck, FileText, Info, TrendingUp, Target, Eye } from 'lucide-react'
import heroIllustration from '../assets/hero-illustration.jpg'
import { useAuth } from '../lib/authContext'
import DashboardPage from './DashboardPage'

// Разделы сайта на первом экране.
const features = [
  {
    icon: ClipboardCheck,
    title: 'Пробники',
    subtitle: 'В формате реального экзамена',
    to: '/probniki',
  },
  {
    icon: TrendingUp,
    title: 'Мой прогресс',
    subtitle: 'Процент по каждой главе',
    to: '/progress',
  },
  {
    icon: BookOpen,
    title: 'Словарь',
    subtitle: 'Твои термины и перевод',
    to: '/slovar',
  },
]

// Как проходит подготовка — три шага под первым экраном.
const steps = [
  {
    icon: ClipboardCheck,
    title: 'Пройди пробник',
    text: 'Тест в формате реального экзамена: таймер, несколько верных ответов, частичные баллы.',
  },
  {
    icon: Eye,
    title: 'Разбери ошибки',
    text: 'После теста видно свой выбор, верные варианты и объяснение к каждому вопросу.',
  },
  {
    icon: Target,
    title: 'Подтяни слабые главы',
    text: '«Мой прогресс» покажет процент по каждой главе и подскажет, что пройти дальше.',
  },
]

// Края картинки плавно растворяются в фоне страницы — чтобы не было видно
// прямоугольника изображения.
const fadeEdges = {
  maskImage:
    'linear-gradient(to right, transparent, #000 7%, #000 93%, transparent), linear-gradient(to bottom, transparent, #000 7%, #000 90%, transparent)',
  maskComposite: 'intersect',
  WebkitMaskImage:
    'linear-gradient(to right, transparent, #000 7%, #000 93%, transparent), linear-gradient(to bottom, transparent, #000 7%, #000 90%, transparent)',
  WebkitMaskComposite: 'source-in',
}

// Главная: гостю — продающий первый экран, вошедшему — личная панель с
// прогрессом (DashboardPage). Пока сессия грузится — пустой экран нужной
// высоты, чтобы вошедший не видел на мгновение лендинг.
export default function HomePage() {
  const { user, loading } = useAuth()
  if (loading) return <main className="min-h-[calc(100svh-4.5rem-1px)]" />
  if (user) return <DashboardPage />
  return <Landing />
}

function Landing() {
  return (
    <main>
      {/* Первый экран — ровно на высоту окна под шапкой (4.5rem + 1px: py-4 + аватарка/«Войти» h-10 + граница),
          содержимое по центру по вертикали, волна прижата к нижнему краю экрана. svh — чтобы на
          телефоне не прыгало из-за панели браузера. */}
      <section className="relative isolate flex min-h-[calc(100svh-4.5rem-1px)] flex-col justify-center overflow-hidden">
        {/* мягкий фон: лёгкий зелёный оттенок сверху и волна снизу */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 -z-10 h-16 w-full text-pine-50 sm:h-24"
        >
          <path fill="currentColor" d="M0 70 C 240 20 480 20 720 55 C 960 90 1200 95 1440 50 L 1440 120 L 0 120 Z" />
        </svg>

        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-10 lg:grid-cols-[1.5fr_1fr] lg:gap-4">
          <div>
            <h1 className="text-[32px] font-extrabold leading-[1.15] tracking-tight sm:text-[42px] lg:text-[44px]">
              Подготовка к экзамену в WU <br className="hidden sm:block" />— <span className="text-pine-600">удобно</span>{' '}
              <br className="hidden sm:block" />и в одном месте
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/60 sm:text-[17px]">
              Пробники в формате реального экзамена и по главам книги с разбором ответов, личный словарь и прогресс
              по каждой главе. Начни бесплатно — а PRO откроет всё навсегда.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
              {features.map((f) => (
                <Link key={f.title} to={f.to} className="group flex items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pine-50 text-pine-700 transition-colors group-hover:bg-pine-100">
                    <f.icon size={22} />
                  </span>
                  <span className="pt-0.5">
                    <span className="block text-[15px] font-bold text-ink">{f.title}</span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-ink/50">{f.subtitle}</span>
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                to="/probniki"
                className="flex items-center justify-center gap-2.5 rounded-2xl bg-pine-600 px-7 py-4 text-sm font-bold text-white shadow-[0_12px_28px_-12px_rgba(47,122,61,0.8)] transition-colors hover:bg-pine-700"
              >
                <FileText size={17} /> Перейти к пробникам <ArrowRight size={17} />
              </Link>
              <Link
                to="/exam-info"
                className="flex items-center justify-center gap-2.5 rounded-2xl border border-line bg-white px-7 py-4 text-sm font-bold text-ink transition-colors hover:border-ink/30"
              >
                <Info size={17} /> Информация об экзамене
              </Link>
            </div>
          </div>

          <img
            src={heroIllustration}
            alt=""
            width={762}
            height={530}
            style={fadeEdges}
            className="mx-auto w-full max-w-md select-none sm:max-w-lg lg:max-w-none"
          />
        </div>
      </section>

      {/* Продолжение зелёной волны первого экрана */}
      <section className="bg-pine-50">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20">
          <p className="eyebrow text-pine-700">Как это работает</p>
          <h2 className="h-section mt-2 max-w-xl">Подготовка в три шага — и каждый следующий видно заранее</h2>

          <ol className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-pine-700">
                    <Icon size={21} />
                  </span>
                  <span className="text-sm font-extrabold text-pine-700">Шаг {i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-extrabold">{title}</h3>
                <p className="mt-1.5 leading-relaxed text-ink/65">{text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 flex flex-col gap-3 sm:flex-row">
            <Link to="/probniki" className="btn btn-primary btn-lg">
              Начать с пробника <ArrowRight size={17} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Создать аккаунт
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
