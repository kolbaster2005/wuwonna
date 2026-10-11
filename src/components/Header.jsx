import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { UserRound, Menu, X, ChevronRight, ChevronDown, ClipboardList, BookOpenCheck } from 'lucide-react'
import { useAuth } from '../lib/authContext'
import UserMenu from './UserMenu'

// «О проекте» — только в футере. «Книга» и «Режим тренировки» пока скрыты с
// сайта (маршруты отключены в App.jsx). «Админка» — в личном кабинете
// (аватарка), только админу.
//
// «Подготовка» — выпадающий пункт: две вкладки страницы /probniki. tab —
// служебное имя категории (slug в админке); если вкладки переименуют —
// поправить здесь и в Footer.jsx.
const prepItems = [
  { tab: 'probniki', label: 'Пробники', hint: 'Полные пробные экзамены', icon: ClipboardList },
  { tab: 'основы-экономики', label: 'Основы экономики', hint: 'Тесты по главам книги', icon: BookOpenCheck },
]

const navItems = [
  { to: '/', label: 'Главная', end: true },
  { group: 'Подготовка', items: prepItems },
  { to: '/slovar', label: 'Словарь' },
  { to: '/progress', label: 'Мой прогресс' },
  { to: '/exam-info', label: 'Об экзамене' },
]

const prepHref = (tab) => `/probniki?tab=${encodeURIComponent(tab)}`

// Какая вкладка «Подготовки» сейчас открыта: по ?tab=, без него — первая.
// На странице отдельного пробника (/probniki/<id>) ни одна не выделена, но
// сам пункт «Подготовка» подсвечен.
function usePrepState() {
  const { pathname, search } = useLocation()
  const inPrep = pathname.startsWith('/probniki')
  const onList = pathname === '/probniki'
  const tab = new URLSearchParams(search).get('tab') ?? prepItems[0].tab
  return { inPrep, activeTab: onList ? tab : null }
}

const pillClass = (active) =>
  `relative rounded-full px-3.5 py-1.5 text-[15px] font-semibold transition-colors ${
    active
      ? 'bg-pine-50 text-pine-700 ring-1 ring-inset ring-pine-600/35 after:absolute after:-bottom-[9px] after:left-1/2 after:h-0.5 after:w-3/5 after:-translate-x-1/2 after:rounded-full after:bg-pine-600'
      : 'text-ink/75 hover:bg-black/[0.04] hover:text-ink'
  }`

