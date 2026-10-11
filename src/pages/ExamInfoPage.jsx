import { useSearchParams } from 'react-router-dom'
import { Clock, ListChecks, CheckSquare, ExternalLink, Presentation, Globe2, Info } from 'lucide-react'
import RichText from '../components/RichText'
import PageHeader from '../components/PageHeader'
import Tabs from '../components/Tabs'

const TABS = [
  { id: 'general', label: 'Общая информация' },
  { id: 'stats', label: 'Статистика и проходной балл 2026' },
  { id: 'registration', label: 'Процесс регистрации' },
  { id: 'materials', label: 'Полезные материалы' },
]

const OFFICIAL_WU_URL =
  'https://www.wu.ac.at/studium/bachelor/wirtschafts-und-sozialwissenschaften/ueberblick/aufnahmeverfahren'

const STATS_SOURCE_URL =
  'https://www.wu.ac.at/universitaet/news-und-events/news/details-news/detail/rekord-registrierungszahlen-fuer-wu-bachelorstudien'

function OfficialWuLink({ children = 'официальном сайте WU' }) {
  return (
    <a
      href={OFFICIAL_WU_URL}
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-pine-700 underline hover:text-pine-800"
    >
      {children}
    </a>
  )
}

function RegistrationInfo() {
  return (
    <div className="mt-3 space-y-3 leading-relaxed text-ink/75">
      <p>
        Подробнее о процессе регистрации на экзамен можно узнать на <OfficialWuLink />.
      </p>
      <p>
        На момент 2026 года сервисный сбор за участие в экзамене составляет <strong className="font-semibold">50 €</strong>.
      </p>
      <p>Сервисный сбор не возвращается, даже если участник не сдаёт экзамен.</p>
    </div>
  )
}

const examParts = [
  {
    number: '01',
    title: 'Понимание основ экономики',
    description:
      'Все задания этого раздела составляются строго на основе официальной книги по экономике, которую WU рекомендует использовать для подготовки к экзамену. Поэтому знакомство с книгой и подготовку по ней рекомендуется начинать заранее. Книга состоит из четырёх разделов, и в экзамене могут встретиться вопросы по материалу всех четырёх разделов. Заранее определить, какие именно вопросы и темы попадутся на экзамене, невозможно.',
  },
  {
    number: '02',
    title: 'Чтение немецкого текста',
    description:
      'В этой части вам будет предложен текст экономической направленности примерно уровня B2–C1. Ваша задача — внимательно прочитать текст и выполнить предложенные к нему задания.',
  },
  {
    number: '03',
    title: 'Математика',
    description:
      'Математическая часть также проводится в формате Multiple Choice. Вам не требуется записывать решения или расписывать ход вычислений. Для каждого задания уже представлены готовые варианты ответа — необходимо определить, какие из них являются правильными.',
  },
]

