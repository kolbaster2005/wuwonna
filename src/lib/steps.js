// Собирает единую последовательность шагов прохождения теста: перед первым
// вопросом каждой категории (если для неё есть вступление) вставляется шаг
// intro, дальше идут сами вопросы. Список passages должен быть отсортирован
// (см. data.js — сортируется по sort_order), поэтому при нескольких intro на
// одну категорию используется первый из них.
export function buildSteps(questions, passages) {
  const introByCategory = {}
  passages
    .filter((p) => p.type === 'intro')
    .forEach((p) => {
      if (!introByCategory[p.category]) introByCategory[p.category] = p
    })

  const steps = []
  const seenIntroFor = new Set()

  questions.forEach((question, questionIndex) => {
    const cat = question.category || null
    if (cat && introByCategory[cat] && !seenIntroFor.has(cat)) {
      steps.push({ type: 'intro', passage: introByCategory[cat] })
      seenIntroFor.add(cat)
    }
    steps.push({ type: 'question', question, questionIndex })
  })

  return steps
}

// Группирует шаги для левого меню: новая группа начинается всякий раз, когда
// меняется категория (будь то из-за intro-шага или смены категории вопроса).
export function buildGroups(steps) {
  const groups = []
  let lastCategory = Symbol('none')
  let questionNumber = 0

  steps.forEach((step, stepIndex) => {
    const stepCategory = step.type === 'intro' ? step.passage.category : step.question.category || null

    if (stepCategory !== lastCategory) {
      groups.push({ category: stepCategory, introStepIndex: null, questionSteps: [] })
      lastCategory = stepCategory
    }
    const group = groups[groups.length - 1]

    if (step.type === 'intro') {
      group.introStepIndex = stepIndex
    } else {
      questionNumber += 1
      group.questionSteps.push({ stepIndex, questionNumber, questionIndex: step.questionIndex })
    }
  })

  return groups
}

// Находит "закреплённый" (pinned) текст для чтения, который должен быть
// виден рядом с вопросом questionIndex — это последний по порядку pinned-
// текст той же категории с anchor_question_id на вопрос с индексом <=
// questionIndex.
export function findPinnedPassage(questions, passages, questionIndex) {
  const question = questions[questionIndex]
  if (!question?.category) return null

  const pinned = passages.filter((p) => p.type === 'pinned' && p.category === question.category)
  if (pinned.length === 0) return null

  const anchoredIndexFor = (passage) => questions.findIndex((q) => q.id === passage.anchor_question_id)

  let best = null
  let bestIndex = -1
  pinned.forEach((passage) => {
    const anchorIdx = anchoredIndexFor(passage)
    if (anchorIdx !== -1 && anchorIdx <= questionIndex && anchorIdx > bestIndex) {
      best = passage
      bestIndex = anchorIdx
    }
  })
  // Если ни один pinned-текст ещё не "заякорился" по индексу (например,
  // anchor не задан), но текст всего один — показываем его в рамках всей
  // категории, это удобнее, чем не показывать текст вовсе.
  if (!best && pinned.length === 1 && !pinned[0].anchor_question_id) {
    return pinned[0]
  }
  return best
}
