import { Check } from 'lucide-react'

// Всё про предложение PRO в одном месте: цена, ссылка на покупку, пункты
// "что входит" и общий декор. Используется и в PRO-модалке (ProModal.jsx),
// и на странице /pro (ProPage.jsx) — чтобы тексты и цена не разъезжались.

// --- Тексты и ссылки (меняй здесь) ---

// PRO — разовая покупка с доступом навсегда, без подписки.
export const PRO_PRICE = '30 €'

// Оплаты на сайте пока нет — PRO выдаётся вручную во вкладке «Пользователи»
// админки. ВСЕ кнопки покупки (модалка, /pro, «Нужна PRO-версия») ведут сюда.
// Появится оплата — замени на ссылку оплаты.
export const PRO_PURCHASE_URL = 'https://t.me/wuw0nna'

// --- Декор: "лучики" по бокам от акцента, волнистое подчёркивание, маркер ---

// Три коротких штриха, сходящихся к центру. Для правой стороны зеркалится.
export function Sparks({ mirrored = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-6 w-6 shrink-0 text-pine-600 sm:h-7 sm:w-7 ${mirrored ? '-scale-x-100' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M5 5l5 3.5" />
      <path d="M3.5 12H10" />
      <path d="M5 19l5-3.5" />
    </svg>
  )
}

// Текст с зелёной волнистой линией снизу, "от руки".
export function Squiggle({ children }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      {children}
      <svg
        viewBox="0 0 100 8"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute -bottom-1.5 left-0 h-2 w-full text-pine-600/70"
      >
        <path
          d="M1 5 Q 12.5 1 25 5 T 50 5 T 75 5 T 99 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </span>
  )
}

// Подсвеченная фраза внутри пункта списка.
export function Mark({ children }) {
  return <span className="rounded-md bg-pine-100/70 px-1.5 py-0.5 font-semibold text-pine-800">{children}</span>
}

// Три коротких пункта "что даёт PRO" с галочками — для модалки и страницы.
const PERKS = [
  <>Все PRO-пробники и материалы</>,
  <>
    Новые материалы — <Mark>без доплат</Mark>
  </>,
  <>
    <Mark>Без подписки</Mark> и автопродлений
  </>,
]

export function ProPerkList({ className = '' }) {
  return (
    <ul className={`w-fit space-y-3 text-left text-[15px] font-medium text-ink/80 ${className}`}>
      {PERKS.map((perk, i) => (
        <li key={i} className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pine-50 text-pine-700">
            <Check size={14} strokeWidth={3} />
          </span>
          <span>{perk}</span>
        </li>
      ))}
    </ul>
  )
}

// Крупная цена на светло-зелёной подложке с лучиками по бокам.
export function ProPriceTag() {
  return (
    <div className="flex items-center justify-center gap-3">
      <Sparks />
      <span className="relative inline-block px-6 sm:px-7">
        <span aria-hidden="true" className="absolute inset-x-0 inset-y-1 -rotate-2 rounded-[1.25rem] bg-pine-50" />
        <span className="relative text-5xl font-extrabold tracking-tight sm:text-6xl">{PRO_PRICE}</span>
      </span>
      <Sparks mirrored />
    </div>
  )
}

// Заголовок "Полный доступ к PRO / навсегда" с плашкой и лучиками.
// align="left" — для страницы /pro, где заголовок стоит в левой колонке.
export function ProForeverTitle({ id, as: Tag = 'h2', align = 'center', className = '' }) {
  return (
    <Tag id={id} className={`text-[28px] font-extrabold leading-tight tracking-tight sm:text-4xl ${className}`}>
      Полный доступ к PRO
      <span className={`mt-2 flex items-center gap-2 sm:gap-3 ${align === 'left' ? 'justify-start' : 'justify-center'}`}>
        <Sparks />
        <span className="rounded-full bg-pine-600 px-5 pb-1.5 pt-1 text-white sm:px-6">навсегда</span>
        <Sparks mirrored />
      </span>
    </Tag>
  )
}
