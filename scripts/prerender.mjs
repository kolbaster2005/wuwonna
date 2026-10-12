// Готовый HTML для поисковиков и ИИ-ассистентов. Запускается после
// `vite build` (npm run build).
//
// Зачем: сайт рисуется JavaScript'ом, а в собранном index.html — пустой
// <div id="root">. Боты нейросетей (ChatGPT, Perplexity, Claude…) JavaScript
// обычно не выполняют и видят пустую страницу. А GitHub Pages открывает
// внутренние адреса (/exam-info…) через 404.html — с кодом ответа 404, и
// Google такие страницы не индексирует.
//
// Что делает: для каждой открытой страницы кладёт отдельный файл
// (dist/exam-info.html, dist/probniki/<id>.html… — GitHub Pages отдаёт
// /exam-info из exam-info.html с кодом 200) с её заголовком, описанием,
// разметкой schema.org и текстом страницы внутри #root. Когда загружается
// JavaScript, React заменяет этот текст обычным интерфейсом. Плюс
// sitemap.xml и robots.txt.
//
// Тексты — из src/seo/content.js (те же, что на сайте), пробники — из базы
// Supabase (публичный anon-ключ из .env или из секретов GitHub Actions).
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
  FREE_PROBNIK_PATH,
  LANDINGS,
  LANDING_ALTERNATES,
  LANGUAGE_NAMES,
  OFFICIAL_WU_URL,
  OG_LOCALES,
  PAGES,
  REGISTRATION_STEPS,
  SITE,
  SITE_SUMMARY,
  testPath,
  testSeo,
} from '../src/seo/content.js'

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
  try {
    const response = await fetch(
      `${url}/rest/v1/practice_tests?select=id,title,description,long_description,section,duration_minutes,year,is_pro&order=sort_order`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    )
    if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)
    return await response.json()
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

const link = (href, text) => `<a href="${esc(href)}">${esc(text)}</a>`

const NAV = `<header class="mx-auto max-w-6xl px-4 py-4 sm:px-6">
<nav aria-label="Навигация"><strong>${link('/', SITE.name)}</strong> ·
${link('/probniki', 'Пробники')} · ${link('/exam-info', 'Об экзамене')} · ${link('/postuplenie-v-wu', 'Как поступить в WU')} · ${link('/about', 'О проекте')} · ${link('/pro', 'PRO')} ·
<a href="/de" hreflang="de">Deutsch</a> · <a href="/en" hreflang="en">English</a></nav>
</header>`

// В футере — описание проекта и отказ от связи с WU на языке страницы.
function footer(lang) {
  return `<footer class="mx-auto max-w-6xl px-4 py-8 text-sm sm:px-6">
<p>${esc(lang === 'ru' ? SITE_SUMMARY.ru : SITE_SUMMARY.de)}</p>
<p>${link(SITE.youtube, 'YouTube @wuwonna')} · ${link(SITE.telegram, 'Telegram @wuwonna')}</p>
<p>${esc(DISCLAIMER[lang])}</p>
</footer>`
}

function page(body, lang = 'ru') {
  return `${NAV}\n<main class="page" lang="${lang}">\n${body}\n</main>\n${footer(lang)}`
}

// --- schema.org ---

const ORG_ID = `${SITE.url}/#organization`
const SITE_ID = `${SITE.url}/#website`

const baseGraph = [
  {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    alternateName: SITE.alternateNames,
    url: SITE.url,
    logo: `${SITE.url}${SITE.logo}`,
    description: SITE_SUMMARY.ru,
    // Прямо говорим поисковикам и нейросетям: это не университет.
    disambiguatingDescription: DISCLAIMER.en,
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
    inLanguage: ['ru', 'de', 'en'],
    publisher: { '@id': ORG_ID },
  },
]

function jsonLd(extra = []) {
  const data = { '@context': 'https://schema.org', '@graph': [...baseGraph, ...extra] }
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

// --- сборка одной страницы ---

// hreflang-версии страницы (адрес → список языков) — и для <head>, и для sitemap.
const alternatesByUrl = new Map()

function render({ path, title, description, body, schema = [], lang = 'ru', locale = OG_LOCALES.ru, alternates = [] }) {
  const url = `${SITE.url}${path}`
  if (alternates.length) alternatesByUrl.set(url, alternates)
  const head = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    ...alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${esc(SITE.url + a.path)}" />`),
    jsonLd(schema),
  ].join('\n    ')

  const html = template
    .replace(/<!-- seo:start[\s\S]*?<!-- seo:end -->/, head)
    .replace('<html lang="ru">', `<html lang="${lang}">`)
    .replace('<meta property="og:locale" content="ru_RU" />', `<meta property="og:locale" content="${locale}" />`)
    .replace('<div id="root"></div>', `<div id="root">${page(body, lang)}</div>`)
  if (html === template) throw new Error('prerender: в index.html не найдены метки seo:start/seo:end или #root')

  const file = path === '/' ? 'index.html' : `${path.slice(1)}.html`
  const target = resolve(dist, file)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, html)
  return url
}

