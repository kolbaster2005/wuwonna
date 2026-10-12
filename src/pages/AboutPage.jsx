import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardCheck, Languages, MonitorPlay, Send, Sparkles, TrendingUp } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { ABOUT, SITE, SITE_SUMMARY, inLang } from '../seo/content'
import { useI18n } from '../i18n'

// Тексты — в src/seo/content.js (ABOUT): те же уходят в готовый HTML.
// Иконки — по порядку ABOUT[lang].features.
const FEATURE_ICONS = [ClipboardCheck, Languages, TrendingUp]

export default function AboutPage() {
  const { lang, path } = useI18n()
  const about = inLang(ABOUT, lang)
  return (
    <main className="page">
      <PageHeader icon={Sparkles} title={about.title} subtitle={about.subtitle} />

      <section className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <h2 className="h-section">{about.heading}</h2>
          <div className="mt-4 max-w-prose space-y-4 leading-relaxed text-ink/75">
            {about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2">
          {about.features.map(({ title, description }, i) => {
            const Icon = FEATURE_ICONS[i] ?? Sparkles
            return (
              <li key={title}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pine-50 text-pine-700">
                  <Icon size={21} />
                </span>
                <h3 className="mt-3.5 text-base font-extrabold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{description}</p>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-14 grid grid-cols-1 gap-8 sm:mt-16 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="h-section">{about.socialHeading}</h2>
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
        {/* Описание по-немецки — на русской версии: её читают и в Австрии */}
        {lang === 'ru' && (
          <div lang="de">
            <h2 className="h-section">Über WU WONNA</h2>
            <p className="mt-4 max-w-prose leading-relaxed text-ink/75">{SITE_SUMMARY.de}</p>
          </div>
        )}
      </section>

      <section className="mt-14 flex flex-col items-start gap-5 bg-pine-50 p-6 sm:mt-16 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">{about.startTitle}</h2>
          <p className="mt-1 text-ink/65">{about.startText}</p>
        </div>
        <Link to={path('tests')} className="btn btn-primary shrink-0">
          {about.startCta} <ArrowRight size={16} />
        </Link>
      </section>
    </main>
  )
}
