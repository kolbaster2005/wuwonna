import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { PAGES, SITE } from '../seo/content'
import { applySeo } from '../lib/seo'

// Теги страницы по адресу: заголовок и описание открытых страниц — из
// src/seo/content.js, остальные (личные и служебные) — noindex.

// Страница пробника задаёт свои теги сама (useSeo в TestDetailPage) — у неё
// заголовок зависит от загруженного теста.
const OWN_SEO = /^\/probniki\/[^/]+$/

export function RouteSeo() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (OWN_SEO.test(pathname)) return
    const page = PAGES[pathname]
    if (page) applySeo({ ...page, path: pathname })
    // Личные и служебные страницы (вход, словарь, прогресс, тест, админка) —
    // поисковикам не нужны.
    else applySeo({ title: `${SITE.name} — подготовка к экзамену WU Wien`, noindex: true })
  }, [pathname])
  return null
}
