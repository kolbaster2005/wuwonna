import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, ChevronDown, Globe, X } from 'lucide-react'
import { useI18n } from '../i18n'
import { useAlternateLinks } from '../i18n/alternates'
import { matchRoute } from '../i18n/routes'
import { translate } from '../i18n/translate'
import { useConfirm } from '../lib/confirmDialog'
import { LANGUAGE_NAMES } from '../seo/content'

// Переключатель языка: ведёт на ту же страницу на другом языке (см.
// i18n/alternates.jsx) и запоминает выбор — по нему ведём с непрефиксных
// служебных переходов (письмо Supabase). Во время теста спрашивает
// подтверждение: версия пробника на другом языке — другой тест.

export const LANG_STORAGE_KEY = 'wuwonna-lang'
const HINT_DISMISSED_KEY = 'wuwonna-lang-hint-dismissed'

export function rememberedLang() {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY)
  } catch {
    return null
  }
}

function useSwitchLanguage() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const confirm = useConfirm()

  return async (lang, to) => {
    if (matchRoute(pathname)?.key === 'testExam') {
      const ok = await confirm({
        title: t('language.switchConfirm.title'),
        message: t('language.switchConfirm.message'),
        confirmLabel: t('language.switchConfirm.confirm'),
      })
      if (!ok) return
    }
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang)
    } catch {
      // без localStorage просто не запоминаем
    }
    navigate(to)
  }
}

// Шапка, десктоп: код языка и выпадающий список названий языков.
export function LanguageSwitcher() {
  const { t, lang } = useI18n()
  const links = useAlternateLinks()
  const switchTo = useSwitchLanguage()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

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
  useEffect(() => setOpen(false), [pathname])

  return (
    <div ref={ref} className="relative hidden lg:block">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t('language.label')}
        className="flex h-10 items-center gap-1 rounded-2xl px-2.5 text-sm font-bold text-ink/70 transition-colors hover:bg-black/[0.04] hover:text-ink"
      >
        <Globe size={16} /> {lang.toUpperCase()}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className="absolute right-0 top-full z-40 mt-2 w-40 rounded-2xl border border-line bg-white p-1.5 shadow-pop">
          {links.map((link) => (
            <li key={link.lang}>
              <a
                href={link.to}
                hrefLang={link.lang}
                lang={link.lang}
                onClick={(e) => {
                  e.preventDefault()
                  setOpen(false)
                  if (link.lang !== lang) switchTo(link.lang, link.to)
                }}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                  link.lang === lang ? 'bg-pine-50 text-pine-700' : 'text-ink/75 hover:bg-black/[0.04]'
                }`}
              >
                {LANGUAGE_NAMES[link.lang]}
                {link.lang === lang && <Check size={15} />}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// Мобильное меню: строка из трёх кнопок.
export function MobileLanguageSwitcher({ onDone }) {
  const { t, lang } = useI18n()
  const links = useAlternateLinks()
  const switchTo = useSwitchLanguage()
  return (
    <div className="border-t border-line px-4 py-4">
      <p className="eyebrow mb-2">{t('language.label')}</p>
      <div className="grid grid-cols-3 gap-2">
        {links.map((link) => (
          <button
            key={link.lang}
            lang={link.lang}
            onClick={async () => {
              if (link.lang !== lang) await switchTo(link.lang, link.to)
              onDone?.()
            }}
            className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${
              link.lang === lang ? 'border-pine-600 bg-pine-50 text-pine-700' : 'border-line text-ink/70'
            }`}
          >
            {LANGUAGE_NAMES[link.lang]}
          </button>
        ))}
      </div>
    </div>
  )
}

// Футер: три ссылки с hreflang на эту же страницу на других языках.
export function FooterLanguageLinks({ className = '' }) {
  const { lang } = useI18n()
  const links = useAlternateLinks()
  const switchTo = useSwitchLanguage()
  return (
    <span className={`flex gap-3 ${className}`}>
      {links.map((link) => (
        <a
          key={link.lang}
          href={link.to}
          hrefLang={link.lang}
          lang={link.lang}
          aria-current={link.lang === lang ? 'true' : undefined}
          onClick={(e) => {
            e.preventDefault()
            if (link.lang !== lang) switchTo(link.lang, link.to)
          }}
          className={link.lang === lang ? 'font-semibold text-white/80' : 'hover:text-white/70'}
        >
          {LANGUAGE_NAMES[link.lang]}
        </a>
      ))}
    </span>
  )
}

function browserLang() {
  const code = (typeof navigator !== 'undefined' && navigator.language?.slice(0, 2).toLowerCase()) || ''
  return code === 'de' || code === 'en' ? code : null
}

// Плашка под шапкой: язык браузера — немецкий или английский, а страница на
// другом языке. Текст — на языке браузера. Никаких автоматических
// переадресаций: поисковики ходят без языка и должны видеть каждую версию.
export function LanguageHint() {
  const { lang } = useI18n()
  const links = useAlternateLinks()
  const switchTo = useSwitchLanguage()
  const target = browserLang()
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(HINT_DISMISSED_KEY) === '1'
    } catch {
      return true
    }
  })
  if (dismissed || !target || target === lang) return null
  const link = links.find((l) => l.lang === target)

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(HINT_DISMISSED_KEY, '1')
    } catch {
      // без localStorage плашка просто вернётся при следующей загрузке
    }
  }

  return (
    <div lang={target} className="border-b border-pine-100 bg-pine-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-sm sm:px-6">
        <a
          href={link.to}
          hrefLang={target}
          onClick={(e) => {
            e.preventDefault()
            switchTo(target, link.to)
          }}
          className="font-semibold text-pine-700 hover:text-pine-800"
        >
          {translate(target, 'language.hint')}
        </a>
        <button
          onClick={dismiss}
          aria-label={translate(target, 'language.dismiss')}
          title={translate(target, 'language.dismiss')}
          className="rounded-lg p-1 text-pine-700/60 hover:bg-pine-100 hover:text-pine-800"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
