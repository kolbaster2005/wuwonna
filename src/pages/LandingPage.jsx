import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink, Info } from 'lucide-react'
import {
  DISCLAIMER,
  FREE_PROBNIK_PATH,
  LANDINGS,
  LANDING_ALTERNATES,
  LANGUAGE_NAMES,
  OFFICIAL_WU_URL,
} from '../seo/content'

// Посадочная страница под поисковые запросы (/postuplenie-v-wu, /de, /en).
// Тексты — в src/seo/content.js (LANDINGS): те же уходят в готовый HTML для
// поисковиков (scripts/prerender.mjs). Заголовок и описание вкладки ставит
// RouteSeo, здесь — только язык страницы (<html lang>).

const OFFICIAL_LINK_LABEL = {
  ru: 'Официальная страница WU о поступлении',
  de: 'Offizielle WU-Seite zum Aufnahmeverfahren',
  en: 'Official WU admission page',
}

const FAQ_HEADING = { ru: 'Частые вопросы', de: 'Häufige Fragen', en: 'FAQ' }

export default function LandingPage({ path }) {
  const landing = LANDINGS[path]
  const { lang } = landing

  useEffect(() => {
    document.documentElement.lang = lang
    // Остальной сайт — на русском: возвращаем язык при уходе со страницы.
    return () => {
      document.documentElement.lang = 'ru'
    }
  }, [lang])

  // Переключатель языка — без x-default (это та же английская страница).
  const languageLinks = LANDING_ALTERNATES.filter((item) => item.lang !== 'x-default')

  return (
    <main className="page" lang={lang}>
      <nav aria-label="Language" className="mb-6 flex flex-wrap gap-2 text-sm">
        {languageLinks.map((item) =>
          item.lang === lang ? (
            <span key={item.lang} className="rounded-lg bg-pine-600 px-3 py-1.5 font-bold text-white">
              {LANGUAGE_NAMES[item.lang]}
            </span>
          ) : (
            <Link
              key={item.lang}
              to={item.path}
              hrefLang={item.lang}
              className="rounded-lg border border-line px-3 py-1.5 font-semibold text-ink/70 transition-colors hover:border-ink/30 hover:text-ink"
            >
              {LANGUAGE_NAMES[item.lang]}
            </Link>
          ),
        )}
      </nav>

      <h1 className="h-page max-w-3xl">{landing.h1}</h1>
      <p className="lead mt-4 max-w-3xl">{landing.lead}</p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link to={FREE_PROBNIK_PATH} className="btn btn-primary btn-lg">
          {landing.cta} <ArrowRight size={17} />
        </Link>
        <Link to="/exam-info" className="btn btn-secondary btn-lg">
          <Info size={17} /> {landing.more}
        </Link>
      </div>

      <div className="mt-12 max-w-3xl space-y-10">
        {landing.sections.map((section) => {
          const ListTag = section.ordered ? 'ol' : 'ul'
          return (
            <section key={section.heading}>
              <h2 className="h-section">{section.heading}</h2>
              {section.text && <p className="mt-3 leading-relaxed text-ink/75">{section.text}</p>}
              {section.items && (
                <ListTag
                  className={`mt-3 space-y-2 pl-5 leading-relaxed text-ink/75 ${section.ordered ? 'list-decimal' : 'list-disc'}`}
                >
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ListTag>
              )}
            </section>
          )
        })}

        <section>
          <h2 className="h-section">{FAQ_HEADING[lang]}</h2>
          <div className="mt-3 space-y-5">
            {landing.faq.map((item) => (
              <div key={item.question}>
                <h3 className="font-bold">{item.question}</h3>
                <p className="mt-1 leading-relaxed text-ink/75">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-pine-50 p-5 text-sm leading-relaxed text-ink/70">
          <p>{DISCLAIMER[lang]}</p>
          <a
            href={OFFICIAL_WU_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 font-semibold text-pine-700 underline hover:text-pine-800"
          >
            {OFFICIAL_LINK_LABEL[lang]} <ExternalLink size={14} />
          </a>
        </section>
      </div>
    </main>
  )
}
