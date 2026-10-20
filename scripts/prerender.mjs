// Готовый HTML для поисковиков и ИИ-ассистентов. Запускается после
// `vite build` (npm run build).
//
// Зачем: сайт рисуется JavaScript'ом, а в собранном index.html — пустой
// <div id="root">. Боты нейросетей (ChatGPT, Perplexity, Claude…) JavaScript
// обычно не выполняют и видят пустую страницу. А GitHub Pages открывает
// внутренние адреса (/exam-info…) через 404.html — с кодом ответа 404, и
// Google такие страницы не индексирует.
//
// Что делает: для каждой открытой страницы на каждом языке (RU / DE / EN,
// адреса — src/i18n/routes.js) кладёт отдельный файл (dist/exam-info.html,
// dist/de/aufnahmepruefung.html, dist/probniki/<slug>.html… — GitHub Pages
// отдаёт /exam-info из exam-info.html с кодом 200) с её заголовком,
// описанием, hreflang-ссылками на версии на других языках, разметкой
// schema.org и текстом страницы внутри #root. Когда загружается JavaScript,
// React заменяет этот текст обычным интерфейсом. Плюс sitemap.xml и robots.txt.
//
// Тексты — из src/seo/content.js и словарей src/i18n (те же, что на сайте),
// пробники — из базы Supabase (публичный anon-ключ из .env или из секретов
// GitHub Actions). Каждая языковая версия пробника — своя страница.
// Если база недоступна, страницы пробников просто не создаются, сборка не падает.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ABOUT,
  DISCLAIMER,
  EXAM_FAQ,
  EXAM_INFO,
  EXAM_PARTS,
  EXAM_STATS_2026,
  ADMISSION_GUIDE,
  LANGUAGE_NAMES,
  OFFICIAL_WU_URL,
  OG_LOCALES,
  PAGES,
  REGISTRATION_STEPS,
  SITE,
  SITE_SUMMARY,
  freeProbnikPath,
  inLang,
  testExamPath,
  testPath,
  testSeo,
} from '../src/seo/content.js'
import { LANGS, localPath } from '../src/i18n/routes.js'
import { translate } from '../src/i18n/translate.js'
import { localizeSections } from '../src/lib/progress.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const template = readFileSync(resolve(dist, 'index.html'), 'utf8')

// --- окружение: .env локально, переменные окружения в GitHub Actions ---

function readEnv() {
  const env = { ...process.env }
  const file = resolve(root, '.env')
  if (existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (match && !env[match[1]]) env[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
  }
  return env
}

async function fetchTests() {
  const env = readEnv()
  const url = env.VITE_SUPABASE_URL?.replace(/\/$/, '')
  const key = env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.warn('prerender: Supabase не настроен — страницы пробников не создаются')
    return []
  }
  const base = 'id,title,description,long_description,section,duration_minutes,year,is_pro'
  const request = (columns) =>
    fetch(`${url}/rest/v1/practice_tests?select=${columns}&order=sort_order`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
  try {
    const languages = `${base},lang,translation_group,slug,seo_title,seo_description`
    let response = await request(`${languages},is_hidden`)
    // Колонки ещё нет (add-test-visibility.sql) — без неё; нет и языковых
    // (add-languages.sql) — всё русское.
    if (response.status === 400) response = await request(languages)
    if (response.status === 400) response = await request(base)
    if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)
    return (await response.json())
      .filter((t) => !t.is_hidden) // скрытые — только в админке
      .map((t) => ({ ...t, lang: t.lang ?? 'ru', translation_group: t.translation_group ?? t.id }))
  } catch (error) {
    console.warn('prerender: не получилось загрузить пробники —', error.message)
    return []
  }
}

