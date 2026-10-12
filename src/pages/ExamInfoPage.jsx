import { useSearchParams } from 'react-router-dom'
import {
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ClipboardCheck,
  Clock,
  CreditCard,
  ExternalLink,
  Globe2,
  Info,
  ListChecks,
  Mail,
  MonitorPlay,
  Presentation,
  Send,
  UserPlus,
} from 'lucide-react'
import RichText from '../components/RichText'
import PageHeader from '../components/PageHeader'
import Tabs from '../components/Tabs'
import {
  EXAM_FAQ,
  EXAM_INFO,
  EXAM_PARTS,
  EXAM_STATS_2026,
  OFFICIAL_WU_URL,
  REGISTRATION_STEPS,
  SITE,
  inLang,
} from '../seo/content'
import { useI18n } from '../i18n'

// Все тексты страницы — в src/seo/content.js (EXAM_INFO, EXAM_PARTS,
// REGISTRATION_STEPS, EXAM_FAQ): они же уходят в готовый HTML для поисковиков.

const TAB_IDS = ['general', 'stats', 'registration', 'materials']

const STATS_SOURCE_URL =
  'https://www.wu.ac.at/universitaet/news-und-events/news/details-news/detail/rekord-registrierungszahlen-fuer-wu-bachelorstudien'

function OfficialWuLink({ children }) {
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

// Строка из content.js: **жирный** и [ссылка на официальный сайт WU].
function ContentText({ text }) {
  return text
    .split(/(\*\*[^*]+\*\*|\[[^\]]+\])/)
    .filter(Boolean)
    .map((part, i) => {
      if (part.startsWith('**')) return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      if (part.startsWith('[')) return <OfficialWuLink key={i}>{part.slice(1, -1)}</OfficialWuLink>
      return part
    })
}

function RegistrationInfo({ info }) {
  return (
    <div className="mt-3 space-y-3 leading-relaxed text-ink/75">
      {info.registration.map((paragraph) => (
        <p key={paragraph}>
          <ContentText text={paragraph} />
        </p>
      ))}
    </div>
  )
}

const FACT_ICONS = [Clock, ListChecks, CheckSquare]