function GeneralTab() {
  return (
    <div>
      <section>
        <h2 className="text-lg font-extrabold">Краткая информация</h2>
        <ul className="mt-4 space-y-3">
          <li className="flex items-center gap-3 text-sm text-ink/75">
            <Clock size={17} className="shrink-0 text-pine-600" />
            Продолжительность экзамена: <strong className="font-semibold">2 часа</strong>
          </li>
          <li className="flex items-start gap-3 text-sm text-ink/75">
            <ListChecks size={17} className="mt-0.5 shrink-0 text-pine-600" />
            <span>
              Экзамен WISO состоит из трёх частей: понимание основ экономики, чтение немецкого текста и математика.
            </span>
          </li>
          <li className="flex items-start gap-3 text-sm text-ink/75">
            <CheckSquare size={17} className="mt-0.5 shrink-0 text-pine-600" />
            <span>
              Все задания представлены в формате <strong className="font-semibold">Multiple Choice</strong> — нужно
              выбрать правильный вариант или варианты ответа из предложенных.
            </span>
          </li>
        </ul>
      </section>

      <section className="mt-8 sm:mt-10">
        <h2 className="text-lg font-extrabold">Как проходит экзамен</h2>
        <RichText
          text={`Экзамен WISO проводится один раз в год в очном формате. Дату проведения самостоятельно выбрать нельзя.

Все участники экзамена собираются в большом экзаменационном центре. Каждый студент работает за отдельной партой.

С собой на экзамен разрешается взять калькулятор и письменные принадлежности. Все необходимые материалы для выполнения заданий выдаются непосредственно на месте проведения экзамена. На случай необходимости на столе также будет предоставлена ручка.

Экзамен длится 2 часа без перерыва.`}
          className="mt-3 leading-relaxed text-ink/75"
        />
      </section>

      <section className="mt-8 sm:mt-10">
        <h2 className="text-lg font-extrabold">Регистрация и стоимость</h2>
        <RegistrationInfo />
      </section>

      <section className="mt-8 sm:mt-10">
        <h2 className="text-lg font-extrabold">Части экзамена</h2>
        <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-4">
          {examParts.map((part) => (
            <div key={part.number} className="rounded-2xl border border-line bg-white p-4 sm:p-5">
              <span className="text-xs font-bold text-pine-600">{part.number}</span>
              <h3 className="mt-1 text-base font-extrabold leading-snug">{part.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink/65">{part.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function StatsTab() {
  const stats = [
    { label: 'Примерный проходной балл', value: '≈ 89' },
    { label: 'Кол-во мест', value: '2 703' },
    { label: 'Кол-во сдающих', value: '6 370' },
  ]

  return (
    <div>
      <h2 className="h-section">Статистика и проходной балл 2026 года</h2>
      <div className="card mt-6 grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map((s) => (
          <div key={s.label} className="px-6 py-6">
            <p className="text-4xl font-extrabold tracking-tight text-pine-700">{s.value}</p>
            <p className="mt-1.5 text-sm text-ink/55">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-ink/40">
        Источник:{' '}
        <a href={STATS_SOURCE_URL} target="_blank" rel="noreferrer" className="underline hover:text-ink/60">
          wu.ac.at — Rekord-Registrierungszahlen für WU-Bachelorstudien
        </a>
      </p>
    </div>
  )
}

function MaterialsTab() {
  const links = [
    { title: 'Официальный сайт WU', href: OFFICIAL_WU_URL, icon: Globe2, external: true },
    // Книга пока скрыта с сайта — ссылку вернуть вместе с маршрутом /kniga (App.jsx):
    // { title: 'Официальная книга по подготовке', href: '/kniga', icon: BookOpen, external: false }, (BookOpen — из lucide-react)
  ]

  return (
    <div>
      <h2 className="h-section">Полезные материалы</h2>
      <ul className="mt-6 max-w-2xl space-y-3">
        {links.map((link) => (
          <li key={link.title}>
            <a
              href={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noreferrer' : undefined}
              className="card flex items-center gap-3 p-4 text-sm font-semibold text-ink transition-colors hover:border-line-strong"
            >
              <link.icon size={17} className="shrink-0 text-pine-600" />
              {link.title}
              <ExternalLink size={14} className="ml-auto shrink-0 text-ink/30" />
            </a>
          </li>
        ))}
        <li>
          <div
            className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-dashed border-line bg-white p-4 text-sm font-semibold text-ink/35"
            title="Ссылку добавим, как только пришлёшь презентацию"
          >
            <Presentation size={17} className="shrink-0" />
            Презентация о том, как считаются баллы за ответы
            <span className="ml-auto shrink-0 text-xs font-normal">скоро</span>
          </div>
        </li>
      </ul>
    </div>
  )
}

function RegistrationTab() {
  return (
    <div>
      <h2 className="h-section">Процесс регистрации</h2>
      <div className="max-w-prose">
        <RegistrationInfo />
      </div>
    </div>
  )
}

export default function ExamInfoPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = TABS.some((t) => t.id === searchParams.get('tab')) ? searchParams.get('tab') : 'general'

  return (
    <main className="page">
      <PageHeader icon={Info} title="Об экзамене" subtitle="Как устроен вступительный экзамен WU и как на него зарегистрироваться">
        <Tabs
          className="mt-6"
          items={TABS}
          value={activeTab}
          onChange={(id) => setSearchParams(id === 'general' ? {} : { tab: id })}
        />
      </PageHeader>

      <div>
        {activeTab === 'general' && (
          <div className="max-w-4xl">
            <GeneralTab />
          </div>
        )}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'materials' && <MaterialsTab />}
        {activeTab === 'registration' && <RegistrationTab />}
      </div>
    </main>
  )
}
