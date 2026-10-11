// Локальное "хранилище" для админ-панели. Пока Supabase не подключен (см.
// src/lib/supabaseClient.js), весь CRUD из админки пишет сюда, в
// localStorage браузера — это по-настоящему сохраняется между перезагрузками
// страницы. При первом запуске сюда копируются демо-данные из
// src/data/seed.js, дальше админка работает уже с этой копией.
//
// Когда подключишь Supabase — src/lib/data.js сам переключится на запросы
// к базе, эти функции перестанут использоваться, компоненты менять не надо.

import { seedCategories, seedTests, getSeedQuestions, getSeedPassages } from '../data/seed'
import { uid } from './uid'

const KEYS = {
  categories: 'exam-prep-admin-categories',
  tests: 'exam-prep-admin-tests',
  questions: 'exam-prep-admin-questions', // { [testId]: Question[] }
  passages: 'exam-prep-admin-passages', // { [testId]: Passage[] }
  chapters: 'exam-prep-admin-chapters',
  subchapters: 'exam-prep-admin-subchapters', // { [chapterId]: Subchapter[] }
  pages: 'exam-prep-admin-pages', // { [subchapterId]: Page[] }
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}


function ensureSeeded() {
  if (localStorage.getItem(KEYS.tests) === null) {
    writeJSON(KEYS.tests, seedTests)
  }
  if (localStorage.getItem(KEYS.categories) === null) {
    writeJSON(KEYS.categories, seedCategories)
  }
  if (localStorage.getItem(KEYS.questions) === null) {
    const map = {}
    seedTests.forEach((t) => {
      map[t.id] = getSeedQuestions(t.id).map((q) => ({ ...q, id: uid(), test_id: t.id }))
    })
    writeJSON(KEYS.questions, map)
  }
  if (localStorage.getItem(KEYS.passages) === null) {
    const map = {}
    seedTests.forEach((t) => {
      map[t.id] = getSeedPassages(t.id).map((p) => ({ ...p, id: uid(), test_id: t.id }))
    })
    writeJSON(KEYS.passages, map)
  }
}

// --- Категории ---

export function listCategories() {
  ensureSeeded()
  return readJSON(KEYS.categories, [])
}

export function saveCategory(category) {
  const categories = listCategories()
  const idx = categories.findIndex((c) => c.id === category.id)
  let result
  let next
  if (idx === -1) {
    result = { ...category, id: category.id || uid() }
    next = [...categories, result]
  } else {
    result = { ...categories[idx], ...category }
    next = categories.map((c) => (c.id === category.id ? result : c))
  }
  writeJSON(KEYS.categories, next)
  return result
}

// --- Пробники ---

export function listTests() {
  ensureSeeded()
  return readJSON(KEYS.tests, [])
}

export function getTest(testId) {
  return listTests().find((t) => t.id === testId) ?? null
}

export function saveTest(test) {
  const tests = listTests()
  const idx = tests.findIndex((t) => t.id === test.id)
  let result
  let next
  if (idx === -1) {
    const maxOrder = tests.reduce((max, t) => Math.max(max, t.sort_order ?? 0), -1)
    result = { ...test, id: test.id || uid(), sort_order: maxOrder + 1 }
    next = [...tests, result]
  } else {
    result = { ...tests[idx], ...test }
    next = tests.map((t) => (t.id === test.id ? result : t))
  }
  writeJSON(KEYS.tests, next)
  return result
}

// Порядок пробников после перетаскивания в админке: sort_order = позиция в orderedIds.
export function reorderTests(orderedIds) {
  const position = new Map(orderedIds.map((id, index) => [id, index]))
  writeJSON(
    KEYS.tests,
    listTests().map((t) => (position.has(t.id) ? { ...t, sort_order: position.get(t.id) } : t)),
  )
}

