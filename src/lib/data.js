import { supabase, isSupabaseConfigured } from './supabaseClient'
import * as store from './localStore'
import * as localHighlights from './localBookHighlights'
import * as localProgress from './localProgress'
import { TOPICS } from '../data/topics'

// Единая точка доступа к данным. Компоненты дергают эти функции и не знают,
// откуда на самом деле приходят данные. Пока Supabase не настроен — читаем
// и пишем в src/lib/localStore.js (localStorage, по-настоящему сохраняется
// между перезагрузками). Как только пропишешь .env — всё переключится на
// запросы к базе, компоненты трогать не придётся.

export async function fetchCategories() {
  if (!isSupabaseConfigured) return store.listCategories()

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true }) // порядок вкладок на странице «Пробники»

  if (error) {
    console.error('fetchCategories error, falling back to local store:', error)
    return store.listCategories()
  }
  return data
}

export async function createCategory({ name, slug }) {
  if (!isSupabaseConfigured) return store.saveCategory({ name, slug })

  // Новая категория — новой вкладкой в конце, а не с sort_order = 0 наравне с первой.
  const { data: existing, error: countError } = await supabase.from('categories').select('sort_order')
  if (countError) throw countError
  const maxOrder = existing.reduce((max, c) => Math.max(max, c.sort_order ?? 0), -1)

  const { data, error } = await supabase
    .from('categories')
    .insert({ name, slug, sort_order: maxOrder + 1 })
    .select()
    .single()
  if (error) throw error
  return data
}

// pdf_url хранит файл как base64 — это может быть мегабайты текста прямо в
// строке таблицы. Если тянуть его через select('*') на каждый список
// пробников, страницы начинают загружаться заметно дольше. Поэтому в
// обычных запросах явно перечисляем колонки без pdf_url, а сам файл
// запрашиваем отдельно, только когда пользователь жмёт "Скачать".
const TEST_LIST_COLUMNS =
  'id, category_id, title, description, long_description, originality, is_pinned, is_pro, questions_count, duration_minutes, year, sort_order, section, created_at'

// Эти колонки появляются только после отдельных SQL-скриптов. Пока скрипт не
// выполнен, запрос с такой колонкой падает (Postgres 42703 "column does not
// exist") — тогда повторяем его без неё, чтобы сайт не ломался, а просто
// работал без этой возможности.
const OPTIONAL_COLUMNS = {
  sort_order: 'supabase/add-test-order.sql',
  section: 'supabase/add-test-sections.sql',
}
const MISSING_COLUMN = '42703'

// Если RLS запрещает update, Supabase не возвращает ошибку — просто ничего
// не обновляется (0 строк). Без этой проверки сохранение "молча" не работало бы.
// Сообщения ошибок — ключи словаря (src/i18n), текст подставляет компонент.
function notAllowedError() {
  return new Error('errors.notAllowed')
}

async function selectTests(buildQuery) {
  let columns = TEST_LIST_COLUMNS.split(', ')
  for (;;) {
    const result = await buildQuery(columns.join(', '))
    if (result.error?.code !== MISSING_COLUMN) return result
    // "column practice_tests.section does not exist" -> section
    const missing = Object.keys(OPTIONAL_COLUMNS).find(
      (col) => columns.includes(col) && result.error.message?.includes(`.${col} `),
    )
    if (!missing) return result
    console.warn(`practice_tests.${missing} не найдена — выполни ${OPTIONAL_COLUMNS[missing]}`)
    columns = columns.filter((col) => col !== missing)
  }
}

// Закреплённые пробники — первыми, дальше в порядке, выставленном в админке
// перетаскиванием (sort_order). У кого sort_order ещё нет (старые данные) —
// в конце, по году по убыванию.
function sortTests(tests) {
  return [...tests].sort((a, b) => {
    if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) return a.is_pinned ? -1 : 1
    const orderA = a.sort_order ?? Number.MAX_SAFE_INTEGER
    const orderB = b.sort_order ?? Number.MAX_SAFE_INTEGER
    if (orderA !== orderB) return orderA - orderB
    return (b.year ?? 0) - (a.year ?? 0)
  })
}

