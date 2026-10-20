import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useI18n } from '../i18n'
import { useAlternateLinks } from '../i18n/alternates'
import { matchRoute } from '../i18n/routes'
import { translate } from '../i18n/translate'
import { useConfirm } from '../lib/confirmDialog'
import { LANGUAGE_NAMES } from '../seo/content'

// Ссылки на языки — только в футере и только немецкий и английский (выбора
// языка в шапке нет, русский как «язык» не предлагается: русская версия —
// основная, без префикса). Ведут на ту же страницу на другом языке (см.
// i18n/alternates.jsx) и запоминают выбор — по нему ведём с непрефиксных
// служебных переходов (письмо Supabase). Во время теста спрашивают
// подтверждение: версия пробника на другом языке — другой тест.

// Языки, которые показываются ссылками в футере.
const FOOTER_LANGS = ['de', 'en']

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

// Футер: «Deutsch» и «English» с hreflang — эта же страница на этих языках.
export function FooterLanguageLinks({ className = '' }) {
  const { lang } = useI18n()
  const links = useAlternateLinks().filter((link) => FOOTER_LANGS.includes(link.lang))
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
          className="p-1 text-pine-700/60 hover:bg-pine-100 hover:text-pine-800"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}
