import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSteps, buildGroups, findPinnedPassage } from './steps.js'

const questions = [
  { id: 'q1', category: 'Математика' },
  { id: 'q2', category: 'Математика' },
  { id: 'q3', category: 'Экономика' },
]
const mathIntro = { id: 'p1', type: 'intro', category: 'Математика' }

test('вступление встаёт перед первым вопросом своей категории, один раз', () => {
  const steps = buildSteps(questions, [mathIntro])
  assert.deepEqual(
    steps.map((s) => (s.type === 'intro' ? `intro:${s.passage.id}` : s.question.id)),
    ['intro:p1', 'q1', 'q2', 'q3'],
  )
})

test('если вступлений на категорию несколько — берётся первое', () => {
  const second = { id: 'p2', type: 'intro', category: 'Математика' }
  const steps = buildSteps(questions, [mathIntro, second])
  assert.equal(steps.filter((s) => s.type === 'intro').length, 1)
  assert.equal(steps[0].passage.id, 'p1')
})

test('группы для левого меню: по категориям, сквозная нумерация вопросов', () => {
  const groups = buildGroups(buildSteps(questions, [mathIntro]))
  assert.equal(groups.length, 2)
  assert.equal(groups[0].category, 'Математика')
  assert.equal(groups[0].introStepIndex, 0)
  assert.deepEqual(
    groups[0].questionSteps.map((q) => q.questionNumber),
    [1, 2],
  )
  assert.equal(groups[1].category, 'Экономика')
  assert.equal(groups[1].introStepIndex, null)
  assert.deepEqual(groups[1].questionSteps, [{ stepIndex: 3, questionNumber: 3, questionIndex: 2 }])
})

test('закреплённый текст показывается начиная со своего вопроса', () => {
  const pinned = { id: 't1', type: 'pinned', category: 'Математика', anchor_question_id: 'q2' }
  assert.equal(findPinnedPassage(questions, [pinned], 0), null)
  assert.equal(findPinnedPassage(questions, [pinned], 1), pinned)
  assert.equal(findPinnedPassage(questions, [pinned], 2), null) // другая категория
})

test('несколько закреплённых текстов — переключаются по мере прохождения', () => {
  const first = { id: 't1', type: 'pinned', category: 'Математика', anchor_question_id: 'q1' }
  const second = { id: 't2', type: 'pinned', category: 'Математика', anchor_question_id: 'q2' }
  assert.equal(findPinnedPassage(questions, [first, second], 0), first)
  assert.equal(findPinnedPassage(questions, [first, second], 1), second)
})

test('единственный текст без привязки — на всю категорию', () => {
  const pinned = { id: 't1', type: 'pinned', category: 'Математика', anchor_question_id: null }
  assert.equal(findPinnedPassage(questions, [pinned], 0), pinned)
  assert.equal(findPinnedPassage(questions, [pinned], 1), pinned)
})