function GeneralTab({ lang, info }) {
  return (
    <div>
      <section>
        <h2 className="text-lg font-extrabold">{info.summaryHeading}</h2>
        <ul className="mt-4 space-y-3">
          {info.facts.map((fact, i) => {
            const Icon = FACT_ICONS[i] ?? CheckSquare
            return (
              <li key={fact} className="flex items-start gap-3 text-sm text-ink/75">
                <Icon size={17} className="mt-0.5 shrink-0 text-pine-600" />
                <span>
                  <ContentText text={fact} />
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-8 sm:mt-10">
        <h2 className="text-lg font-extrabold">{info.howItGoesHeading}</h2>
        <RichText text={info.howItGoes} className="mt-3 leading-relaxed text-ink/75" />
      </section>

      <section className="mt-8 sm:mt-10">
        <h2 className="text-lg font-extrabold">{info.registrationHeading}</h2>
        <RegistrationInfo info={info} />
      </section>

      <section className="mt-8 sm:mt-10">
        <h2 className="text-lg font-extrabold">{info.partsHeading}</h2>
        <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-3 sm:gap-4">
          {inLang(EXAM_PARTS, lang).map((part) => (
            <div key={part.number} className="border border-line bg-white p-4 sm:p-5">
              <span className="text-xs font-bold text-pine-600">{part.number}</span>
              <h3 className="mt-1 text-base font-extrabold leading-snug">{part.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-ink/65">{part.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 max-w-3xl sm:mt-10">
        <h2 className="text-lg font-extrabold">{info.faqHeading}</h2>
        <div className="mt-4 divide-y divide-line border border-line bg-white">
          {inLang(EXAM_FAQ, lang).map(({ question, answer }) => (
            <details key={question} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">
                {question}
                <ChevronDown size={18} className="shrink-0 text-ink/40 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2.5 text-[15px] leading-relaxed text-ink/70">{answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}

function StatsTab({ info }) {
  const stats = ['passingScore', 'places', 'participants'].map((id) => ({
    label: info.stats[id],
    value: EXAM_STATS_2026[id],
  }))

  return (
    <div>
      <h2 className="h-section">{info.statsHeading}</h2>
      <div className="card mt-6 grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map((s) => (
          <div key={s.label} className="px-6 py-6">
            <p className="text-4xl font-extrabold tracking-tight text-pine-700">{s.value}</p>
            <p className="mt-1.5 text-sm text-ink/55">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-ink/40">
        {info.source}{' '}
        <a href={STATS_SOURCE_URL} target="_blank" rel="noreferrer" className="underline hover:text-ink/60">
          wu.ac.at — Rekord-Registrierungszahlen für WU-Bachelorstudien
        </a>
      </p>
    </div>
  )
}

// Подпись ссылки — EXAM_INFO[lang].links[id].
const usefulLinks = [
  { id: 'official', href: OFFICIAL_WU_URL, icon: Globe2 },
  {
    id: 'scoring',
    href: 'https://www.wu.ac.at/fileadmin/wu/h/programs/bachelor/wiso/Teilpunktesystem_WISO.pdf',
    icon: Presentation,
  },
  // Книга пока скрыта с сайта — ссылку вернуть вместе с маршрутом /kniga (App.jsx):
  // { id: 'book', href: '/kniga', icon: BookOpen }, (BookOpen — из lucide-react)
]

const socialLinks = [
  { id: 'youtube', href: SITE.youtube, icon: MonitorPlay },
  { id: 'telegram', href: SITE.telegram, icon: Send },
]

// Список внешних ссылок карточками — открываются в новой вкладке.
function LinkList({ links, info }) {
  return (
    <ul className="mt-6 max-w-2xl space-y-3">
      {links.map((link) => (
        <li key={link.id}>
          <a
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="card flex items-center gap-3 p-4 text-sm font-semibold text-ink transition-colors hover:border-line-strong"
          >
            <link.icon size={17} className="shrink-0 text-pine-600" />
            {info.links[link.id]}
            <ExternalLink size={14} className="ml-auto shrink-0 text-ink/30" />
          </a>
        </li>
      ))}
    </ul>
  )
}

function MaterialsTab({ info }) {
  return (
    <div className="space-y-10">
      <section>
        <h2 className="h-section">{info.materialsHeading}</h2>
        <LinkList links={usefulLinks} info={info} />
      </section>
      <section>
        <h2 className="h-section">{info.socialHeading}</h2>
        <LinkList links={socialLinks} info={info} />
      </section>
    </div>
  )
}

// Иконки шагов — по порядку REGISTRATION_STEPS (тексты в src/seo/content.js).
const STEP_ICONS = [UserPlus, ClipboardCheck, CreditCard, CalendarDays, Mail]

function RegistrationTab({ lang, info }) {
  const steps = inLang(REGISTRATION_STEPS, lang)
  return (
    <div className="max-w-3xl">
      <h2 className="h-section">{info.tabs.registration}</h2>
      <p className="mt-2 text-ink/60">
        <ContentText text={info.registrationIntro} />
      </p>

      <ol className="mt-8">
        {steps.map(({ title, points }, i) => {
          const Icon = STEP_ICONS[i]
          const isLast = i === steps.length - 1
          return (
            <li key={title} className="relative flex gap-4 pb-8 last:pb-0 sm:gap-5">
              {/* вертикальная линия между шагами */}
              {!isLast && <span aria-hidden="true" className="absolute left-5 top-11 bottom-0 w-px bg-line" />}
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pine-600 text-white">
                <Icon size={19} />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="eyebrow text-pine-700">{info.step.replace('{number}', i + 1)}</p>
                <h3 className="mt-0.5 text-lg font-extrabold">{title}</h3>
                <ul className="mt-3 space-y-1.5 text-[15px] leading-relaxed text-ink/70">
                  {points.map((point) => (
                    <li key={point} className="flex gap-2.5">
                      <span aria-hidden="true" className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-pine-600" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default function ExamInfoPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { lang } = useI18n()
  const info = inLang(EXAM_INFO, lang)
  const activeTab = TAB_IDS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'general'

  return (
    <main className="page">
      <PageHeader icon={Info} title={info.title} subtitle={info.subtitle}>
        <Tabs
          className="mt-6"
          items={TAB_IDS.map((id) => ({ id, label: info.tabs[id] }))}
          value={activeTab}
          onChange={(id) => setSearchParams(id === 'general' ? {} : { tab: id })}
        />
      </PageHeader>

      <div>
        {activeTab === 'general' && (
          <div className="max-w-4xl">
            <GeneralTab lang={lang} info={info} />
          </div>
        )}
        {activeTab === 'stats' && <StatsTab info={info} />}
        {activeTab === 'materials' && <MaterialsTab info={info} />}
        {activeTab === 'registration' && <RegistrationTab lang={lang} info={info} />}
      </div>
    </main>
  )
}
