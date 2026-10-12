import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildTranslationExport, planTranslationImport } from './translationFile.js'

const testRow = { id: 't1', lang: 'de', title: 'Probetest', description: 'Kurz', long_description: null, section: null }
const questions = [
  {
    id: 'q1',
    prompt: 'Вопрос',
    options: [
      { id: 'a', text: 'Да' },
      { id: 'b', text: 'Нет' },
    ],
    correct_option_ids: ['a'],
    points: 2,
    explanation: 'Потому что',
    category: 'Экономика',
  },
  {
    id: 'q2',
    prompt: 'Второй',
    options: [{ id: 'x', text: 'Икс' }],
    correct_option_ids: ['x'],
    explanation: '',
    category: 'Математика',
  },
]
const passages = [{ id: 'p1', title: 'Текст', content: 'Содержание', category: 'Экономика' }]

test('экспорт: тексты без верных ответов и баллов', () => {
  const data = buildTranslationExport(testRow, questions, passages)
  assert.equal(data.lang, 'de')
  assert.equal(data.questions[0].correct_option_ids, undefined)
  assert.equal(data.questions[0].points, undefined)
  assert.deepEqual(data.questions[0].options, questions[0].options)
  assert.equal(data.passages[0].content, 'Содержание')
})

test('импорт: меняет тексты, сохраняет id вариантов и верные ответы', () => {
  const data = buildTranslationExport(testRow, questions, passages)
  data.title = 'Offizieller Probetest'
  data.questions[0].prompt = 'Frage'
  data.questions[0].options[1].text = 'Nein'
  data.passages[0].content = 'Inhalt'
  const plan = planTranslationImport(data, testRow, questions, passages)
  assert.deepEqual(plan.testChanges, ['title'])
  assert.equal(plan.questions.length, 1)
  assert.equal(plan.questions[0].prompt, 'Frage')
  assert.deepEqual(plan.questions[0].correct_option_ids, ['a'])
  assert.deepEqual(plan.questions[0].options, [
    { id: 'a', text: 'Да' },
    { id: 'b', text: 'Nein' },
  ])
  assert.equal(plan.passages[0].content, 'Inhalt')
  assert.deepEqual(plan.notFound, [])
})

test('импорт: другой набор id вариантов — вопрос отклонён, неизвестные id — в списке', () => {
  const data = buildTranslationExport(testRow, questions, passages)
  data.questions[0].options = [
    { id: 'a', text: 'Ja' },
    { id: 'c', text: 'Nein' },
  ]
  data.questions.push({ id: 'zzz', prompt: 'Neu' })
  data.lang = 'en'
  const plan = planTranslationImport(data, testRow, questions, passages)
  assert.equal(plan.questions.length, 0)
  assert.equal(plan.rejected[0].id, 'q1')
  assert.deepEqual(plan.notFound, ['zzz'])
  assert.equal(plan.langMismatch, 'EN')
})
