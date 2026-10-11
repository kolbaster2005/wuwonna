import { Link } from 'react-router-dom'
import { Crown, Send } from 'lucide-react'

// В lucide-react 1.x брендовых иконок (YouTube и т.п.) больше нет — рисуем
// свою в том же контурном стиле, что и остальные иконки.
function YoutubeIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  )
}

// Те же разделы, что и в шапке (Header.jsx), плюс то, что в шапке спрятано
// глубже: вкладка «Основы экономики», «О проекте», PRO.
// Книга пока скрыта с сайта — её здесь тоже нет.
const columns = [
  {
    title: 'Подготовка',
    links: [
      { label: 'Пробники', to: '/probniki?tab=probniki' },
      { label: 'Основы экономики', to: '/probniki?tab=основы-экономики' },
      { label: 'Словарь', to: '/slovar' },
      { label: 'Мой прогресс', to: '/progress' },
    ],
  },
  {
    title: 'Проект',
    links: [
      { label: 'Об экзамене', to: '/exam-info' },
      { label: 'О проекте', to: '/about' },
      { label: 'PRO-доступ', to: '/pro', pro: true }, // с короной
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-10">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              {/* белая подложка — на тёмном футере тёмная «U» в логотипе иначе теряется */}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white">
                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="h-8 w-8" />
              </span>
              <span className="text-lg font-extrabold tracking-tight">
                WU <span className="text-pine-600">WONNA</span>
              </span>
            </Link>
            <p className="mt-4 max-w-[30ch] text-sm leading-relaxed text-white/60">
              Онлайн-платформа для подготовки к экзаменам в WU.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="https://t.me/wuwonna"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/80 transition-colors hover:border-white/30 hover:text-white"
                title="Telegram"
              >
                <Send size={16} strokeWidth={2} />
              </a>
              <a
                href="https://www.youtube.com/@wuwonna"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 text-white/80 transition-colors hover:border-white/30 hover:text-white"
                title="YouTube"
              >
                <YoutubeIcon size={16} />
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.pro && <Crown size={14} className="text-pine-600" />}
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-9 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} WU WONNA. Все права защищены.</span>
          <div className="flex gap-4">
            <Link to="/" className="hover:text-white/70">Политика конфиденциальности</Link>
            <Link to="/" className="hover:text-white/70">Пользовательское соглашение</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