// Выпадающий пункт меню на десктопе.
function NavGroup({ label, items }) {
  const { inPrep, activeTab } = usePrepState()
  const { pathname, search } = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // закрыть: клик мимо, Esc, переход на другую страницу
  useEffect(() => {
    if (!open) return
    function onPointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])
  useEffect(() => setOpen(false), [pathname, search])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={`${pillClass(inPrep)} flex items-center gap-1`}
      >
        {label}
        <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-40 mt-3 w-64 -translate-x-1/2 rounded-2xl border border-line bg-white p-1.5 shadow-pop">
          {items.map(({ tab, label: itemLabel, hint, icon: Icon }) => {
            const active = activeTab === tab
            return (
              <Link
                key={tab}
                to={prepHref(tab)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                  active ? 'bg-pine-50' : 'hover:bg-black/[0.04]'
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pine-50 text-pine-700">
                  <Icon size={18} />
                </span>
                <span>
                  <span className={`block text-sm font-bold ${active ? 'text-pine-700' : 'text-ink'}`}>{itemLabel}</span>
                  <span className="block text-xs text-ink/50">{hint}</span>
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function useIsAlsoActive(paths = []) {
  const { pathname } = useLocation()
  return paths.some((p) => pathname.startsWith(p))
}

function NavItem({ to, label, end, alsoActiveOn }) {
  const alsoActive = useIsAlsoActive(alsoActiveOn)
  return (
    <NavLink
      to={to}
      end={end}
      // Активный пункт — светло-зелёная капсула с тонкой обводкой и короткой
      // чертой под ней (как в макете), остальные — серая капсула при наведении.
      className={({ isActive }) => pillClass(isActive || alsoActive)}
    >
      {label}
    </NavLink>
  )
}

function Logo() {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5 justify-self-start">
      <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" className="h-9 w-9 sm:h-10 sm:w-10" />
      <span className="text-lg font-extrabold tracking-tight sm:text-xl">
        WU <span className="text-pine-600">WONNA</span>
      </span>
    </Link>
  )
}

function MobileNavLink({ to, label, end, alsoActiveOn, onClick }) {
  const alsoActive = useIsAlsoActive(alsoActiveOn)
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center justify-between rounded-2xl px-4 py-4 text-xl font-extrabold tracking-tight transition-colors ${
          isActive || alsoActive ? 'bg-pine-50 text-pine-700' : 'text-ink hover:bg-black/5'
        }`
      }
    >
      {label}
      <ChevronRight size={20} className="text-ink/25" />
    </NavLink>
  )
}

// «Подготовка» в мобильном меню — подпись и две ссылки-вкладки под ней.
function MobilePrepGroup({ label, items, onClose }) {
  const { activeTab } = usePrepState()
  return (
    <div className="py-1">
      <p className="eyebrow px-4 pb-1 pt-2">{label}</p>
      {items.map(({ tab, label: itemLabel, icon: Icon }) => {
        const active = activeTab === tab
        return (
          <Link
            key={tab}
            to={prepHref(tab)}
            onClick={onClose}
            className={`flex items-center justify-between rounded-2xl px-4 py-4 text-xl font-extrabold tracking-tight transition-colors ${
              active ? 'bg-pine-50 text-pine-700' : 'text-ink hover:bg-black/5'
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon size={20} className="text-pine-600" /> {itemLabel}
            </span>
            <ChevronRight size={20} className="text-ink/25" />
          </Link>
        )
      })}
    </div>
  )
}

// Мобильное меню на весь экран поверх страницы. Рендерится порталом в body:
// у шапки есть backdrop-blur, а он делает её "контейнером" для fixed-элементов —
// без портала меню растянулось бы только на высоту шапки.
function MobileMenu({ onClose }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Меню" className="fixed inset-0 z-50 flex flex-col bg-paper lg:hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-4">
        <Logo />
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink"
          aria-label="Закрыть меню"
        >
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) =>
            item.group ? (
              <MobilePrepGroup key={item.group} label={item.group} items={item.items} onClose={onClose} />
            ) : (
              <MobileNavLink key={item.to} {...item} onClick={onClose} />
            ),
          )}
        </div>
      </nav>
    </div>,
    document.body,
  )
}

export default function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => setMobileOpen(false), [location.pathname])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      {/* С lg (1024px) — сетка из трёх колонок; уже на планшете пунктов не
          помещается, там бургер. Сетка: левая и правая одинаковой ширины (1fr),
          поэтому меню в середине стоит ровно по центру страницы, как бы ни
          отличались по ширине логотип и аватарка/«Войти». */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
        <Logo />

        <nav className="hidden items-center justify-center gap-1.5 lg:flex xl:gap-2">
          {navItems.map((item) =>
            item.group ? (
              <NavGroup key={item.group} label={item.group} items={item.items} />
            ) : (
              <NavItem key={item.to} {...item} />
            ),
          )}
        </nav>

        {/* «Войти» / аватарка с личным кабинетом — и на телефоне тоже, рядом с бургером. */}
        <div className="flex items-center gap-2 justify-self-end">
          {user ? (
            <UserMenu onSignOut={handleSignOut} />
          ) : (
            <Link
              to="/login"
              className="flex h-10 shrink-0 items-center gap-2 rounded-2xl border border-line bg-white px-3.5 text-sm font-semibold text-ink shadow-[0_4px_14px_-8px_rgba(20,23,26,0.25)] transition-colors hover:border-ink/30 sm:px-5"
            >
              <UserRound size={16} strokeWidth={2.25} />
              Войти
            </Link>
          )}

          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink lg:hidden"
            aria-label="Открыть меню"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
    </header>
  )
}
