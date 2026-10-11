// Система оценки вопросов с несколькими правильными ответами.
//
// 1 правильный ответ на вопрос -> "всё или ничего": верный набор даёт max
// баллов, любое отклонение — 0.
//
// Больше 1 правильного ответа -> частичные баллы:
//   за каждый отмеченный верный:    + max / r   (r = число верных вариантов)
//   за каждый отмеченный неверный:  − max / f   (f = число неверных вариантов)
// Особый случай: если неверный вариант всего один (f === 1) — штраф считается
// от max / (2f), то есть вдвое мягче обычного.
//
// Итог не может быть отрицательным (клэмп в 0) и не может превышать max.

export function scoreQuestion(question, selectedIds) {
  const max = question.points ?? 1
  const correctSet = new Set(question.correct_option_ids)
  const allIds = question.options.map((o) => o.id)
  const r = correctSet.size
  const f = allIds.length - r

  const selectedCorrect = selectedIds.filter((id) => correctSet.has(id)).length
  const selectedIncorrect = selectedIds.filter((id) => !correctSet.has(id)).length

  if (r <= 1) {
    const isExactMatch = selectedIds.length === correctSet.size && selectedIds.every((id) => correctSet.has(id))
    return isExactMatch ? max : 0
  }

  const perCorrect = max / r
  const perIncorrect = f === 1 ? max / (2 * f) : max / (f || 1)

  const raw = selectedCorrect * perCorrect - selectedIncorrect * perIncorrect
  const clamped = Math.max(0, Math.min(max, raw))
  return Math.round(clamped * 100) / 100
}

// 'correct' — полный балл, 'partial' — что-то среднее, 'incorrect' — 0.
export function scoreStatus(score, max) {
  if (score >= max) return 'correct'
  if (score <= 0) return 'incorrect'
  return 'partial'
}
