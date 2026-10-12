import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { langFromPath, localPath } from './routes.js'
import { formatDate, formatNumber, translate, translateError } from './translate.js'

// Язык интерфейса — из адреса страницы, отдельного состояния нет: адрес —
// единственный источник правды.
//
//   const { t, lang, path } = useI18n()
//   t('testCard.start')                         -> 'Начать тест'
//   t('result.score', { score: 18, max: 26 })   -> '18 из 26 баллов'
//   path('test', { slug })                      -> ссылка на текущем языке

export function useLang() {
  const { pathname } = useLocation()
  return langFromPath(pathname)
}

export function useI18n() {
  const lang = useLang()
  return useMemo(
    () => ({
      lang,
      t: (key, params) => translate(lang, key, params),
      path: (key, params) => localPath(key, params, lang),
      errorText: (error) => translateError(lang, error),
      formatDate: (value, options) => formatDate(value, options, lang),
      formatNumber: (value, options) => formatNumber(value, options, lang),
    }),
    [lang],
  )
}

export function useT() {
  return useI18n().t
}

export { formatDate, formatNumber, translate, translateError }