// В Supabase число вопросов не хранится надёжно в самой строке пробника —
// оно может разъехаться с реальностью, если вопросы добавили/удалили через
// админку. Поэтому всегда считаем актуально, по факту строк в questions.
async function attachQuestionCounts(tests) {
  if (tests.length === 0) return tests
  const ids = tests.map((t) => t.id)
  const { data, error } = await supabase.from('questions').select('test_id').in('test_id', ids)
  if (error) {
    console.error('attachQuestionCounts error:', error)
    return tests
  }
  const counts = {}
  data.forEach((row) => {
    counts[row.test_id] = (counts[row.test_id] ?? 0) + 1
  })
  return tests.map((t) => ({ ...t, questions_count: counts[t.id] ?? 0 }))
}

// Не забираем сам файл — только проверяем его наличие (count-запрос без
// тела ответа), чтобы решить, показывать ли кнопку "Скачать" активной.
async function attachHasPdf(tests) {
  if (tests.length === 0) return tests
  const ids = tests.map((t) => t.id)
  const { data, error } = await supabase.from('practice_tests').select('id').in('id', ids).not('pdf_url', 'is', null)
  if (error) {
    console.error('attachHasPdf error:', error)
    return tests.map((t) => ({ ...t, has_pdf: false }))
  }
  const withPdf = new Set(data.map((row) => row.id))
  return tests.map((t) => ({ ...t, has_pdf: withPdf.has(t.id) }))
}

export async function fetchTests({ categoryId } = {}) {
  if (!isSupabaseConfigured) {
    const tests = store
      .listTests()
      .map((t) => ({ ...t, questions_count: store.listQuestions(t.id).length, has_pdf: Boolean(t.pdf_url) }))
    const filtered = categoryId ? tests.filter((t) => t.category_id === categoryId) : tests
    return sortTests(filtered)
  }

  // Сортировка целиком на стороне sortTests — так запрос не зависит от того,
  // есть ли уже колонка sort_order в базе.
  const { data, error } = await selectTests((columns) => {
    const query = supabase.from('practice_tests').select(columns)
    return categoryId ? query.eq('category_id', categoryId) : query
  })
  if (error) {
    console.error('fetchTests error, falling back to local store:', error)
    const tests = store
      .listTests()
      .map((t) => ({ ...t, questions_count: store.listQuestions(t.id).length, has_pdf: Boolean(t.pdf_url) }))
    const filtered = categoryId ? tests.filter((t) => t.category_id === categoryId) : tests
    return sortTests(filtered)
  }
  return sortTests(await attachHasPdf(await attachQuestionCounts(data)))
}

export async function fetchTestById(testId) {
  if (!isSupabaseConfigured) {
    const t = store.getTest(testId)
    return t ? { ...t, questions_count: store.listQuestions(testId).length, has_pdf: Boolean(t.pdf_url) } : null
  }

  const { data, error } = await selectTests((columns) =>
    supabase.from('practice_tests').select(columns).eq('id', testId).single(),
  )
  if (error) {
    console.error('fetchTestById error, falling back to local store:', error)
    const t = store.getTest(testId)
    return t ? { ...t, questions_count: store.listQuestions(testId).length, has_pdf: Boolean(t.pdf_url) } : null
  }
  const [withCount] = await attachHasPdf(await attachQuestionCounts([data]))
  return withCount
}

// Забирает сам PDF (base64) — вызывать только по клику на "Скачать", не при
// обычной загрузке страницы.
export async function fetchTestPdf(testId) {
  if (!isSupabaseConfigured) {
    return store.getTest(testId)?.pdf_url ?? null
  }

  const { data, error } = await supabase.from('practice_tests').select('pdf_url').eq('id', testId).single()
  if (error) {
    console.error('fetchTestPdf error:', error)
    return null
  }
  return data.pdf_url
}

export async function saveTest(test) {
  if (!isSupabaseConfigured) return store.saveTest(test)

  if (!test.id) {
    // Новый пробник встаёт в конец списка, а не в начало с sort_order = 0.
    // Если колонки sort_order ещё нет — просто сохраняем без неё.
    const { data: existing, error: countError } = await supabase.from('practice_tests').select('sort_order')
    if (countError && countError.code !== MISSING_COLUMN) throw countError
    if (!countError) {
      const maxOrder = existing.reduce((max, t) => Math.max(max, t.sort_order ?? 0), -1)
      test = { ...test, sort_order: maxOrder + 1 }
    }
  }

  const { data, error } = await supabase.from('practice_tests').upsert(test).select().single()
  if (error) throw error
  return data
}

