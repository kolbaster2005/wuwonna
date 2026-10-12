// Адреса страниц на каждом языке. Язык страницы определяется только адресом:
// русский — без префикса (так остаются рабочими все уже выданные ссылки),
// немецкий и английский — под /de и /en. Названия разделов в адресе — на
// языке страницы, это тоже сигнал для поиска.
//
// Файл — чистый JS без импортов: его читают и сайт (App.jsx, ссылки через
// localPath), и scripts/prerender.mjs.
//
// Ссылки в коде строятся только через localPath(key, params, lang), никаких
// '/probniki' руками: так ссылка всегда остаётся на языке страницы.

export const LANGS = ['ru', 'de', 'en']
export const DEFAULT_LANG = 'ru'

// Языки, для которых включены адреса на сайте.
export const ENABLED_LANGS = LANGS

// indexed — открыта ли страница для поисковиков (sitemap, пререндер).
export const ROUTES = {
  home: { ru: '/', de: '/de', en: '/en', indexed: true },
  tests: { ru: '/probniki', de: '/de/probetests', en: '/en/practice-tests', indexed: true },
  test: { ru: '/probniki/:slug', de: '/de/probetests/:slug', en: '/en/practice-tests/:slug', indexed: true },
  testExam: {
    ru: '/probniki/:slug/exam',
    de: '/de/probetests/:slug/pruefung',
    en: '/en/practice-tests/:slug/exam',
    indexed: false,
  },
  examInfo: { ru: '/exam-info', de: '/de/aufnahmepruefung', en: '/en/entrance-exam', indexed: true },
  admissionGuide: { ru: '/postuplenie-v-wu', de: '/de/aufnahme-wu-wien', en: '/en/how-to-get-into-wu', indexed: true },
  about: { ru: '/about', de: '/de/ueber-uns', en: '/en/about', indexed: true },
  pro: { ru: '/pro', de: '/de/pro', en: '/en/pro', indexed: true },
  vocabulary: { ru: '/slovar', de: '/de/vokabeln', en: '/en/vocabulary', indexed: false },
  progress: { ru: '/progress', de: '/de/fortschritt', en: '/en/progress', indexed: false },
  login: { ru: '/login', de: '/de/login', en: '/en/login', indexed: false },
}

const PARAM = /:([a-zA-Z]+)/g

// Адрес страницы: localPath('test', { slug: 'wiso-set-1' }, 'de') ->
// '/de/probetests/wiso-set-1'. Параметры, которых нет в шаблоне адреса,
// уходят в query: localPath('tests', { tab: 'probniki' }) -> '/probniki?tab=probniki'.
export function localPath(key, params = {}, lang = DEFAULT_LANG) {
  const route = ROUTES[key]
  if (!route) throw new Error(`localPath: нет маршрута «${key}»`)
  const pattern = route[lang] ?? route[DEFAULT_LANG]
  const used = new Set()
  const path = pattern.replace(PARAM, (_, name) => {
    used.add(name)
    return encodeURIComponent(params[name] ?? '')
  })
  const query = Object.entries(params)
    .filter(([name, value]) => !used.has(name) && value != null && value !== '')
    .map(([name, value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
    .join('&')
  return query ? `${path}?${query}` : path
}

// Язык по адресу: '/de/probetests' -> 'de', '/probniki' -> 'ru'. Префикс
// языка, у которого адреса ещё не включены, не считается.
export function langFromPath(pathname = '/') {
  const prefix = pathname.match(/^\/([a-z]{2})(?:\/|$)/)?.[1]
  return prefix && prefix !== DEFAULT_LANG && ENABLED_LANGS.includes(prefix) ? prefix : DEFAULT_LANG
}

function patternRegex(pattern) {
  const source = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:([a-zA-Z]+)/g, '([^/]+)')
  return new RegExp(`^${source}/?$`)
}

const MATCHERS = Object.entries(ROUTES).flatMap(([key, route]) =>
  LANGS.map((lang) => ({
    key,
    lang,
    regex: patternRegex(route[lang]),
    names: [...route[lang].matchAll(PARAM)].map((m) => m[1]),
  })),
)

// Какой странице соответствует адрес: { key, lang, params } или null.
export function matchRoute(pathname) {
  for (const { key, lang, regex, names } of MATCHERS) {
    if (!ENABLED_LANGS.includes(lang)) continue
    const match = pathname.match(regex)
    if (match) {
      const params = Object.fromEntries(names.map((name, i) => [name, decodeURIComponent(match[i + 1])]))
      return { key, lang, params }
    }
  }
  return null
}
