import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, ChevronDown, ClipboardList, Crown, Infinity as InfinityIcon, Send, Sparkles } from 'lucide-react'
import { useAuth } from '../lib/authContext'
import {
  PRO_PRICE,
  PRO_PURCHASE_URL,
  ProForeverTitle,
  ProPerkList,
  ProPriceTag,
  Squiggle,
} from '../components/ProOffer'
import { useI18n } from '../i18n'
import Trans from '../i18n/Trans'

// Тексты страницы — в словарях (pro.*), здесь только порядок и иконки.

// Что открывает PRO — только то, что реально есть на сайте.
const FEATURES = [
  { id: 'allTests', icon: ClipboardList },
  { id: 'newMaterials', icon: Sparkles },
  { id: 'forever', icon: InfinityIcon },
]

const STEPS = [{ id: 'register' }, { id: 'telegram', telegram: true }, { id: 'relogin' }]

const FAQ = ['subscription', 'forever', 'howToGet', 'account']

// Ссылка «напиши нам в Telegram» (в строке словаря — **...**) — ведёт туда
// же, куда и кнопки покупки.
function WithTelegramLink({ text }) {
  return (
    <Trans
      text={text}
      mark={(chunk) => (
        <a
          href={PRO_PURCHASE_URL}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-pine-700 underline hover:text-pine-800"
        >
          {chunk}
        </a>
      )}
    />
  )
}

// --- части страницы ---

function BuyButton({ className = '' }) {
  const { t } = useI18n()
  return (
    <a
      href={PRO_PURCHASE_URL}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center justify-center gap-2 whitespace-nowrap bg-pine-600 px-6 py-4 text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgba(47,122,61,0.8)] transition-colors hover:bg-pine-700 ${className}`}
    >
      {t('pro.buy', { price: PRO_PRICE })} <ArrowRight size={16} />
    </a>
  )
}

const cardShadow = 'shadow-pop'

// Карточка с ценой справа на первом экране (или «у тебя уже PRO»).
function PriceCard({ user, hasPro, loading, location }) {
  const { t, path } = useI18n()
  if (!loading && hasPro) {
    return (
      <div className={`border border-line bg-white p-6 text-center sm:p-8 ${cardShadow}`}>
        <span className="mx-auto flex h-14 w-14 items-center justify-center bg-pine-600 text-white">
          <Crown size={26} />
        </span>
        <p className="mt-4 text-xl font-extrabold">{t('pro.alreadyTitle')}</p>
        <p className="mt-1 text-sm text-ink/55">{t('pro.alreadyText')}</p>
        <div className="mt-6 space-y-3">
          <Link
            to={path('tests')}
            className="flex items-center justify-center gap-2 bg-pine-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-pine-700"
          >
            {t('pro.toTests')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`border border-line bg-white p-6 text-center sm:p-8 ${cardShadow}`}>
      <p className="text-sm font-bold uppercase tracking-wide text-ink/40">{t('pro.oneTime')}</p>
      <div className="mt-3">
        <ProPriceTag />
      </div>
      <p className="mt-3 text-sm font-medium text-ink/50">
        {t('pro.onePayment')} <span className="mx-1 text-pine-600">•</span>{' '}
        <Squiggle>{t('proOffer.accessForever')}</Squiggle>
      </p>
      <BuyButton className="mt-7 w-full" />
      <p className="mt-3 flex items-start justify-center gap-1.5 text-xs leading-relaxed text-ink/45">
        <Send size={13} className="mt-0.5 shrink-0" />
        <span>
          <WithTelegramLink text={t('pro.manualPayment')} />
        </span>
      </p>
      {!loading && !user && (
        <p className="mt-4 border-t border-line pt-4 text-sm text-ink/55">
          {t('pro.needAccount')}{' '}
          <Link to={path('login')} state={{ from: location }} className="font-semibold text-pine-700 hover:underline">
            {t('pro.signInFirst')}
          </Link>
        </p>
      )}
    </div>
  )
}

function SectionTitle({ children, hint }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{children}</h2>
      {hint && <p className="mt-2 text-ink/55">{hint}</p>}
    </div>
  )
}

export default function ProPage() {
  const { user, hasPro, loading } = useAuth()
  const location = useLocation()
  const { t } = useI18n()
  const showSales = loading || !hasPro

  return (
    <main>
      {/* --- Первый экран: заголовок и что входит слева, цена справа --- */}
      {/* светло-зелёная полоса первого экрана отделяет предложение от остального */}
      <section className="border-b border-pine-100 bg-pine-50">

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-20">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 bg-pine-600 px-3.5 py-1 text-xs font-bold text-white">
              <Crown size={13} /> PRO
            </span>
            {/* на десктопе заголовок слева, на телефоне — по центру */}
            <ProForeverTitle as="h1" align="left" className="mt-5 hidden lg:block lg:text-5xl" />
            <ProForeverTitle as="h1" className="mt-5 lg:hidden" />
            <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-ink/65 lg:mx-0">
              {t('pro.lead')} <Squiggle>{t('pro.leadForever')}</Squiggle>
            </p>
            <ProPerkList className="mx-auto mt-7 lg:mx-0" />
          </div>

          <PriceCard user={user} hasPro={hasPro} loading={loading} location={location} />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* --- Что открывает PRO --- */}
        <section className="py-10 sm:py-14">
          <SectionTitle hint={t('pro.featuresHint')}>{t('pro.featuresTitle')}</SectionTitle>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ id, icon: Icon }) => (
              <div key={id} className="border border-line bg-white p-6">
                <span className="flex h-12 w-12 items-center justify-center bg-pine-50 text-pine-700">
                  <Icon size={22} />
                </span>
                <h3 className="mt-4 text-lg font-extrabold tracking-tight">{t(`pro.features.${id}.title`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{t(`pro.features.${id}.text`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- Как получить --- */}
        {showSales && (
          <section className="py-10 sm:py-14">
            <SectionTitle hint={t('pro.stepsHint')}>{t('pro.stepsTitle')}</SectionTitle>
            <ol className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
              {STEPS.map((step, i) => (
                <li key={step.id} className="border-t-2 border-pine-600 pt-5">
                  <span className="flex h-10 w-10 items-center justify-center bg-pine-600 text-base font-extrabold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-extrabold tracking-tight">
                    {step.telegram ? (
                      <a href={PRO_PURCHASE_URL} target="_blank" rel="noreferrer" className="hover:text-pine-700">
                        {t(`pro.steps.${step.id}.title`)} <ArrowRight size={16} className="inline -translate-y-px" />
                      </a>
                    ) : (
                      t(`pro.steps.${step.id}.title`)
                    )}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{t(`pro.steps.${step.id}.text`)}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* --- Вопросы --- */}
        <section className="mx-auto max-w-3xl py-10 sm:py-14">
          <SectionTitle>{t('pro.faqTitle')}</SectionTitle>
          <div className="mt-8 divide-y divide-line border border-line bg-white">
            {FAQ.map((id) => (
              <details key={id} className="group px-5 py-4 sm:px-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                  {t(`pro.faq.${id}.q`)}
                  <ChevronDown size={18} className="shrink-0 text-ink/40 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">
                  <WithTelegramLink text={t(`pro.faq.${id}.a`)} />
                </p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