// Сохраняет порядок пробников после перетаскивания в админке: sort_order =
// позиция в orderedIds. Отдельные update, а не upsert — upsert с неполной
// строкой падает на NOT NULL-колонках (см. setTestProAccess).
export async function reorderTests(orderedIds) {
  if (!isSupabaseConfigured) return store.reorderTests(orderedIds)

  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from('practice_tests').update({ sort_order: index }).eq('id', id).select('id')),
  )
  const failed = results.find((r) => r.error)
  if (failed?.error.code === MISSING_COLUMN) {
    throw new Error('errors.noSortOrder')
  }
  if (failed) throw failed.error
  if (results.some((r) => r.data.length === 0)) throw notAllowedError()
}

// Переключает доступ к пробнику: только PRO или для всех. Отдельный update,
// а не saveTest (upsert): upsert с одним полем вместо всей строки в Postgres
// падает на NOT NULL-колонках (title и т.п.).
export async function setTestProAccess(testId, isPro) {
  if (!isSupabaseConfigured) return store.saveTest({ id: testId, is_pro: isPro })

  const { data, error } = await selectTests((columns) =>
    supabase.from('practice_tests').update({ is_pro: isPro }).eq('id', testId).select(columns).single(),
  )
  if (error) throw error
  return data
}

// Закрепить/открепить пробник. Отдельный update — upsert с неполной строкой
// падает на NOT NULL-колонках (см. setTestProAccess).
export async function setTestPinned(testId, isPinned) {
  if (!isSupabaseConfigured) return store.saveTest({ id: testId, is_pinned: isPinned })

  const { data, error } = await supabase
    .from('practice_tests')
    .update({ is_pinned: isPinned })
    .eq('id', testId)
    .select('id')
  if (error) throw error
  if (data.length === 0) throw notAllowedError()
}

// Переносит пробник в другую категорию (вкладку на странице «Пробники»)
// прямо из списка в админке. Отдельный update — по той же причине, что и
// setTestProAccess.
export async function setTestCategory(testId, categoryId) {
  if (!isSupabaseConfigured) return store.saveTest({ id: testId, category_id: categoryId })

  const { data, error } = await supabase
    .from('practice_tests')
    .update({ category_id: categoryId })
    .eq('id', testId)
    .select('id')
  if (error) throw error
  if (data.length === 0) throw notAllowedError()
}

export async function deleteTest(testId) {
  if (!isSupabaseConfigured) return store.deleteTest(testId)

  const { data, error } = await supabase.from('practice_tests').delete().eq('id', testId).select('id')
  if (error) throw error
  if (data.length === 0) throw notAllowedError()
}

export async function fetchQuestions(testId) {
  if (!isSupabaseConfigured) return store.listQuestions(testId)

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('test_id', testId)
    .order('sort_order', { ascending: true })
    .order('id', { ascending: true }) // стабильный тай-брейк, чтобы порядок не "плавал"

  if (error) {
    console.error('fetchQuestions error, falling back to local store:', error)
    return store.listQuestions(testId)
  }
  return data
}

