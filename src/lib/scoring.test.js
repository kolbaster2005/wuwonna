import { test } from 'node:test'
import assert from 'node:assert/strict'
import { scoreQuestion, scoreStatus } from './scoring.js'

function question(optionIds, correctIds, points) {
  return { options: optionIds.map((id) => ({ id, text: id })), correct_option_ids: correctIds, points }
}

test('один верный ответ — всё или ничего', () => {
  const q = question(['a', 'b', 'c', 'd'], ['b'], 2)
  assert.equal(scoreQuestion(q, ['b']), 2)
  assert.equal(scoreQuestion(q, ['a']), 0)
  assert.equal(scoreQuestion(q, ['b', 'c']), 0) // лишняя галочка — уже не точное совпадение
  assert.equal(scoreQuestion(q, []), 0)
})

test('баллы по умолчанию — 1', () => {
  const q = question(['a', 'b'], ['a'])
  assert.equal(scoreQuestion(q, ['a']), 1)
})

test('несколько верных: + max/r за каждый верный, − max/f за каждый неверный', () => {
  // r = 3 верных, f = 2 неверных, max = 1
  const q = question(['a', 'b', 'c', 'd', 'e'], ['a', 'b', 'c'], 1)
  assert.equal(scoreQuestion(q, ['a', 'b', 'c']), 1)
  assert.equal(scoreQuestion(q, ['a', 'b']), 0.67)
  assert.equal(scoreQuestion(q, ['a', 'b', 'd']), 0.17) // 2/3 − 1/2
})

test('один неверный вариант — штраф вдвое мягче (max / 2f)', () => {
  // r = 3, f = 1: штраф 1/2 вместо 1
  const q = question(['a', 'b', 'c', 'd'], ['a', 'b', 'c'], 1)
  assert.equal(scoreQuestion(q, ['a', 'b', 'c', 'd']), 0.5)
})

test('итог не уходит в минус и не превышает max', () => {
  const q = question(['a', 'b', 'c', 'd', 'e'], ['a', 'b', 'c'], 1)
  assert.equal(scoreQuestion(q, ['a', 'd', 'e']), 0) // 1/3 − 1 < 0
  assert.equal(scoreQuestion(q, ['d']), 0)
})

test('scoreStatus', () => {
  assert.equal(scoreStatus(1, 1), 'correct')
  assert.equal(scoreStatus(0, 1), 'incorrect')
  assert.equal(scoreStatus(0.5, 1), 'partial')
})