// --- HTML ---

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// Простейший markdown из описаний пробников: **жирный** и абзацы.
const paragraphs = (text) =>
  String(text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</p>`)
    .join('\n')

const link = (href, text, attrs = '') => `<a href="${esc(href)}"${attrs}>${esc(text)}</a>`

// Строка словаря без разметки (**…** и переносы строк заголовка).
const plain = (text) => String(text).replace(/\*\*/g, '').replace(/\s*\n\s*/g, ' ')

// Шапка — на языке страницы, ссылки на её языке. Выбора языка в шапке нет
// (как на сайте) — ссылки на немецкую и английскую версии в футере.
function nav(lang) {
  const t = (key) => translate(lang, key)
  const items = [
    link(localPath('tests', {}, lang), t('header.prep.tests')),
    link(localPath('examInfo', {}, lang), t('header.nav.examInfo')),
    link(localPath('admissionGuide', {}, lang), t('footer.admissionGuide')),
    link(localPath('about', {}, lang), t('footer.about')),
    link(localPath('pro', {}, lang), 'PRO'),
  ]
  return `<header class="mx-auto max-w-6xl px-4 py-4 sm:px-6">
<nav aria-label="${esc(t('header.menu'))}"><strong>${link(localPath('home', {}, lang), SITE.name)}</strong> ·
${items.join(' · ')}</nav>
</header>`
}

// Языки в футере — как на сайте (FOOTER_LANGS в LanguageSwitcher.jsx): только
// немецкий и английский.
const FOOTER_LANGS = ['de', 'en']

// В футере — описание проекта, ссылки на немецкую и английскую версии этой
// страницы (hreflang) и отказ от связи с WU на языке страницы.
function footer(lang, alternates) {
  const languages = alternates
    .filter((a) => FOOTER_LANGS.includes(a.lang) && a.lang !== lang)
    .map((a) => link(a.path, LANGUAGE_NAMES[a.lang], ` hreflang="${a.lang}" lang="${a.lang}"`))
  return `<footer class="mx-auto max-w-6xl px-4 py-8 text-sm sm:px-6">
<p>${esc(inLang(SITE_SUMMARY, lang))}</p>
<p>${link(SITE.youtube, 'YouTube @wuwonna')} · ${link(SITE.telegram, 'Telegram @wuwonna')}</p>
${languages.length ? `<p>${languages.join(' · ')}</p>` : ''}
<p>${esc(inLang(DISCLAIMER, lang))}</p>
</footer>`
}

function page(body, lang, alternates) {
  return `${nav(lang)}\n<main class="page">\n${body}\n</main>\n${footer(lang, alternates)}`
}

// --- schema.org ---

const ORG_ID = `${SITE.url}/#organization`
const SITE_ID = `${SITE.url}/#website`

// Organization и WebSite — общие, описание — на языке страницы.
function baseGraph(lang) {
  return [
    {
      '@type': 'Organization',
      '@id': ORG_ID,
      name: SITE.name,
      alternateName: SITE.alternateNames,
      url: SITE.url,
      logo: `${SITE.url}${SITE.logo}`,
      description: inLang(SITE_SUMMARY, lang),
      // Прямо говорим поисковикам и нейросетям: это не университет.
      disambiguatingDescription: inLang(DISCLAIMER, lang),
      knowsAbout: ['WiSo Aufnahmeprüfung', 'WU Wien Aufnahmeverfahren', 'Wirtschaftsuniversität Wien'],
      areaServed: 'AT',
      sameAs: [SITE.youtube, SITE.telegram],
    },
    {
      '@type': 'WebSite',
      '@id': SITE_ID,
      url: SITE.url,
      name: SITE.name,
      alternateName: SITE.alternateNames,
      inLanguage: LANGS,
      publisher: { '@id': ORG_ID },
    },
  ]
}

function jsonLd(lang, extra) {
  const data = { '@context': 'https://schema.org', '@graph': [...baseGraph(lang), ...extra] }
  // </script> внутри JSON сломал бы страницу
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`
}

function breadcrumbs(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: `${SITE.url}${path}`,
    })),
  }
}

function faqPage(faq, lang) {
  return {
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }
}

// --- сборка одной страницы ---

// hreflang-версии страницы (адрес → список языков) — и для <head>, и для sitemap.
const alternatesByUrl = new Map()

// Версии страницы на языках: [{ lang, path }] + x-default — английская, а
// если её нет — русская.
function withDefault(versions) {
  const fallback = versions.find((v) => v.lang === 'en') ?? versions.find((v) => v.lang === 'ru') ?? versions[0]
  return [...versions, { lang: 'x-default', path: fallback.path }]
}

// Готовые страницы (адрес -> HTML) — файлы пишутся в конце (writePages).
const pages = new Map()

// Адрес /exam-info -> exam-info.html. Если у адреса есть и вложенные
// страницы (/de и /de/probetests, /probniki и /probniki/<slug>), файл
// кладётся ещё и как de/index.html — какой бы вариант ни выбрал GitHub
// Pages, ответ будет с кодом 200.
function writePages() {
  const paths = [...pages.keys()]
  for (const [path, html] of pages) {
    const files = path === '/' ? ['index.html'] : [`${path.slice(1)}.html`]
    if (path !== '/' && paths.some((other) => other.startsWith(`${path}/`))) files.push(`${path.slice(1)}/index.html`)
    for (const file of files) {
      const target = resolve(dist, file)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, html)
    }
  }
}

function render({ path, title, description, body, schema = [], lang, alternates }) {
  const url = `${SITE.url}${path}`
  alternatesByUrl.set(url, alternates)
  const otherLocales = alternates
    .filter((a) => a.lang !== lang && a.lang !== 'x-default')
    .map((a) => `<meta property="og:locale:alternate" content="${OG_LOCALES[a.lang]}" />`)
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    ...otherLocales,
    ...alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${esc(SITE.url + a.path)}" />`),
    jsonLd(lang, [
      { '@type': 'WebPage', '@id': url, url, name: title, description, inLanguage: lang, isPartOf: { '@id': SITE_ID } },
      ...schema,
    ]),
  ].join('\n    ')

  const html = template
    .replace(/<!-- seo:start[\s\S]*?<!-- seo:end -->/, head)
    .replace('<html lang="ru">', `<html lang="${lang}">`)
    .replace('<meta property="og:locale" content="ru_RU" />', `<meta property="og:locale" content="${OG_LOCALES[lang]}" />`)
    .replace('<div id="root"></div>', `<div id="root">${page(body, lang, alternates)}</div>`)
  if (html === template) throw new Error('prerender: в index.html не найдены метки seo:start/seo:end или #root')

  pages.set(path, html)
  return url
}