export async function saveQuestion(testId, question) {
  if (!isSupabaseConfigured) return store.saveQuestion(testId, question)

  if (!question.id) {
    // Новый вопрос — сами считаем sort_order (в конец), а не оставляем
    // 0 по умолчанию для всех подряд: именно это раньше ломало порядок
    // при редактировании более старых вопросов.
    const { data: existing, error: countError } = await supabase
      .from('questions')
      .select('sort_order')
      .eq('test_id', testId)
    if (countError) throw countError
    const maxOrder = existing.reduce((max, q) => Math.max(max, q.sort_order ?? 0), -1)
    const payload = { ...question, test_id: testId, sort_order: maxOrder + 1 }
    const { data, error } = await supabase.from('questions').insert(payload).select().single()
    if (error) throw error
    return data
  }

  // Редактирование — sort_order из payload намеренно убираем, чтобы
  // позиция вопроса никогда не менялась просто от того, что его отредактировали.
  const { sort_order: _drop, id, ...rest } = question
  const { data, error } = await supabase.from('questions').update(rest).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteQuestion(testId, questionId) {
  if (!isSupabaseConfigured) return store.deleteQuestion(testId, questionId)

  const { data, error } = await supabase.from('questions').delete().eq('id', questionId).select('id')
  if (error) throw error
  if (data.length === 0) throw notAllowedError()
}

// --- Тексты и вступления (passages) ---

export async function fetchPassages(testId) {
  if (!isSupabaseConfigured) return store.listPassages(testId)

  const { data, error } = await supabase
    .from('passages')
    .select('*')
    .eq('test_id', testId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('fetchPassages error, falling back to local store:', error)
    return store.listPassages(testId)
  }
  return data
}

export async function savePassage(testId, passage) {
  if (!isSupabaseConfigured) return store.savePassage(testId, passage)

  if (!passage.id) {
    const { data: existing, error: countError } = await supabase
      .from('passages')
      .select('sort_order')
      .eq('test_id', testId)
    if (countError) throw countError
    const maxOrder = existing.reduce((max, p) => Math.max(max, p.sort_order ?? 0), -1)
    const payload = { ...passage, test_id: testId, sort_order: maxOrder + 1 }
    const { data, error } = await supabase.from('passages').insert(payload).select().single()
    if (error) throw error
    return data
  }

  const { sort_order: _drop, id, ...rest } = passage
  const { data, error } = await supabase.from('passages').update(rest).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deletePassage(testId, passageId) {
  if (!isSupabaseConfigured) return store.deletePassage(testId, passageId)

  const { data, error } = await supabase.from('passages').delete().eq('id', passageId).select('id')
  if (error) throw error
  if (data.length === 0) throw notAllowedError()
}

// --- Книга: главы -> подглавы -> страницы ---

export async function fetchChapters() {
  if (!isSupabaseConfigured) return store.listChapters()

  const { data, error } = await supabase.from('book_chapters').select('*').order('sort_order', { ascending: true })
  if (error) {
    console.error('fetchChapters error, falling back to local store:', error)
    return store.listChapters()
  }
  return data
}

export async function fetchChapterById(chapterId) {
  if (!isSupabaseConfigured) return store.getChapter(chapterId)

  const { data, error } = await supabase.from('book_chapters').select('*').eq('id', chapterId).single()
  if (error) {
    console.error('fetchChapterById error, falling back to local store:', error)
    return store.getChapter(chapterId)
  }
  return data
}

export async function saveChapter(chapter) {
  if (!isSupabaseConfigured) return store.saveChapter(chapter)

  if (!chapter.id) {
    const { data: existing, error: countError } = await supabase.from('book_chapters').select('sort_order')
    if (countError) throw countError
    const maxOrder = existing.reduce((max, c) => Math.max(max, c.sort_order ?? 0), -1)
    const payload = { ...chapter, sort_order: maxOrder + 1 }
    const { data, error } = await supabase.from('book_chapters').insert(payload).select().single()
    if (error) throw error
    return data
  }

  const { sort_order: _drop, id, ...rest } = chapter
  const { data, error } = await supabase.from('book_chapters').update(rest).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteChapter(chapterId) {
  if (!isSupabaseConfigured) return store.deleteChapter(chapterId)

  const { data, error } = await supabase.from('book_chapters').delete().eq('id', chapterId).select('id')
  if (error) throw error
  if (data.length === 0) throw notAllowedError()
}

export async function fetchSubchapters(chapterId) {
  if (!isSupabaseConfigured) return store.listSubchapters(chapterId)

  const { data, error } = await supabase
    .from('book_subchapters')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('sort_order', { ascending: true })
  if (error) {
    console.error('fetchSubchapters error, falling back to local store:', error)
    return store.listSubchapters(chapterId)
  }
  return data
}

export async function fetchSubchapterById(subchapterId) {
  if (!isSupabaseConfigured) return store.getSubchapterById(subchapterId)

  const { data, error } = await supabase.from('book_subchapters').select('*').eq('id', subchapterId).single()
  if (error) {
    console.error('fetchSubchapterById error:', error)
    return null
  }
  return data
}

export async function saveSubchapter(chapterId, subchapter) {
  if (!isSupabaseConfigured) return store.saveSubchapter(chapterId, subchapter)

  if (!subchapter.id) {
    const { data: existing, error: countError } = await supabase
      .from('book_subchapters')
      .select('sort_order')
      .eq('chapter_id', chapterId)
    if (countError) throw countError
    const maxOrder = existing.reduce((max, s) => Math.max(max, s.sort_order ?? 0), -1)
    const payload = { ...subchapter, chapter_id: chapterId, sort_order: maxOrder + 1 }
    const { data, error } = await supabase.from('book_subchapters').insert(payload).select().single()
    if (error) throw error
    return data
  }

  const { sort_order: _drop, id, ...rest } = subchapter
  const { data, error } = await supabase.from('book_subchapters').update(rest).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteSubchapter(chapterId, subchapterId) {
  if (!isSupabaseConfigured) return store.deleteSubchapter(chapterId, subchapterId)

  const { data, error } = await supabase.from('book_subchapters').delete().eq('id', subchapterId).select('id')
  if (error) throw error
  if (data.length === 0) throw notAllowedError()
}

export async function fetchPages(subchapterId) {
  if (!isSupabaseConfigured) return store.listPages(subchapterId)

  const { data, error } = await supabase
    .from('book_pages')
    .select('*')
    .eq('subchapter_id', subchapterId)
    .order('sort_order', { ascending: true })
  if (error) {
    console.error('fetchPages error, falling back to local store:', error)
    return store.listPages(subchapterId)
  }
  return data
}

export async function savePage(subchapterId, page) {
  if (!isSupabaseConfigured) return store.savePage(subchapterId, page)

  if (!page.id) {
    const { data: existing, error: countError } = await supabase
      .from('book_pages')
      .select('sort_order')
      .eq('subchapter_id', subchapterId)
    if (countError) throw countError
    const maxOrder = existing.reduce((max, p) => Math.max(max, p.sort_order ?? 0), -1)
    const payload = { ...page, subchapter_id: subchapterId, sort_order: maxOrder + 1 }
    const { data, error } = await supabase.from('book_pages').insert(payload).select().single()
    if (error) throw error
    return data
  }

  const { sort_order: _drop, id, ...rest } = page
  const { data, error } = await supabase.from('book_pages').update(rest).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deletePage(subchapterId, pageId) {
  if (!isSupabaseConfigured) return store.deletePage(subchapterId, pageId)

  const { data, error } = await supabase.from('book_pages').delete().eq('id', pageId).select('id')
  if (error) throw error
  if (data.length === 0) throw notAllowedError()
}

// --- Выделения и заметки в книге ---
// Привязаны к конкретной странице и к аккаунту (userId), чтобы прогресс не
// терялся и был доступен с любого устройства. Без Supabase или без входа —
// работает локально, в этом браузере (localBookHighlights.js), функционал
// не ломается, просто не синхронизируется.

export async function fetchBookHighlights(pageId, userId) {
  if (!isSupabaseConfigured || !userId) return localHighlights.list(pageId)

  const { data, error } = await supabase
    .from('book_highlights')
    .select('*')
    .eq('page_id', pageId)
    .eq('user_id', userId)
    .order('start_offset', { ascending: true })

  if (error) {
    console.error('fetchBookHighlights error, falling back to local store:', error)
    return localHighlights.list(pageId)
  }
  return data.map((h) => ({ id: h.id, start: h.start_offset, end: h.end_offset, note: h.note ?? '' }))
}

export async function saveBookHighlight(pageId, userId, highlight) {
  if (!isSupabaseConfigured || !userId) return localHighlights.save(pageId, highlight)

  if (!highlight.id) {
    const payload = {
      page_id: pageId,
      user_id: userId,
      start_offset: highlight.start,
      end_offset: highlight.end,
      note: highlight.note || null,
    }
    const { data, error } = await supabase.from('book_highlights').insert(payload).select().single()
    if (error) throw error
    return { id: data.id, start: data.start_offset, end: data.end_offset, note: data.note ?? '' }
  }

  const { data, error } = await supabase
    .from('book_highlights')
    .update({ note: highlight.note || null })
    .eq('id', highlight.id)
    .select()
    .single()
  if (error) throw error
  return { id: data.id, start: data.start_offset, end: data.end_offset, note: data.note ?? '' }
}

export async function deleteBookHighlight(pageId, userId, highlightId) {
  if (!isSupabaseConfigured || !userId) return localHighlights.remove(pageId, highlightId)

  const { error } = await supabase.from('book_highlights').delete().eq('id', highlightId)
  if (error) throw error
}

// --- Темы (topics) и режим тренировки по темам ---
// Ограниченный список тем строго по оглавлению книги — см.
// supabase/add-question-topics.sql и src/data/topics.js. Вопросы привязаны
// к теме через questions.topic_code; режим тренировки собирает вопросы из
// РАЗНЫХ пробников сразу по выбранным темам, а не по одному test_id.

export async function fetchTopics() {
  if (!isSupabaseConfigured) return TOPICS

  const { data, error } = await supabase.from('topics').select('*').order('sort_order', { ascending: true })
  if (error) {
    console.error('fetchTopics error, falling back to local topics list:', error)
    return TOPICS
  }
  return data
}

// Сколько вопросов помечено каждой темой — чтобы в выборе тем сразу было
// видно, по какой теме есть материал, а по какой вопросов ещё нет (и не
// давать выбрать пустую тему). Тянем только topic_code, без текста
// вопросов — это лёгкий запрос.
export async function fetchQuestionCountsByTopic() {
  if (!isSupabaseConfigured) {
    const counts = {}
    store.listAllQuestions().forEach((q) => {
      if (!q.topic_code) return
      counts[q.topic_code] = (counts[q.topic_code] ?? 0) + 1
    })
    return counts
  }

  const { data, error } = await supabase.from('questions').select('topic_code').not('topic_code', 'is', null)
  if (error) {
    console.error('fetchQuestionCountsByTopic error:', error)
    return {}
  }
  const counts = {}
  data.forEach((row) => {
    counts[row.topic_code] = (counts[row.topic_code] ?? 0) + 1
  })
  return counts
}

// Собирает вопросы для тренировочной сессии сразу по нескольким темам, из
// любых пробников. test_id вопросов тренировке не важен — она не привязана
// к конкретному пробнику.
export async function fetchQuestionsByTopics(topicCodes) {
  if (!topicCodes || topicCodes.length === 0) return []

  if (!isSupabaseConfigured) {
    const codeSet = new Set(topicCodes)
    return store.listAllQuestions().filter((q) => q.topic_code && codeSet.has(q.topic_code))
  }

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .in('topic_code', topicCodes)
    .order('topic_code', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('fetchQuestionsByTopics error:', error)
    return []
  }
  return data
}

// --- Пользователи (вкладка «Пользователи» в админке) ---
// auth.users сайт напрямую читать не может — идём через SQL-функции из
// supabase/admin-users.sql, которые сами проверяют, что вызывает админ.
// Без Supabase пользователей нет вообще (входа нет), поэтому и список пуст.

// PGRST202 — PostgREST не нашёл функцию: значит admin-users.sql ещё не выполнен.
function usersRpcError(error) {
  if (error.code === 'PGRST202') {
    return new Error('errors.noUsersFunctions')
  }
  if (error.code === '42501') {
    return new Error('errors.noAdminRole')
  }
  return error
}

export async function fetchUsers() {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) throw usersRpcError(error)
  return data
}

// plan: 'pro' | 'free'
export async function setUserPlan(userId, plan) {
  if (!isSupabaseConfigured) return

  const { error } = await supabase.rpc('admin_set_user_plan', { target_user_id: userId, new_plan: plan })
  if (error) throw usersRpcError(error)
}

// --- Результаты тестов («Мой прогресс») ---
// Попытка = одно нажатие «Завершить»:
//   { test_id, score, max_score, questions_count, answered_count,
//     duration_seconds, answers: [{question_id, score, max}], completed_at }
// Вошёл и Supabase настроен — в user_progress (supabase/add-progress.sql),
// иначе — в этом браузере (localProgress.js).

const PROGRESS_COLUMNS =
  'id, test_id, score, max_score, questions_count, answered_count, duration_seconds, answers, completed_at'

// Попытки, которые лежат в браузере (сделаны до входа или пока в базе не
// было колонок), переносим в аккаунт, как только запись в базу работает.
async function uploadLocalAttempts(userId) {
  const local = localProgress.list()
  if (local.length === 0) return
  const rows = local.map(({ id: _localId, ...attempt }) => ({ ...attempt, user_id: userId }))
  const { error } = await supabase.from('user_progress').insert(rows)
  if (error) {
    console.warn('uploadLocalAttempts: пока не получилось перенести попытки из браузера:', error)
    return
  }
  localProgress.clear()
}

export async function saveAttempt(userId, attempt) {
  if (!isSupabaseConfigured || !userId) return { ...localProgress.save(attempt), savedLocally: true }

  const { data, error } = await supabase
    .from('user_progress')
    .insert({ ...attempt, user_id: userId })
    .select(PROGRESS_COLUMNS)
    .single()
  if (error) {
    // Скорее всего, add-progress.sql ещё не выполнен (нет колонок) — не теряем
    // результат, а кладём его хотя бы в браузер.
    console.error('saveAttempt error, saving locally:', error)
    return { ...localProgress.save(attempt), savedLocally: true }
  }
  await uploadLocalAttempts(userId)
  return data
}

export async function fetchAttempts(userId) {
  if (!isSupabaseConfigured || !userId) return localProgress.list()

  await uploadLocalAttempts(userId)
  const { data, error } = await supabase
    .from('user_progress')
    .select(PROGRESS_COLUMNS)
    .eq('user_id', userId)
    .order('completed_at', { ascending: true })
  if (error) {
    console.error('fetchAttempts error, falling back to local store:', error)
    return localProgress.list()
  }
  return data
}
