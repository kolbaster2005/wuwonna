import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  attemptCounts,
  statsByTest,
  attemptsForShownTests,
  localizeSections,
  chapterNextTest,
  chapterProgress,
  dayStreak,
  lastAttempt,
  nextTest,
  recentTests,
  summary,
  weakestTests,
} from './progress.js'

const tests = [
  { id: 't11', title: 'Глава 1.1', section: 'Глава 1' },
  { id: 't12', title: 'Глава 1.2', section: 'Глава 1' },
  { id: 't21', title: 'Глава 2.1', section: 'Глава 2' },
  { id: 'set1', title: 'Пробник Set 1', section: null },
]

function attempt(testId, score, max, completedAt, duration = 60) {
  return { test_id: testId, score, max_score: max, completed_at: completedAt, duration_seconds: duration }
}

test('глава: среднее лучших результатов, непройденный тест = 0', () => {
  const attempts = [
    attempt('t11', 4, 8, '2026-10-01T10:00:00Z'),
    attempt('t11', 8, 8, '2026-10-02T10:00:00Z'), // пересдал на 100% — берётся лучшая
    attempt('t11', 2, 8, '2026-10-03T10:00:00Z'), // хуже — прогресс не падает
  ]
  const [ch1, ch2] = chapterProgress(tests, attempts)
  assert.equal(ch1.title, 'Глава 1')
  assert.equal(ch1.ratio, 0.5) // (1 + 0) / 2
  assert.equal(ch1.done, 1)
  assert.equal(ch1.total, 2)
  assert.equal(ch1.tests[0].attempts, 3)
  assert.equal(ch2.ratio, 0)
})

test('тесты без раздела в главы не попадают', () => {
  assert.deepEqual(
    chapterProgress(tests, []).map((c) => c.title),
    ['Глава 1', 'Глава 2'],
  )
})

test('сводка: пройдено, средний лучший, время', () => {
  const s = summary(tests, [
    attempt('t11', 8, 8, '2026-10-01T10:00:00Z', 100),
    attempt('t21', 5, 10, '2026-10-01T11:00:00Z', 200),
    attempt('deleted', 1, 1, '2026-10-01T12:00:00Z', 50), // удалённый тест в счёт тестов не идёт
  ])
  assert.equal(s.testsTaken, 2)
  assert.equal(s.testsTotal, 4)
  assert.equal(s.averageBest, 0.75)
  assert.equal(s.totalSeconds, 350)
})

test('сводка без попыток', () => {
  const s = summary(tests, [])
  assert.equal(s.testsTaken, 0)
  assert.equal(s.averageBest, null)
})

test('дни подряд: сегодня/вчера продолжают серию, пропуск обрывает', () => {
  const now = new Date(2026, 9, 10, 12) // 10 октября, местное время
  const at = (day) => new Date(2026, 9, day, 9).toISOString()
  assert.equal(dayStreak([{ completed_at: at(10) }, { completed_at: at(9) }, { completed_at: at(8) }], now), 3)
  assert.equal(dayStreak([{ completed_at: at(9) }, { completed_at: at(8) }], now), 2) // сегодня ещё не занимался
  assert.equal(dayStreak([{ completed_at: at(10) }, { completed_at: at(8) }], now), 1)
  assert.equal(dayStreak([{ completed_at: at(7) }], now), 0)
})

test('последняя попытка', () => {
  const a1 = attempt('t11', 1, 1, '2026-10-01T10:00:00Z')
  const a2 = attempt('t21', 1, 1, '2026-10-05T10:00:00Z')
  assert.equal(lastAttempt(tests, [a2, a1]), a2)
  assert.equal(lastAttempt(tests, []), null)
})

test('что дальше: первый непройденный по порядку глав', () => {
  assert.equal(nextTest(tests, []).id, 't11')
  assert.equal(nextTest(tests, [attempt('t11', 1, 1, '2026-10-01T10:00:00Z')]).id, 't12')
})

test('стоит повторить: самые слабые, без идеальных', () => {
  const weak = weakestTests(tests, [
    attempt('t11', 8, 8, '2026-10-01T10:00:00Z'),
    attempt('t12', 3, 10, '2026-10-01T10:00:00Z'),
    attempt('t21', 6, 10, '2026-10-01T10:00:00Z'),
  ])
  assert.deepEqual(
    weak.map((w) => w.test.id),
    ['t12', 't21'],
  )
})

test('разбивка попытки по ответам', () => {
  const counts = attemptCounts({
    questions_count: 5,
    answers: [
      { score: 1, max: 1 },
      { score: 0.5, max: 1 },
      { score: 0, max: 1 },
      { score: 2, max: 2 },
    ],
  })
  assert.deepEqual(counts, { correct: 2, partial: 1, incorrect: 1, unanswered: 1 })
})

test('последние пройденные тесты — по свежести, без повторов', () => {
  const recent = recentTests(tests, [
    attempt('t11', 1, 1, '2026-10-01T10:00:00Z'),
    attempt('t21', 1, 2, '2026-10-03T10:00:00Z'),
    attempt('t11', 0, 1, '2026-10-05T10:00:00Z'),
  ])
  assert.deepEqual(
    recent.map((r) => r.test.id),
    ['t11', 't21'],
  )
  assert.equal(recent[0].attempts, 2)
  assert.equal(recent[0].best, 1)
})

test('продолжить главу: первая непройденная, потом самая слабая', () => {
  const [ch1] = chapterProgress(tests, [attempt('t11', 1, 1, '2026-10-01T10:00:00Z')])
  assert.equal(chapterNextTest(ch1).id, 't12')
  const [allDone] = chapterProgress(tests, [
    attempt('t11', 1, 1, '2026-10-01T10:00:00Z'),
    attempt('t12', 1, 4, '2026-10-01T10:00:00Z'),
  ])
  assert.equal(chapterNextTest(allDone).id, 't12')
  const [perfect] = chapterProgress(tests, [
    attempt('t11', 1, 1, '2026-10-01T10:00:00Z'),
    attempt('t12', 4, 4, '2026-10-01T10:00:00Z'),
  ])
  assert.equal(chapterNextTest(perfect), null)
})

test('attemptsForShownTests: попытка на другой языковой версии засчитывается показанной', () => {
  const shown = [
    { id: 'de-1', translation_group: 'g1' },
    { id: 'ru-2', translation_group: 'ru-2' },
  ]
  const attempts = [
    { test_id: 'ru-1', translation_group: 'g1', score: 1, max_score: 2 },
    { test_id: 'ru-2', score: 2, max_score: 2 }, // старая попытка без группы
    { test_id: 'deleted', translation_group: 'gone', score: 0, max_score: 1 },
  ]
  const mapped = attemptsForShownTests(attempts, shown)
  assert.equal(mapped[0].test_id, 'de-1')
  assert.equal(mapped[0].original_test_id, 'ru-1')
  assert.equal(mapped[1].test_id, 'ru-2')
  assert.equal(mapped[2].test_id, 'deleted')
  assert.equal(statsByTest(mapped)['de-1'].best, 0.5)
})

test('localizeSections: раздел русской версии-заменителя — на языке страницы', () => {
  const tests = [
    { id: 'a', section: 'Kapitel 1' },
    { id: 'b', section: 'Глава 1', is_fallback: true },
    { id: 'c', section: null, is_fallback: true },
  ]
  const result = localizeSections(tests, (n) => `Kapitel ${n}`)
  assert.deepEqual(
    result.map((t) => t.section),
    ['Kapitel 1', 'Kapitel 1', null],
  )
  assert.equal(chapterProgress(result, []).length, 1)
})
