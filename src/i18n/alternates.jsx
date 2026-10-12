import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { LANGS, localPath, matchRoute } from './routes.js'

// Адрес той же страницы на других языках — для переключателя языка, футера
// и плашки-подсказки.
//
// Обычная страница: тот же ключ маршрута и те же параметры + те же query
// (?tab=). Страница пробника сама сообщает адреса своих языковых версий
// (useTestAlternates): у версии на другом языке свой слаг, а если версии нет
// — ведём на список пробников на том языке.

const AlternatesContext = createContext(null)

export function AlternatesProvider({ children }) {
  const { pathname } = useLocation()
  const [override, setOverride] = useState(null) // { pathname, paths: { [lang]: path } }
  const value = useMemo(
    () => ({ override: override?.pathname === pathname ? override.paths : null, setOverride }),
    [override, pathname],
  )
  return <AlternatesContext.Provider value={value}>{children}</AlternatesContext.Provider>
}

// [{ lang, to }] для всех языков, включая текущий.
export function useAlternateLinks() {
  const { pathname, search } = useLocation()
  const { override } = useContext(AlternatesContext)
  const route = matchRoute(pathname)
  return LANGS.map((lang) => {
    if (override?.[lang]) return { lang, to: override[lang] }
    if (!route) return { lang, to: localPath('home', {}, lang) }
    if (route.key.startsWith('test') && route.key !== 'tests') return { lang, to: localPath('tests', {}, lang) }
    return { lang, to: `${localPath(route.key, route.params, lang)}${search}` }
  })
}

// Страница пробника: versions — [{ lang, slug, id }] (fetchTestVersions),
// build — (version, lang) => адрес версии на её языке (функция вне
// компонента, например testPath).
export function useTestAlternates(versions, build) {
  const { pathname } = useLocation()
  const { setOverride } = useContext(AlternatesContext)
  useEffect(() => {
    if (!versions?.length) return
    const paths = Object.fromEntries(versions.map((v) => [v.lang, build(v, v.lang)]))
    setOverride({ pathname, paths })
  }, [versions, pathname, setOverride, build])
}