export function deleteTest(testId) {
  writeJSON(
    KEYS.tests,
    listTests().filter((t) => t.id !== testId),
  )
  const questionsMap = listQuestionsMap()
  delete questionsMap[testId]
  writeJSON(KEYS.questions, questionsMap)
  const passagesMap = listPassagesMap()
  delete passagesMap[testId]
  writeJSON(KEYS.passages, passagesMap)
}

// --- Вопросы ---

function listQuestionsMap() {
  ensureSeeded()
  return readJSON(KEYS.questions, {})
}

export function listQuestions(testId) {
  return listQuestionsMap()[testId] ?? []
}

// Плоский список всех вопросов всех пробников — нужен режиму тренировки по
// темам, который собирает вопросы не по одному testId, а по topic_code
// сразу из нескольких/всех пробников.
export function listAllQuestions() {
  const map = listQuestionsMap()
  return Object.values(map).flat()
}

export function getQuestion(testId, questionId) {
  return listQuestions(testId).find((q) => q.id === questionId) ?? null
}

export function saveQuestion(testId, question) {
  const map = listQuestionsMap()
  const list = map[testId] ?? []
  const idx = list.findIndex((q) => q.id === question.id)
  let result
  if (idx === -1) {
    // Новый вопрос всегда встаёт в конец — sort_order считаем от уже
    // существующих, а не оставляем 0 по умолчанию, иначе порядок "плывёт".
    const maxOrder = list.reduce((max, q) => Math.max(max, q.sort_order ?? 0), -1)
    result = { ...question, id: question.id || uid(), test_id: testId, sort_order: maxOrder + 1 }
    map[testId] = [...list, result]
  } else {
    // При редактировании sort_order намеренно не трогаем, даже если его
    // не передали в question, — позиция должна оставаться прежней.
    result = { ...list[idx], ...question, sort_order: list[idx].sort_order }
    map[testId] = list.map((q) => (q.id === question.id ? result : q))
  }
  writeJSON(KEYS.questions, map)
  return result
}

export function deleteQuestion(testId, questionId) {
  const map = listQuestionsMap()
  map[testId] = (map[testId] ?? []).filter((q) => q.id !== questionId)
  writeJSON(KEYS.questions, map)
}

// --- Тексты и вступления (passages) ---

function listPassagesMap() {
  ensureSeeded()
  return readJSON(KEYS.passages, {})
}

export function listPassages(testId) {
  return listPassagesMap()[testId] ?? []
}

export function savePassage(testId, passage) {
  const map = listPassagesMap()
  const list = map[testId] ?? []
  const idx = list.findIndex((p) => p.id === passage.id)
  let result
  if (idx === -1) {
    const maxOrder = list.reduce((max, p) => Math.max(max, p.sort_order ?? 0), -1)
    result = { ...passage, id: passage.id || uid(), test_id: testId, sort_order: maxOrder + 1 }
    map[testId] = [...list, result]
  } else {
    result = { ...list[idx], ...passage, sort_order: list[idx].sort_order }
    map[testId] = list.map((p) => (p.id === passage.id ? result : p))
  }
  writeJSON(KEYS.passages, map)
  return result
}

export function deletePassage(testId, passageId) {
  const map = listPassagesMap()
  map[testId] = (map[testId] ?? []).filter((p) => p.id !== passageId)
  writeJSON(KEYS.passages, map)
}

// --- Книга: главы -> подглавы -> страницы ---

export function listChapters() {
  return readJSON(KEYS.chapters, [])
}

export function getChapter(chapterId) {
  return listChapters().find((c) => c.id === chapterId) ?? null
}

export function saveChapter(chapter) {
  const chapters = listChapters()
  const idx = chapters.findIndex((c) => c.id === chapter.id)
  let result
  let next
  if (idx === -1) {
    const maxOrder = chapters.reduce((max, c) => Math.max(max, c.sort_order ?? 0), -1)
    result = { ...chapter, id: chapter.id || uid(), sort_order: maxOrder + 1 }
    next = [...chapters, result]
  } else {
    result = { ...chapters[idx], ...chapter, sort_order: chapters[idx].sort_order }
    next = chapters.map((c) => (c.id === chapter.id ? result : c))
  }
  writeJSON(KEYS.chapters, next)
  return result
}