// Старый адрес → новый. На GitHub Pages нет настоящих редиректов (301),
// поэтому — мгновенный meta refresh + canonical: Google понимает это как
// постоянный переезд. В sitemap такие адреса не попадают.
function writeRedirect(fromPath, toPath) {
  const url = `${SITE.url}${toPath}`
  const html = `<!doctype html>
<html lang="ru">
<head>
<meta charset="UTF-8" />
<title>WU WONNA</title>
<link rel="canonical" href="${esc(url)}" />
<meta name="robots" content="noindex, follow" />
<meta http-equiv="refresh" content="0; url=${esc(toPath)}" />
</head>
<body><p>Страница переехала: ${link(toPath, url)}</p></body>
</html>
`
  const target = resolve(dist, `${fromPath.slice(1)}.html`)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, html)
}

// --- страницы ---

function testList(tests) {
  return `<ul>\n${tests
    .map((t) => `<li>${link(testPath(t), t.title)}${t.description ? ` — ${esc(t.description)}` : ''}</li>`)
    .join('\n')}\n</ul>`
}

function groupByChapter(tests) {
  const chapters = new Map()
  tests.filter((t) => t.section).forEach((t) => chapters.set(t.section, [...(chapters.get(t.section) ?? []), t]))
  return [...chapters]
}

