import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PAGES } from '../seo/content'
import { applySeo } from '../lib/seo'
import { langFromPath, matchRoute } from '../i18n/routes'
import { translate } from '../i18n/translate'

// Теги страницы по адресу: заголовок и описание открытых страниц — из
// src/seo/content.js, остальные (личные и служебные) — noindex. Здесь же —
// язык документа (<html lang>) по адресу.

export function RouteSeo() {
  const { pathname } = useLocation()
  useEffect(() => {
    const route = matchRoute(pathname)
    const lang = route?.lang ?? langFromPath(pathname)
    document.documentElement.lang = lang

    // Страница пробника задаёт свои теги сама (useSeo в TestDetailPage) — у
    // неё заголовок зависит от загруженного теста.
    if (route?.key === 'test') return
    const page = route && PAGES[lang]?.[route.key]
    if (page) applySeo({ ...page, path: pathname })
    // Личные и служебные страницы (вход, словарь, прогресс, тест, админка) —
    // поисковикам не нужны.
    else applySeo({ title: translate(lang, 'seo.privateTitle'), noindex: true })
  }, [pathname])
  return null
}