export function deleteChapter(chapterId) {
  writeJSON(
    KEYS.chapters,
    listChapters().filter((c) => c.id !== chapterId),
  )
  // каскадом удаляем подглавы этой главы и все их страницы
  const subMap = listSubchaptersMap()
  const subIds = (subMap[chapterId] ?? []).map((s) => s.id)
  delete subMap[chapterId]
  writeJSON(KEYS.subchapters, subMap)
  const pageMap = listPagesMap()
  subIds.forEach((subId) => delete pageMap[subId])
  writeJSON(KEYS.pages, pageMap)
}

function listSubchaptersMap() {
  return readJSON(KEYS.subchapters, {})
}

export function listSubchapters(chapterId) {
  return listSubchaptersMap()[chapterId] ?? []
}

export function getSubchapter(chapterId, subchapterId) {
  return listSubchapters(chapterId).find((s) => s.id === subchapterId) ?? null
}

// Ищет подглаву по id, не зная заранее её главу (нужно для локального
// фолбэка публичной страницы книги, где в URL есть только id подглавы).
export function getSubchapterById(subchapterId) {
  const map = listSubchaptersMap()
  for (const list of Object.values(map)) {
    const found = list.find((s) => s.id === subchapterId)
    if (found) return found
  }
  return null
}

export function saveSubchapter(chapterId, subchapter) {
  const map = listSubchaptersMap()
  const list = map[chapterId] ?? []
  const idx = list.findIndex((s) => s.id === subchapter.id)
  let result
  if (idx === -1) {
    const maxOrder = list.reduce((max, s) => Math.max(max, s.sort_order ?? 0), -1)
    result = { ...subchapter, id: subchapter.id || uid(), chapter_id: chapterId, sort_order: maxOrder + 1 }
    map[chapterId] = [...list, result]
  } else {
    result = { ...list[idx], ...subchapter, sort_order: list[idx].sort_order }
    map[chapterId] = list.map((s) => (s.id === subchapter.id ? result : s))
  }
  writeJSON(KEYS.subchapters, map)
  return result
}

export function deleteSubchapter(chapterId, subchapterId) {
  const map = listSubchaptersMap()
  map[chapterId] = (map[chapterId] ?? []).filter((s) => s.id !== subchapterId)
  writeJSON(KEYS.subchapters, map)
  const pageMap = listPagesMap()
  delete pageMap[subchapterId]
  writeJSON(KEYS.pages, pageMap)
}

function listPagesMap() {
  return readJSON(KEYS.pages, {})
}

export function listPages(subchapterId) {
  return listPagesMap()[subchapterId] ?? []
}

export function savePage(subchapterId, page) {
  const map = listPagesMap()
  const list = map[subchapterId] ?? []
  const idx = list.findIndex((p) => p.id === page.id)
  let result
  if (idx === -1) {
    const maxOrder = list.reduce((max, p) => Math.max(max, p.sort_order ?? 0), -1)
    result = { ...page, id: page.id || uid(), subchapter_id: subchapterId, sort_order: maxOrder + 1 }
    map[subchapterId] = [...list, result]
  } else {
    result = { ...list[idx], ...page, sort_order: list[idx].sort_order }
    map[subchapterId] = list.map((p) => (p.id === page.id ? result : p))
  }
  writeJSON(KEYS.pages, map)
  return result
}

export function deletePage(subchapterId, pageId) {
  const map = listPagesMap()
  map[subchapterId] = (map[subchapterId] ?? []).filter((p) => p.id !== pageId)
  writeJSON(KEYS.pages, map)
}