function buildPages(tests) {
  const exams = tests.filter((t) => !t.section)
  const chapters = groupByChapter(tests)
  const urls = []

  urls.push(
    render({
      path: '/',
      ...PAGES.ru.home,
      body: `<h1 class="h-page">Подготовка к экзамену WU Wien — WiSo Aufnahmeprüfung</h1>
<p class="lead">${esc(SITE_SUMMARY.ru)}</p>
<h2 class="h-section">Что есть на платформе</h2>
<ul>
<li>Пробники в формате реального экзамена — с таймером, частичными баллами и разбором каждого ответа.</li>
<li>Тесты по каждой подглаве официальной книги WU — от главы 1 до главы 4.</li>
<li>Перевод незнакомых слов прямо в задании и личный словарь.</li>
<li>Прогресс по главам: видно, что уже освоено и что стоит повторить.</li>
</ul>
${exams.length ? `<h2 class="h-section">Пробники</h2>\n${testList(exams)}` : ''}
<p>${link('/probniki', 'Все пробники')} · ${link('/exam-info', 'Всё об экзамене WU')}</p>`,
    }),
  )

  urls.push(
    render({
      path: '/probniki',
      ...PAGES.ru.tests,
      body: `<h1 class="h-page">Пробники к экзамену WU Wien (WiSo Aufnahmeprüfung)</h1>
<p class="lead">${esc(PAGES.ru.tests.description)}</p>
${exams.length ? `<h2 class="h-section">Пробники в формате экзамена</h2>\n${testList(exams)}` : ''}
${chapters.length ? '<h2 class="h-section">Основы экономики — тесты по главам книги WU</h2>' : ''}
${chapters.map(([title, list]) => `<h3>${esc(title)}</h3>\n${testList(list)}`).join('\n')}`,
      schema: [breadcrumbs([['WU WONNA', '/'], ['Пробники', '/probniki']])],
    }),
  )

  for (const test of tests) {
    const seo = testSeo(test)
    const facts = [
      test.duration_minutes ? `Время: ${test.duration_minutes} мин` : null,
      test.year ? `Год: ${test.year}` : null,
      test.is_pro ? 'Доступ: PRO' : 'Доступ: бесплатно',
    ].filter(Boolean)
    urls.push(
      render({
        ...seo,
        body: `<p>${link('/probniki', 'Пробники')}${test.section ? ` · ${esc(test.section)}` : ''}</p>
<h1 class="h-page">${esc(test.title)}</h1>
${paragraphs(test.long_description || test.description)}
<ul>${facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
<p>${link(`${seo.path}/exam`, 'Пройти пробник онлайн')}</p>`,
        schema: [
          breadcrumbs([
            ['WU WONNA', '/'],
            ['Пробники', '/probniki'],
            [test.title, seo.path],
          ]),
        ],
      }),
    )
    if (seo.path !== `/probniki/${test.id}`) writeRedirect(`/probniki/${test.id}`, seo.path)
  }

  urls.push(
    render({
      path: '/exam-info',
      ...PAGES.ru.examInfo,
      body: examInfoBody('ru'),
      schema: [
        {
          '@type': 'FAQPage',
          mainEntity: EXAM_FAQ.ru.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer },
          })),
        },
        breadcrumbs([['WU WONNA', '/'], ['Об экзамене', '/exam-info']]),
      ],
    }),
  )

  urls.push(
    render({
      path: '/about',
      ...PAGES.ru.about,
      body: `${aboutBody('ru')}
<section lang="de"><h2 class="h-section">Über WU WONNA</h2><p>${esc(SITE_SUMMARY.de)}</p></section>`,
      schema: [
        { '@type': 'AboutPage', url: `${SITE.url}/about`, about: { '@id': ORG_ID }, inLanguage: 'ru' },
        breadcrumbs([['WU WONNA', '/'], ['О проекте', '/about']]),
      ],
    }),
  )

  urls.push(
    render({
      path: '/pro',
      ...PAGES.ru.pro,
      body: `<h1 class="h-page">WU WONNA PRO</h1>
<p class="lead">${esc(PAGES.ru.pro.description)}</p>
${chapters.length ? `<p>В PRO входят тесты по всем главам книги WU: ${chapters.map(([t]) => esc(t)).join(', ')}.</p>` : ''}`,
    }),
  )

  for (const [path, landing] of Object.entries(LANDINGS)) urls.push(renderLanding(path, landing))

  return urls
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
<p>${link(SITE.youtube, 'YouTube — @wuwonna')} · ${link(SITE.telegram, 'Telegram — @wuwonna')}</p>`
}

// Посадочная страница на своём языке (RU/DE/EN) — тексты из LANDINGS.
function renderLanding(path, landing) {
  const { lang } = landing
  const languages = LANDING_ALTERNATES.filter((a) => a.lang !== 'x-default')
    .map((a) => (a.lang === lang ? `<strong>${LANGUAGE_NAMES[a.lang]}</strong>` : `<a href="${a.path}" hreflang="${a.lang}">${LANGUAGE_NAMES[a.lang]}</a>`))
    .join(' · ')
  const sections = landing.sections
    .map((section) => {
      const tag = section.ordered ? 'ol' : 'ul'
      return [
        `<h2 class="h-section">${esc(section.heading)}</h2>`,
        section.text ? `<p>${esc(section.text)}</p>` : '',
        section.items ? `<${tag}>${section.items.map((item) => `<li>${esc(item)}</li>`).join('')}</${tag}>` : '',
      ].join('\n')
    })
    .join('\n')
  const faq = landing.faq.map((f) => `<h3>${esc(f.question)}</h3>\n<p>${esc(f.answer)}</p>`).join('\n')

  return render({
    path,
    title: landing.title,
    description: landing.description,
    lang,
    locale: landing.locale,
    alternates: LANDING_ALTERNATES,
    body: `<p>${languages}</p>
<h1 class="h-page">${esc(landing.h1)}</h1>
<p class="lead">${esc(landing.lead)}</p>
<p>${link(FREE_PROBNIK_PATH, landing.cta)} · ${link('/exam-info', landing.more)}</p>
${sections}
<h2 class="h-section">FAQ</h2>
${faq}
<p>${esc(DISCLAIMER[lang])} ${link(OFFICIAL_WU_URL, 'wu.ac.at')}</p>`,
    schema: [
      {
        '@type': 'FAQPage',
        inLanguage: lang,
        mainEntity: landing.faq.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
      breadcrumbs([['WU WONNA', '/'], [landing.h1, path]]),
    ],
  })
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
  // если когда-нибудь появится общий запрет.
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
  const robots = `${aiBots.map((bot) => `User-agent: ${bot}`).join('\n')}
Allow: /
Disallow: /admin
Disallow: /login

User-agent: *
Allow: /
Disallow: /admin
Disallow: /login

Sitemap: ${SITE.url}/sitemap.xml
`
  writeFileSync(resolve(dist, 'robots.txt'), robots)
}

const tests = await fetchTests()
const urls = buildPages(tests)
writeSitemap(urls)
writeRobots()
console.log(`prerender: ${urls.length} страниц, sitemap.xml и robots.txt готовы`)
