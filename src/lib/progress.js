// Расчёты для страницы «Мой прогресс» — чистые функции без React и без
// запросов, поэтому покрыты тестами (progress.test.js).
//
// Главное правило: по каждому тесту берётся ЛУЧШАЯ попытка. Пересдал тест
// лучше — прогресс вырос; пересдал хуже — прогресс не падает.

// Доля баллов попытки, 0..1.
export function attemptRatio(attempt) {
  if (!attempt.max_score) return 0
  return Math.max(0, Math.min(1, Number(attempt.score) / Number(attempt.max_score)))
}

// { [test_id]: { best, attempts, last } } — best 0..1, last — самая свежая попытка.
export function statsByTest(attempts) {
  const map = {}
  attempts.forEach((a) => {
    const entry = (map[a.test_id] ??= { best: 0, attempts: 0, last: null })
    entry.best = Math.max(entry.best, attemptRatio(a))
    entry.attempts += 1
    if (!entry.last || a.completed_at > entry.last.completed_at) entry.last = a
  })
  return map
}

// Прогресс по главам: тесты с заполненным section ("Глава 1"...) в порядке
// tests (как в админке). Процент главы — среднее лучших результатов всех её
// тестов, непройденный тест считается за 0. То есть 100% — все подглавы
// пройдены без ошибок.
export function chapterProgress(tests, attempts) {
  const byTest = statsByTest(attempts)
  const chapters = []
  tests.forEach((test) => {
    const title = test.section?.trim()
    if (!title) return
    let chapter = chapters.find((c) => c.title === title)
    if (!chapter) {
      chapter = { title, tests: [] }
      chapters.push(chapter)
    }
    const stats = byTest[test.id]
    chapter.tests.push({ test, best: stats?.best ?? 0, attempts: stats?.attempts ?? 0, last: stats?.last ?? null })
  })

  return chapters.map((c) => {
    const done = c.tests.filter((t) => t.attempts > 0).length
    const ratio = c.tests.reduce((sum, t) => sum + t.best, 0) / c.tests.length
    return { ...c, done, total: c.tests.length, ratio }
  })
}

function localDayKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

// Сколько дней подряд (по местному времени) были попытки, считая сегодня.
// Если сегодня ещё не занимался, но вчера занимался — серия не прервана.
export function dayStreak(attempts, now = new Date()) {
  const days = new Set(attempts.map((a) => localDayKey(a.completed_at)))
  const cursor = new Date(now)
  if (!days.has(localDayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (days.has(localDayKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// Сводка для плиток вверху страницы.
export function summary(tests, attempts, now = new Date()) {
  const byTest = statsByTest(attempts)
  const knownIds = new Set(tests.map((t) => t.id))
  const taken = Object.entries(byTest).filter(([id]) => knownIds.has(id)) // удалённые тесты не считаем
  return {
    testsTaken: taken.length,
    testsTotal: tests.length,
    averageBest: taken.length ? taken.reduce((sum, [, s]) => sum + s.best, 0) / taken.length : null,
    totalSeconds: attempts.reduce((sum, a) => sum + (a.duration_seconds ?? 0), 0),
    streak: dayStreak(attempts, now),
  }
}

// Самая свежая попытка (по тесту, который ещё существует).
export function lastAttempt(tests, attempts) {
  const knownIds = new Set(tests.map((t) => t.id))
  return attempts
    .filter((a) => knownIds.has(a.test_id))
    .reduce((latest, a) => (!latest || a.completed_at > latest.completed_at ? a : latest), null)
}

// Следующий непройденный тест — по порядку глав (сначала тесты с главами,
// потом остальные), как в админке.
export function nextTest(tests, attempts) {
  const byTest = statsByTest(attempts)
  const ordered = [...tests.filter((t) => t.section?.trim()), ...tests.filter((t) => !t.section?.trim())]
  return ordered.find((t) => !byTest[t.id]) ?? null
}

// Пройденные тесты с самым слабым лучшим результатом (только ниже 100%).
export function weakestTests(tests, attempts, limit = 3) {
  const byTest = statsByTest(attempts)
  return tests
    .filter((t) => byTest[t.id] && byTest[t.id].best < 1)
    .map((t) => ({ test: t, best: byTest[t.id].best }))
    .sort((a, b) => a.best - b.best)
    .slice(0, limit)
}

// Разбивка одной попытки: сколько вопросов верно / частично / неверно / без
// ответа (по answers, которые сохраняет TestTakingPage).
export function attemptCounts(attempt) {
  const answers = attempt.answers ?? []
  const counts = { correct: 0, partial: 0, incorrect: 0, unanswered: 0 }
  answers.forEach((a) => {
    if (a.score >= a.max) counts.correct += 1
    else if (a.score <= 0) counts.incorrect += 1
    else counts.partial += 1
  })
  counts.unanswered = Math.max(0, (attempt.questions_count ?? answers.length) - answers.length)
  return counts
}

// Последние пройденные тесты (каждый тест один раз, по самой свежей попытке)
// — для виджета «Мои пробники» на главной.
export function recentTests(tests, attempts, limit = 2) {
  const byTest = statsByTest(attempts)
  return tests
    .filter((t) => byTest[t.id])
    .map((t) => ({ test: t, ...byTest[t.id], counts: attemptCounts(byTest[t.id].last) }))
    .sort((a, b) => (a.last.completed_at < b.last.completed_at ? 1 : -1))
    .slice(0, limit)
}

// Что открыть по кнопке «Продолжить» у главы: первая непройденная подглава;
// если пройдены все — самая слабая (ниже 100%); если всё на 100% — null.
export function chapterNextTest(chapter) {
  const notTaken = chapter.tests.find((t) => t.attempts === 0)
  if (notTaken) return notTaken.test
  const weakest = [...chapter.tests].filter((t) => t.best < 1).sort((a, b) => a.best - b.best)[0]
  return weakest?.test ?? null
}
