// Скриншоты всех страниц на телефоне и компьютере + ошибки консоли.
// Нужен запущенный dev-сервер. Запуск:
//   node scripts/screenshots.mjs <baseUrl> <папка-для-png> [набор] [имена,через,запятую]
// набор: guest (по умолчанию) — страницы для гостя; admin — админка
// (запускать против dev-сервера без Supabase, где вход не требуется);
// user — страницы вошедшего: в браузер подкладывается ПОДДЕЛЬНАЯ сессия
// Supabase и пара результатов в localStorage. Настоящий аккаунт не нужен и не
// трогается: сервер поддельный токен отклонит, и сайт возьмёт результаты из
// браузера (так он и работает, когда база недоступна).
import { chromium } from 'playwright'
import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const [baseUrl = 'http://localhost:5173', outDir = 'screenshots', set = 'guest', only = ''] = process.argv.slice(2)
mkdirSync(outDir, { recursive: true })

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
}

const GUEST_ROUTES = [
  ['home', '/'],
  ['probniki', '/probniki'],
  ['probniki-econ', '/probniki?tab=%D0%BE%D1%81%D0%BD%D0%BE%D0%B2%D1%8B-%D1%8D%D0%BA%D0%BE%D0%BD%D0%BE%D0%BC%D0%B8%D0%BA%D0%B8'],
  ['test-detail', 'FIRST_TEST'],
  ['test-exam', 'FIRST_TEST/exam'],
  ['trenirovka', '/trenirovka'],
  ['slovar', '/slovar'],
  ['progress', '/progress'],
  ['exam-info', '/exam-info'],
  ['about', '/about'],
  ['pro', '/pro'],
  ['login', '/login'],
  ['not-found', '/this-page-does-not-exist'],
]

const USER_ROUTES = [
  ['dashboard', '/'],
  ['progress-user', '/progress'],
  ['probniki-user', '/probniki?tab=%D0%BE%D1%81%D0%BD%D0%BE%D0%B2%D1%8B-%D1%8D%D0%BA%D0%BE%D0%BD%D0%BE%D0%BC%D0%B8%D0%BA%D0%B8'],
]

const ADMIN_ROUTES = [
  ['admin-tests', '/admin/probniki'],
  ['admin-test-new', '/admin/probniki/new'],
  ['admin-kniga', '/admin/kniga'],
  ['admin-categories', '/admin/categories'],
  ['admin-users', '/admin/users'],
]

const onlyNames = only ? only.split(',') : null
const routes = (set === 'admin' ? ADMIN_ROUTES : set === 'user' ? USER_ROUTES : GUEST_ROUTES).filter(([name]) => !onlyNames || onlyNames.includes(name))
const browser = await chromium.launch()
const problems = []

// Первый пробник со страницы /probniki — для страниц пробника.
async function firstTestPath(page) {
  await page.goto(`${baseUrl}/probniki`, { waitUntil: 'networkidle' })
  return page.evaluate(() => {
    const link = [...document.querySelectorAll('a[href*="/probniki/"]')].find((a) =>
      /\/probniki\/[^/?]+$/.test(a.getAttribute('href')),
    )
    return link?.getAttribute('href') ?? null
  })
}

// Поддельный вход для набора user. Сессия Supabase подкладывается в
// localStorage, а запросы к базе перехватываются: обычное чтение идёт с
// публичным anon-ключом (как у гостя), а запрос результатов (user_progress)
// получает подставленные попытки. Ничего не пишется в настоящую базу.
const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .map((line) => line.trim().match(/^([A-Z_]+)\s*=\s*(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2].trim()]),
)

async function fakeLogin(context, page) {
  const projectRef = env.VITE_SUPABASE_URL.match(/https:\/\/([^.]+)\./)[1]
  await page.goto(`${baseUrl}/probniki?tab=%D0%BE%D1%81%D0%BD%D0%BE%D0%B2%D1%8B-%D1%8D%D0%BA%D0%BE%D0%BD%D0%BE%D0%BC%D0%B8%D0%BA%D0%B8`, {
    waitUntil: 'networkidle',
  })
  // В ссылках — slug, а попытке нужен id пробника: берём его из базы.
  const slugs = await page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/probniki/"]')]
      .map((a) => a.getAttribute('href').split('/probniki/')[1])
      .filter((slug) => slug && !slug.includes('/'))
      .slice(0, 3),
  )
  const rows = await (
    await fetch(
      `${env.VITE_SUPABASE_URL.replace(/\/$/, '')}/rest/v1/practice_tests?select=id,slug&lang=eq.ru&slug=in.(${slugs.join(',')})`,
      { headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` } },
    )
  ).json()
  const ids = slugs.map((slug) => rows.find((r) => r.slug === slug)?.id ?? slug)
  const now = Date.now()
  const attempts = ids.map((id, i) => ({
    id: `fake-${i}`,
    test_id: id,
    score: [5, 2.5, 6][i],
    max_score: [8, 6, 7][i],
    questions_count: [8, 6, 7][i],
    answered_count: [8, 5, 7][i],
    duration_seconds: 600 + i * 120,
    answers: [
      { question_id: 'a', score: 1, max: 1 },
      { question_id: 'b', score: 0.5, max: 1 },
      { question_id: 'c', score: 0, max: 1 },
    ],
    completed_at: new Date(now - i * 86400000).toISOString(),
  }))

  await context.route('**/rest/v1/**', async (route) => {
    const request = route.request()
    if (request.url().includes('/rest/v1/user_progress')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(attempts) })
    }
    const headers = { ...request.headers(), authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` }
    return route.continue({ headers })
  })

  const session = {
    access_token: 'fake-token',
    refresh_token: 'fake-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(now / 1000) + 3600 * 24,
    user: { id: '00000000-0000-0000-0000-000000000001', email: 'demo.student@example.com', app_metadata: {}, user_metadata: {} },
  }
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [`sb-${projectRef}-auth-token`, JSON.stringify(session)],
  )
}

for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 })
  const page = await context.newPage()
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`[${vpName}] console: ${msg.text()}`)
  })
  page.on('pageerror', (err) => problems.push(`[${vpName}] pageerror: ${err.message}`))

  const testPath = set === 'guest' ? await firstTestPath(page) : null
  if (set === 'user') await fakeLogin(context, page)

  for (const [name, route] of routes) {
    const path = route.replace('FIRST_TEST', testPath ?? '/probniki/missing')
    try {
      await page.goto(`${baseUrl}${path}`, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(400)
      await page.screenshot({ path: join(outDir, `${name}-${vpName}.png`), fullPage: true })
      // горизонтальная прокрутка на телефоне — частая регрессия вёрстки
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      if (overflow > 1) {
        // какой элемент вылезает за край — чтобы не искать вручную
        const culprit = await page.evaluate(() => {
          const el = [...document.querySelectorAll('body *')]
            .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1)
            .filter((e) => {
              // обрезанное родителем с overflow:hidden прокрутку не создаёт
              for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) {
                if (getComputedStyle(p).overflowX !== 'visible') return false
              }
              return true
            })
            .pop()
          return el ? `<${el.tagName.toLowerCase()} class="${el.getAttribute('class')}">` : '?'
        })
        problems.push(`[${vpName}] ${name}: горизонтальная прокрутка на ${overflow}px — ${culprit}`)
      }
    } catch (err) {
      problems.push(`[${vpName}] ${name}: ${err.message.split('\n')[0]}`)
    }
  }
  await context.close()
}

await browser.close()
console.log(problems.length ? problems.join('\n') : 'Ошибок консоли и горизонтальной прокрутки нет')
