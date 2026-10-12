import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardCheck, Languages, MonitorPlay, Send, Sparkles, TrendingUp } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { SITE, SITE_SUMMARY_DE } from '../seo/content'

// Что есть на платформе — только то, что реально работает на сайте сейчас.
const features = [
  {
    icon: ClipboardCheck,
    title: 'Пробники',
    description: 'Тесты в формате реального экзамена — с таймером, частичными баллами и разбором каждого ответа.',
  },
  {
    icon: Languages,
    title: 'Перевод и словарь',
    description: 'Выдели незнакомое слово прямо в задании — переведи его и сохрани в личный словарь с примером.',
  },
  {
    icon: TrendingUp,
    title: 'Прогресс по главам',
    description: 'Видно, сколько процентов каждой главы уже освоено и какие подглавы стоит повторить.',
  },
]

export default function AboutPage() {
  return (
    <main className="page">
      <PageHeader icon={Sparkles} title="О проекте" subtitle="Кто мы и зачем сделали WU WONNA" />

      <section className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <h2 className="h-section">Вся подготовка к экзамену WU — в одном месте</h2>
          <div className="mt-4 max-w-prose space-y-4 leading-relaxed text-ink/75">
            <p>
              WU WONNA (wuwonna.at) — русскоязычная онлайн-платформа для подготовки к вступительному экзамену в Венский
              экономический университет WU Wien (Wirtschaftsuniversität Wien) — WiSo Aufnahmeprüfung. Мы собрали пробники
              в формате реального экзамена, тесты по каждой главе официальной книги WU с разбором ответов, перевод и
              личный словарь, чтобы не искать материалы по разным сайтам и источникам.
            </p>
            <p>
              Название — это WU и английское «wanna» («хочу»): «хочу в WU». Кроме сайта, мы ведём YouTube-канал и
              Telegram-канал WU WONNA — рассказываем, как устроен экзамен, как к нему готовиться и как проходит поступление.
            </p>
            <p>
              Платформа постоянно развивается: мы добавляем новые пробники и материалы, улучшаем инструменты и
              стараемся сделать подготовку удобной и системной.
            </p>
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, description }) => (
            <li key={title}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pine-50 text-pine-700">
                <Icon size={21} />
              </span>
              <h3 className="mt-3.5 text-base font-extrabold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 grid grid-cols-1 gap-8 sm:mt-16 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="h-section">Мы в соцсетях</h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <a href={SITE.youtube} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 font-semibold text-pine-700 hover:underline">
                <MonitorPlay size={18} /> YouTube — @wuwonna
              </a>
            </li>
            <li>
              <a href={SITE.telegram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2.5 font-semibold text-pine-700 hover:underline">
                <Send size={18} /> Telegram — @wuwonna
              </a>
            </li>
          </ul>
        </div>
        <div lang="de">
          <h2 className="h-section">Über WU WONNA</h2>
          <p className="mt-4 max-w-prose leading-relaxed text-ink/75">{SITE_SUMMARY_DE}</p>
        </div>
      </section>

      <section className="mt-14 flex flex-col items-start gap-5 rounded-2xl bg-pine-50 p-6 sm:mt-16 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">С чего начать</h2>
          <p className="mt-1 text-ink/65">Пройди первый пробник — после него будет видно, какие темы подтянуть.</p>
        </div>
        <Link to="/probniki" className="btn btn-primary shrink-0">
          К пробникам <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  )
}
