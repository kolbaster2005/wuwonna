// Экспорт и импорт текстов языковой версии пробника одним JSON-файлом — для
// перевода целиком (вручную или нейросетью), а не по вопросу в форме.
// Чистые функции без запросов — покрыты тестами (translationFile.test.js).
//
// Формат:
//   { lang, title, description, long_description, section, seo_title, seo_description,
//     questions: [{ id, prompt, options: [{ id, text }], explanation, category }],
//     passages:  [{ id, title, content, category }] }
// Без correct_option_ids и points — их не переводят.

export const TEST_TEXT_FIELDS = ['title', 'description', 'long_description', 'section', 'seo_title', 'seo_description']
const QUESTION_TEXT_FIELDS = ['prompt', 'explanation', 'category']
const PASSAGE_TEXT_FIELDS = ['title', 'content', 'category']

export function buildTranslationExport(test, questions, passages) {
  return {
    lang: test.lang ?? 'ru',
    ...Object.fromEntries(TEST_TEXT_FIELDS.map((field) => [field, test[field] ?? ''])),
    questions: questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
      explanation: q.explanation ?? '',
      category: q.category ?? '',
    })),
    passages: passages.map((p) => ({ id: p.id, title: p.title ?? '', content: p.content, category: p.category })),
  }
}

const sameIds = (a, b) => a.length === b.length && [...a].sort().join() === [...b].sort().join()

// Что изменит файл: { test, testChanges, questions, passages, notFound,
// rejected, langMismatch }. questions/passages — готовые к сохранению записи
// (исходные, поверх — тексты из файла). Вопрос, у которого набор id вариантов
// ответа не совпадает с базой, отклоняется: иначе сломается подсчёт баллов.
export function planTranslationImport(data, test, questions, passages) {
  const plan = { test: {}, testChanges: [], questions: [], passages: [], notFound: [], rejected: [], langMismatch: null }
  if (data?.lang && data.lang !== (test.lang ?? 'ru')) plan.langMismatch = String(data.lang).toUpperCase()

  TEST_TEXT_FIELDS.forEach((field) => {
    if (typeof data?.[field] !== 'string') return
    const value = data[field] === '' && test[field] == null ? null : data[field]
    if ((value ?? '') !== (test[field] ?? '')) {
      plan.test[field] = value
      plan.testChanges.push(field)
    }
  })

  const questionsById = new Map(questions.map((q) => [q.id, q]))
  for (const item of Array.isArray(data?.questions) ? data.questions : []) {
    const question = questionsById.get(item?.id)
    if (!question) {
      plan.notFound.push(item?.id ?? '?')
      continue
    }
    let options = question.options
    if (item.options !== undefined) {
      const fileIds = Array.isArray(item.options) ? item.options.map((o) => o?.id) : []
      if (!sameIds(fileIds, question.options.map((o) => o.id))) {
        plan.rejected.push({ id: question.id, reason: 'набор id вариантов ответа не совпадает с базой' })
        continue
      }
      const textById = new Map(item.options.map((o) => [o.id, o.text]))
      options = question.options.map((o) => ({ ...o, text: typeof textById.get(o.id) === 'string' ? textById.get(o.id) : o.text }))
    }
    const changes = Object.fromEntries(
      QUESTION_TEXT_FIELDS.filter((f) => typeof item[f] === 'string' && item[f] !== (question[f] ?? '')).map((f) => [f, item[f]]),
    )
    const optionsChanged = options.some((o, i) => o.text !== question.options[i].text)
    if (Object.keys(changes).length || optionsChanged) plan.questions.push({ ...question, ...changes, options })
  }

  const passagesById = new Map(passages.map((p) => [p.id, p]))
  for (const item of Array.isArray(data?.passages) ? data.passages : []) {
    const passage = passagesById.get(item?.id)
    if (!passage) {
      plan.notFound.push(item?.id ?? '?')
      continue
    }
    const changes = Object.fromEntries(
      PASSAGE_TEXT_FIELDS.filter((f) => typeof item[f] === 'string' && item[f] !== (passage[f] ?? '')).map((f) => [f, item[f]]),
    )
    if (Object.keys(changes).length) plan.passages.push({ ...passage, ...changes })
  }
  return plan
}
