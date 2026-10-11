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

// --- Тексты страницы (меняй здесь) ---

// Что открывает PRO — только то, что реально есть на сайте.
const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Все PRO-пробники',
    text: 'Пробники с пометкой PRO открываются сразу — проходи сколько угодно раз, с разбором ответов.',
  },
  {
    icon: Sparkles,
    title: 'Новые материалы',
    text: 'Всё, что появится на сайте с пометкой PRO позже, откроется без доплат.',
  },
  {
    icon: InfinityIcon,
    title: 'Навсегда',
    text: 'Один платёж — без подписки, продлений и автоматических списаний.',
  },
]

const STEPS = [
  { title: 'Зарегистрируйся', text: 'PRO выдаётся на аккаунт — так он будет на любом устройстве.' },
  { title: 'Напиши нам в Telegram', text: 'Укажи почту своего аккаунта — мы включим PRO после оплаты.', telegram: true },
  { title: 'Перезайди на сайт', text: 'PRO появится после повторного входа (или сам в течение часа).' },
]

// Ссылка «напиши нам в Telegram» — ведёт туда же, куда и кнопки покупки.
function TelegramLink() {
  return (
    <a href={PRO_PURCHASE_URL} target="_blank" rel="noreferrer" className="font-semibold text-pine-700 underline hover:text-pine-800">
      напиши нам в Telegram
    </a>
  )
}

const FAQ = [
  {
    q: 'Это подписка?',
    a: 'Нет. Платишь один раз — PRO остаётся у тебя навсегда, без продлений и автоматических списаний.',
  },
  {
    q: 'Что значит «навсегда»?',
    a: 'PRO привязан к твоему аккаунту и не истекает. Всё, что появится на сайте с пометкой PRO позже, откроется без доплат.',
  },
  {
    q: 'Как получить PRO после оплаты?',
    a: (
      <>
        Пока оплата проходит вручную: <TelegramLink /> и укажи почту своего аккаунта — мы включим PRO. Он появится
        после повторного входа на сайт (или сам в течение часа).
      </>
    ),
  },
  {
    q: 'Нужен ли аккаунт?',
    a: 'Да — PRO выдаётся на аккаунт, поэтому сначала зарегистрируйся на сайте. Так доступ будет на любом устройстве.',
  },
]

// --- части страницы ---

function BuyButton({ className = '' }) {
  return (
    <a
      href={PRO_PURCHASE_URL}
      target="_blank"
      rel="noreferrer"
      className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-pine-600 px-6 py-4 text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgba(47,122,61,0.8)] transition-colors hover:bg-pine-700 ${className}`}
    >
      Получить PRO за {PRO_PRICE} <ArrowRight size={16} />
    </a>
  )
}

const cardShadow = 'shadow-pop'

// Карточка с ценой справа на первом экране (или «у тебя уже PRO»).
function PriceCard({ user, hasPro, loading, location }) {
  if (!loading && hasPro) {
    return (
      <div className={`rounded-2xl border border-line bg-white p-6 text-center sm:p-8 ${cardShadow}`}>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pine-600 text-white">
          <Crown size={26} />
        </span>
        <p className="mt-4 text-xl font-extrabold">У тебя уже есть PRO</p>
        <p className="mt-1 text-sm text-ink/55">навсегда — все PRO-материалы открыты</p>
        <div className="mt-6 space-y-3">
          <Link
            to="/probniki"
            className="flex items-center justify-center gap-2 rounded-2xl bg-pine-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-pine-700"
          >
            К пробникам <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border border-line bg-white p-6 text-center sm:p-8 ${cardShadow}`}>
      <p className="text-sm font-bold uppercase tracking-wide text-ink/40">Единоразово</p>
      <div className="mt-3">
        <ProPriceTag />
      </div>
      <p className="mt-3 text-sm font-medium text-ink/50">
        один платёж <span className="mx-1 text-pine-600">•</span> <Squiggle>доступ навсегда</Squiggle>
      </p>
      <BuyButton className="mt-7 w-full" />
      <p className="mt-3 flex items-start justify-center gap-1.5 text-xs leading-relaxed text-ink/45">
        <Send size={13} className="mt-0.5 shrink-0" />
        <span>
          Оплата пока вручную: <TelegramLink /> — выдадим PRO на твой аккаунт.
        </span>
      </p>
      {!loading && !user && (
        <p className="mt-4 border-t border-line pt-4 text-sm text-ink/55">
          PRO выдаётся на аккаунт —{' '}
          <Link to="/login" state={{ from: location }} className="font-semibold text-pine-700 hover:underline">
            сначала войди или зарегистрируйся
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
  const showSales = loading || !hasPro

  return (
    <main>
      {/* --- Первый экран: заголовок и что входит слева, цена справа --- */}
      {/* светло-зелёная полоса первого экрана отделяет предложение от остального */}
      <section className="border-b border-pine-100 bg-pine-50">

        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-20">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-pine-600 px-3.5 py-1 text-xs font-bold text-white">
              <Crown size={13} /> PRO
            </span>
            {/* на десктопе заголовок слева, на телефоне — по центру */}
            <ProForeverTitle as="h1" align="left" className="mt-5 hidden lg:block lg:text-5xl" />
            <ProForeverTitle as="h1" className="mt-5 lg:hidden" />
            <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-ink/65 lg:mx-0">
              Один платёж — и все PRO-материалы твои <Squiggle>навсегда.</Squiggle>
            </p>
            <ProPerkList className="mx-auto mt-7 lg:mx-0" />
          </div>

          <PriceCard user={user} hasPro={hasPro} loading={loading} location={location} />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* --- Что открывает PRO --- */}
        <section className="py-10 sm:py-14">
          <SectionTitle hint="Всё, что отмечено на сайте значком PRO">Что открывает PRO</SectionTitle>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-line bg-white p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pine-50 text-pine-700">
                  <Icon size={22} />
                </span>
                <h3 className="mt-4 text-lg font-extrabold tracking-tight">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* --- Как получить --- */}
        {showSales && (
          <section className="py-10 sm:py-14">
            <SectionTitle hint="Оплата пока проходит вручную — это займёт пару минут">Как получить PRO</SectionTitle>
            <ol className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
              {STEPS.map((step, i) => (
                <li key={step.title} className="border-t-2 border-pine-600 pt-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pine-600 text-base font-extrabold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-extrabold tracking-tight">
                    {step.telegram ? (
                      <a href={PRO_PURCHASE_URL} target="_blank" rel="noreferrer" className="hover:text-pine-700">
                        {step.title} <ArrowRight size={16} className="inline -translate-y-px" />
                      </a>
                    ) : (
                      step.title
                    )}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{step.text}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* --- Вопросы --- */}
        <section className="mx-auto max-w-3xl py-10 sm:py-14">
          <SectionTitle>Частые вопросы</SectionTitle>
          <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-white">
            {FAQ.map((item) => (
              <details key={item.q} className="group px-5 py-4 sm:px-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown size={18} className="shrink-0 text-ink/40 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
