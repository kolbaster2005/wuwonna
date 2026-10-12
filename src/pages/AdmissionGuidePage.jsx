import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink, Info } from 'lucide-react'
import { ADMISSION_GUIDE, DISCLAIMER, OFFICIAL_WU_URL, freeProbnikPath, inLang } from '../seo/content'
import { useI18n } from '../i18n'

// «Как поступить в WU» (ключ маршрута admissionGuide) на языке страницы.
// Тексты — в src/seo/content.js (ADMISSION_GUIDE): те же уходят в готовый
// HTML для поисковиков (scripts/prerender.mjs). Заголовок, описание и язык
// страницы (<html lang>) ставит RouteSeo.

export default function AdmissionGuidePage() {
  const { lang, path } = useI18n()
  const landing = inLang(ADMISSION_GUIDE, lang)

  return (
    <main className="page">
      <h1 className="h-page max-w-3xl">{landing.h1}</h1>
      <p className="lead mt-4 max-w-3xl">{landing.lead}</p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link to={freeProbnikPath(lang)} className="btn btn-primary btn-lg">
          {landing.cta} <ArrowRight size={17} />
        </Link>
        <Link to={path('examInfo')} className="btn btn-secondary btn-lg">
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
          <h2 className="h-section">{landing.faqHeading}</h2>
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
          <p>{inLang(DISCLAIMER, lang)}</p>
          <a
            href={OFFICIAL_WU_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 font-semibold text-pine-700 underline hover:text-pine-800"
          >
            {landing.officialLink} <ExternalLink size={14} />
          </a>
        </section>
      </div>
    </main>
  )
}