// Старый адрес → новый. На GitHub Pages нет настоящих редиректов (301),
// поэтому — мгновенный meta refresh + canonical: Google понимает это как
// постоянный переезд. В sitemap такие адреса не попадают.
function writeRedirect(fromPath, toPath, lang) {
  const url = `${SITE.url}${toPath}`
  const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<title>WU WONNA</title>
<link rel="canonical" href="${esc(url)}" />
<meta name="robots" content="noindex, follow" />
<meta http-equiv="refresh" content="0; url=${esc(toPath)}" />
</head>
<body><p>${link(toPath, url)}</p></body>
</html>
`
  const target = resolve(dist, `${fromPath.slice(1)}.html`)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, html)
}

// --- пробники по языкам ---

// Версии одной группы переводов.
function groupsOf(tests) {
  const groups = new Map()
  tests.forEach((t) => groups.set(t.translation_group, [...(groups.get(t.translation_group) ?? []), t]))
  return groups
}

// Как на сайте (pickVersions в lib/data.js): версия на языке страницы или
// русская — она помечается is_fallback. Порядок — как в базе (sort_order).
function shownTests(tests, lang) {
  return [...groupsOf(tests).values()]
    .map((versions) => {
      const own = versions.find((t) => t.lang === lang)
      if (own) return own
      const ru = versions.find((t) => t.lang === 'ru')
      return ru ? { ...ru, is_fallback: lang !== 'ru' } : null
    })
    .filter(Boolean)
}

// Ссылка на пробник в списке: перевода нет — на русскую страницу (страница
// /de/probetests/<русский slug> закрыта от поиска).
function testList(tests, lang) {
  const fallbackNote = ` (${translate(lang, 'testCard.fallback')})`
  return `<ul>\n${tests
    .map(
      (t) =>
        `<li>${link(testPath(t), t.title, t.is_fallback ? ' hreflang="ru"' : '')}${t.is_fallback ? esc(fallbackNote) : ''}${t.description ? ` — ${esc(plain(t.description))}` : ''}</li>`,
    )
    .join('\n')}\n</ul>`
}

function groupByChapter(tests) {
  const chapters = new Map()
  tests.filter((t) => t.section).forEach((t) => chapters.set(t.section, [...(chapters.get(t.section) ?? []), t]))
  return [...chapters]
}

// --- страницы ---

// Страница по ключу маршрута на всех языках, связанных hreflang.
function routeAlternates(key) {
  return withDefault(LANGS.map((lang) => ({ lang, path: localPath(key, {}, lang) })))
}

function homeBody(lang, exams) {
  const t = (key, params) => translate(lang, key, params)
  return `<h1 class="h-page">${esc(plain(t('home.title')))}</h1>
<p class="lead">${esc(t('home.lead'))}</p>
<p>${esc(inLang(SITE_SUMMARY, lang))}</p>
<h2 class="h-section">${esc(t('home.howItWorks'))}</h2>
<ol>${['take', 'review', 'improve'].map((id) => `<li><strong>${esc(t(`home.steps.${id}.title`))}</strong> — ${esc(t(`home.steps.${id}.text`))}</li>`).join('')}</ol>
${exams.length ? `<h2 class="h-section">${esc(t('header.prep.tests'))}</h2>\n${testList(exams, lang)}` : ''}
<p>${link(localPath('tests', {}, lang), t('home.toTests'))} · ${link(localPath('examInfo', {}, lang), t('home.examInfo'))} · ${link(localPath('admissionGuide', {}, lang), t('home.admissionGuide'))}</p>`
}

function testsBody(lang, exams, chapters) {
  const t = (key) => translate(lang, key)
  return `<h1 class="h-page">${esc(t('tests.title'))}</h1>
<p class="lead">${esc(PAGES[lang].tests.description)}</p>
${exams.length ? `<h2 class="h-section">${esc(t('header.prep.testsHint'))}</h2>\n${testList(exams, lang)}` : ''}
${chapters.length ? `<h2 class="h-section">${esc(t('header.prep.economics'))} — ${esc(t('header.prep.economicsHint'))}</h2>` : ''}
${chapters.map(([title, list]) => `<h3>${esc(title)}</h3>\n${testList(list, lang)}`).join('\n')}`
}

// Строка из content.js: **жирный** и [ссылка на официальный сайт WU].
function contentHtml(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]/g, (_, label) => `<a href="${esc(OFFICIAL_WU_URL)}">${label}</a>`)
}

// «Об экзамене» — те же тексты, что на странице (EXAM_INFO и др.), все
// вкладки подряд.
function examInfoBody(lang) {
  const info = EXAM_INFO[lang]
  return `<h1 class="h-page">${esc(info.h1)}</h1>
<p class="lead">${esc(info.subtitle)}</p>
<h2 class="h-section">${esc(info.summaryHeading)}</h2>
<ul>${info.facts.map((fact) => `<li>${contentHtml(fact)}</li>`).join('')}</ul>
<h2 class="h-section">${esc(info.howItGoesHeading)}</h2>
${paragraphs(info.howItGoes)}
<h2 class="h-section">${esc(info.registrationHeading)}</h2>
${info.registration.map((p) => `<p>${contentHtml(p)}</p>`).join('\n')}
<h2 class="h-section">${esc(info.partsHeading)}</h2>
${EXAM_PARTS[lang].map((p) => `<h3>${esc(p.number)}. ${esc(p.title)}</h3>\n<p>${esc(p.description)}</p>`).join('\n')}
<h2 class="h-section">${esc(info.statsHeading)}</h2>
<ul>${['passingScore', 'places', 'participants'].map((id) => `<li>${esc(info.stats[id])}: ${esc(EXAM_STATS_2026[id])}</li>`).join('')}</ul>
<h2 class="h-section">${esc(info.tabs.registration)}</h2>
<p>${contentHtml(info.registrationIntro)}</p>
<ol>
${REGISTRATION_STEPS[lang].map((s) => `<li><strong>${esc(s.title)}</strong><ul>${s.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></li>`).join('\n')}
</ol>
<h2 class="h-section">${esc(info.faqHeading)}</h2>
${EXAM_FAQ[lang].map((f) => `<h3>${esc(f.question)}</h3>\n<p>${esc(f.answer)}</p>`).join('\n')}`
}

// «О проекте» — тексты из ABOUT.
function aboutBody(lang) {
  const about = ABOUT[lang]
  return `<h1 class="h-page">${esc(about.h1)}</h1>
<h2 class="h-section">${esc(about.heading)}</h2>
${about.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('\n')}
<ul>${about.features.map((f) => `<li><strong>${esc(f.title)}</strong> — ${esc(f.description)}</li>`).join('')}</ul>
<h2 class="h-section">${esc(about.socialHeading)}</h2>
<p>${link(SITE.youtube, 'YouTube — @wuwonna')} · ${link(SITE.telegram, 'Telegram — @wuwonna')}</p>
${lang === 'ru' ? `<section lang="de"><h2 class="h-section">Über WU WONNA</h2><p>${esc(SITE_SUMMARY.de)}</p></section>` : ''}`
}

function proBody(lang, chapters) {
  const t = (key, params) => translate(lang, key, params)
  return `<h1 class="h-page">WU WONNA PRO</h1>
<p class="lead">${esc(PAGES[lang].pro.description)}</p>
<h2 class="h-section">${esc(t('pro.featuresTitle'))}</h2>
<ul>${['allTests', 'newMaterials', 'forever'].map((id) => `<li><strong>${esc(t(`pro.features.${id}.title`))}</strong> — ${esc(t(`pro.features.${id}.text`))}</li>`).join('')}</ul>
${chapters.length ? `<p>${esc(chapters.map(([title]) => title).join(', '))}</p>` : ''}
<h2 class="h-section">${esc(t('pro.faqTitle'))}</h2>
${['subscription', 'forever', 'howToGet', 'account'].map((id) => `<h3>${esc(t(`pro.faq.${id}.q`))}</h3>\n<p>${esc(plain(t(`pro.faq.${id}.a`)))}</p>`).join('\n')}`
}

// «Как поступить в WU» — тексты из ADMISSION_GUIDE.
function admissionGuideBody(lang) {
  const guide = ADMISSION_GUIDE[lang]
  const sections = guide.sections
    .map((section) => {
      const tag = section.ordered ? 'ol' : 'ul'
      return [
        `<h2 class="h-section">${esc(section.heading)}</h2>`,
        section.text ? `<p>${esc(section.text)}</p>` : '',
        section.items ? `<${tag}>${section.items.map((item) => `<li>${esc(item)}</li>`).join('')}</${tag}>` : '',
      ].join('\n')
    })
    .join('\n')
  return `<h1 class="h-page">${esc(guide.h1)}</h1>
<p class="lead">${esc(guide.lead)}</p>
<p>${link(freeProbnikPath(lang), guide.cta)} · ${link(localPath('examInfo', {}, lang), guide.more)}</p>
${sections}
<h2 class="h-section">${esc(guide.faqHeading)}</h2>
${guide.faq.map((f) => `<h3>${esc(f.question)}</h3>\n<p>${esc(f.answer)}</p>`).join('\n')}
<p>${esc(inLang(DISCLAIMER, lang))} ${link(OFFICIAL_WU_URL, guide.officialLink)}</p>`
}

function testBody(test, lang) {
  const t = (key, params) => translate(lang, key, params)
  const facts = [
    test.duration_minutes ? t('common.minutes', { count: test.duration_minutes }) : null,
    test.year ? t('testDetail.examYear', { year: test.year }) : null,
    test.is_pro ? t('testCard.proOnly') : t('testDetail.free'),
  ].filter(Boolean)
  return `<p>${link(localPath('tests', {}, lang), t('breadcrumbs.tests'))}${test.section ? ` · ${esc(test.section)}` : ''}</p>
<h1 class="h-page">${esc(test.title)}</h1>
${paragraphs(test.long_description || test.description)}
<ul>${facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
<p>${link(testExamPath(test), t('testCard.start'))}</p>`
}

function buildPages(tests) {
  const urls = []

  for (const lang of LANGS) {
    const t = (key) => translate(lang, key)
    const shown = localizeSections(shownTests(tests, lang), (number) => translate(lang, 'progress.chapter', { number }))
    const exams = shown.filter((test) => !test.section)
    const chapters = groupByChapter(shown)
    const home = localPath('home', {}, lang)
    const crumbs = (key, name) => breadcrumbs([[SITE.name, home], [name, localPath(key, {}, lang)]])
    const common = (key) => ({ path: localPath(key, {}, lang), ...PAGES[lang][key], lang, alternates: routeAlternates(key) })

    urls.push(render({ ...common('home'), body: homeBody(lang, exams) }))
    urls.push(
      render({ ...common('tests'), body: testsBody(lang, exams, chapters), schema: [crumbs('tests', t('tests.title'))] }),
    )
    urls.push(
      render({
        ...common('examInfo'),
        body: examInfoBody(lang),
        schema: [faqPage(EXAM_FAQ[lang], lang), crumbs('examInfo', EXAM_INFO[lang].title)],
      }),
    )
    urls.push(
      render({
        ...common('admissionGuide'),
        body: admissionGuideBody(lang),
        schema: [faqPage(ADMISSION_GUIDE[lang].faq, lang), crumbs('admissionGuide', ADMISSION_GUIDE[lang].h1)],
      }),
    )
    urls.push(
      render({
        ...common('about'),
        body: aboutBody(lang),
        schema: [
          { '@type': 'AboutPage', url: `${SITE.url}${localPath('about', {}, lang)}`, about: { '@id': ORG_ID }, inLanguage: lang },
          crumbs('about', ABOUT[lang].title),
        ],
      }),
    )
    urls.push(render({ ...common('pro'), body: proBody(lang, chapters) }))
  }

  // Каждая языковая версия пробника — своя страница, связанная hreflang с
  // версиями своей группы. Страниц «русская версия на чужом языке» нет: они
  // закрыты от поиска (noindex) и рисуются только в браузере.
  for (const versions of groupsOf(tests).values()) {
    const alternates = withDefault(versions.map((v) => ({ lang: v.lang, path: testPath(v) })))
    for (const test of versions) {
      const seo = testSeo(test)
      urls.push(
        render({
          path: seo.path,
          title: seo.title,
          description: seo.description,
          lang: test.lang,
          alternates,
          body: testBody(test, test.lang),
          schema: [
            breadcrumbs([
              [SITE.name, localPath('home', {}, test.lang)],
              [translate(test.lang, 'breadcrumbs.tests'), localPath('tests', {}, test.lang)],
              [test.title, seo.path],
            ]),
          ],
        }),
      )
      // Старые ссылки /probniki/<id> — на адрес со slug (только русские версии).
      if (test.lang === 'ru' && seo.path !== testPath({ id: test.id, lang: 'ru' })) {
        writeRedirect(testPath({ id: test.id, lang: 'ru' }), seo.path, 'ru')
      }
    }
  }

  return urls
}

// --- sitemap.xml и robots.txt ---

function writeSitemap(urls) {
  const today = new Date().toISOString().slice(0, 10)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map((u) => {
    const alternates = (alternatesByUrl.get(u) ?? [])
      .map((a) => `\n    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${esc(SITE.url + a.path)}" />`)
      .join('')
    return `  <url><loc>${esc(u)}</loc><lastmod>${today}</lastmod>${alternates}</url>`
  })
  .join('\n')}
</urlset>
`
  writeFileSync(resolve(dist, 'sitemap.xml'), xml)
}

function writeRobots() {
  // Боты нейросетей перечислены явно: так видно, что им можно, — на случай,
  // если когда-нибудь появится общий запрет. Словарь, прогресс и прохождение
  // теста закрыты через noindex (RouteSeo) на всех языках.
  const aiBots = [
    'Googlebot',
    'Google-Extended',
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'PerplexityBot',
    'ClaudeBot',
    'Claude-SearchBot',
    'Bingbot',
    'YandexBot',
  ]
  const disallow = ['/admin', ...LANGS.map((lang) => localPath('login', {}, lang))].map((p) => `Disallow: ${p}`).join('\n')
  const robots = `${aiBots.map((bot) => `User-agent: ${bot}`).join('\n')}
Allow: /
${disallow}

User-agent: *
Allow: /
${disallow}

Sitemap: ${SITE.url}/sitemap.xml
`
  writeFileSync(resolve(dist, 'robots.txt'), robots)
}

const tests = await fetchTests()
const urls = buildPages(tests)
writePages()
writeSitemap(urls)
writeRobots()
console.log(`prerender: ${urls.length} страниц на ${LANGS.length} языках, sitemap.xml и robots.txt готовы`)
