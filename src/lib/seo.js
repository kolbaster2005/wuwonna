import { useEffect } from 'react'
import { SITE } from '../seo/content'

// Заголовок вкладки, описание, canonical и превью для соцсетей.
// Готовый HTML для поисковиков собирает scripts/prerender.mjs — здесь те же
// теги обновляются, пока человек ходит по сайту без перезагрузки.

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function applySeo({ title, description, path, noindex = false }) {
  document.title = title
  setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow')
  if (description) {
    setMeta('name', 'description', description)
    setMeta('property', 'og:description', description)
  }
  setMeta('property', 'og:title', title)
  if (path) {
    setCanonical(`${SITE.url}${path}`)
    setMeta('property', 'og:url', `${SITE.url}${path}`)
  }
}

export function useSeo(seo) {
  const { title, description, path, noindex } = seo ?? {}
  useEffect(() => {
    if (title) applySeo({ title, description, path, noindex })
  }, [title, description, path, noindex])
}
