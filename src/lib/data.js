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

// Названия вкладки на немецком и английском (supabase/add-languages.sql).
export async function updateCategoryNames(categoryId, { name_de, name_en }) {
  if (!isSupabaseConfigured) return store.saveCategory({ id: categoryId, name_de, name_en })
  const { data, error } = await supabase
    .from('categories')
    .update({ name_de: name_de || null, name_en: name_en || null })
    .eq('id', categoryId)
    .select('id')
  if (error) {
    if (error.code === MISSING_COLUMN) throw new Error('errors.noLanguages')
    throw error
  }
  if (data.length === 0) throw notAllowedError()
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
  'id, category_id, title, description, long_description, originality, is_pinned, is_pro, questions_count, duration_minutes, year, sort_order, section, created_at, lang, translation_group, slug, seo_title, seo_description, download_url'

// Эти колонки появляются только после отдельных SQL-скриптов. Пока скрипт не
// выполнен, запрос с такой колонкой падает (Postgres 42703 "column does not
// exist") — тогда повторяем его без неё, чтобы сайт не ломался, а просто
// работал без этой возможности.
const OPTIONAL_COLUMNS = {
  sort_order: 'supabase/add-test-order.sql',
  section: 'supabase/add-test-sections.sql',
  lang: 'supabase/add-languages.sql',
  translation_group: 'supabase/add-languages.sql',
  slug: 'supabase/add-languages.sql',
  seo_title: 'supabase/add-languages.sql',
  seo_description: 'supabase/add-languages.sql',
  download_url: 'supabase/add-download-url.sql',
}
const MISSING_COLUMN = '42703'

// --- Языковые версии пробников (supabase/add-languages.sql) ---
// Каждая языковая версия — своя строка practice_tests со своими вопросами;
// версии одного пробника связаны translation_group. Пока миграция не
// выполнена (или в локальном режиме), всё считается русским и каждый пробник
// — своей группой.

// Поля, общие для всех языковых версий: меняются сразу во всей группе, иначе
// немецкая версия случайно окажется бесплатной при платной русской.
export const SHARED_TEST_FIELDS = [
  'category_id',
  'is_pro',
  'is_pinned',
  'sort_order',
  'year',
  'duration_minutes',
  'originality',
]

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function withLanguage(test) {
  return { ...test, lang: test.lang ?? 'ru', translation_group: test.translation_group ?? test.id, slug: test.slug ?? null }
}

// Название категории (вкладки) на языке страницы, пустое — русское.
export function categoryName(category, lang) {
  return (lang !== 'ru' && category[`name_${lang}`]) || category.name
}

// По одной версии на группу: на языке страницы, а если её нет — русская
// (is_fallback: true — на карточке пометка, у страницы noindex).
export function pickVersions(tests, lang) {
  const groups = new Map()
  tests.forEach((t) => groups.set(t.translation_group, [...(groups.get(t.translation_group) ?? []), t]))
  return [...groups.values()]
    .map((versions) => {
      const own = versions.find((t) => t.lang === lang)
      if (own) return { ...own, is_fallback: false }
      const fallback = versions.find((t) => t.lang === 'ru')
      return fallback ? { ...fallback, is_fallback: lang !== 'ru' } : null
    })
    .filter(Boolean)
}

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

function localTests() {
  return store
    .listTests()
    .map((t) => withLanguage({ ...t, questions_count: store.listQuestions(t.id).length, has_pdf: Boolean(t.pdf_url) }))
}

// lang не указан — все языковые версии (админка). Указан — по одной версии
// на группу: на этом языке или русская (см. pickVersions).
export async function fetchTests({ categoryId, lang } = {}) {
  const finish = (tests) => {
    const filtered = categoryId ? tests.filter((t) => t.category_id === categoryId) : tests
    return sortTests(lang ? pickVersions(filtered, lang) : filtered)
  }
  if (!isSupabaseConfigured) return finish(localTests())

  // Сортировка целиком на стороне sortTests — так запрос не зависит от того,
  // есть ли уже колонка sort_order в базе.
  const { data, error } = await selectTests((columns) => {
    let query = supabase.from('practice_tests').select(columns)
    if (categoryId) query = query.eq('category_id', categoryId)
    if (lang && columns.includes('lang')) query = query.in('lang', [...new Set([lang, 'ru'])])
    return query
  })
  if (error) {
    console.error('fetchTests error, falling back to local store:', error)
    return finish(localTests())
  }
  return finish((await attachHasPdf(await attachQuestionCounts(data))).map(withLanguage))
}

export async function fetchTestById(testId) {
  if (!isSupabaseConfigured) return localTests().find((t) => t.id === testId) ?? null

  const { data, error } = await selectTests((columns) =>
    supabase.from('practice_tests').select(columns).eq('id', testId).single(),
  )
  if (error) {
    console.error('fetchTestById error, falling back to local store:', error)
    return localTests().find((t) => t.id === testId) ?? null
  }
  const [withCount] = await attachHasPdf(await attachQuestionCounts([data]))
  return withLanguage(withCount)
}

// Пробник по адресу страницы (/de/probetests/<slugOrId>):
//   слаг среди версий языка страницы -> среди русских (фоллбэк) -> по id
//   (старые ссылки) -> null (404).
// Возвращает { test, redirect }: redirect — версия, на адрес которой надо
// перейти (у группы есть версия на языке страницы, или открыли по id).
// test.is_fallback — показываем русскую версию на чужом языке.
export async function fetchTestByPath(lang, slugOrId) {
  let candidates
  if (!isSupabaseConfigured) {
    candidates = localTests()
  } else {
    const { data, error } = await selectTests((columns) => {
      const query = supabase.from('practice_tests').select(columns)
      if (!columns.includes('slug')) {
        return UUID.test(slugOrId) ? query.eq('id', slugOrId) : Promise.resolve({ data: [], error: null })
      }
      return UUID.test(slugOrId) ? query.or(`slug.eq.${slugOrId},id.eq.${slugOrId}`) : query.eq('slug', slugOrId)
    })
    if (error) {
      console.error('fetchTestByPath error, falling back to local store:', error)
      candidates = localTests()
    } else {
      candidates = data.map(withLanguage)
    }
  }

  const bySlug = candidates.filter((t) => t.slug === slugOrId)
  let test = bySlug.find((t) => t.lang === lang) ?? bySlug.find((t) => t.lang === 'ru')
  const foundBySlug = Boolean(test)
  test ??= candidates.find((t) => t.id === slugOrId)
  if (!test) return { test: null, redirect: null }

  // Нужна другая версия той же группы: своя для языка страницы, если есть.
  let redirect = foundBySlug ? null : test
  if (test.lang !== lang) {
    const versions = await fetchTestVersions(test.translation_group)
    const own = versions.find((v) => v.lang === lang)
    if (own) redirect = { ...test, ...own }
  }

  const [full] = isSupabaseConfigured ? await attachHasPdf(await attachQuestionCounts([test])) : [test]
  return { test: { ...full, is_fallback: full.lang !== lang }, redirect }
}

// Все языковые версии одного пробника: [{ id, lang, slug }] — для
// переключателя языка.
export async function fetchTestVersions(translationGroup) {
  if (!translationGroup) return []
  if (!isSupabaseConfigured) {
    return localTests()
      .filter((t) => t.translation_group === translationGroup)
      .map(({ id, lang, slug }) => ({ id, lang, slug }))
  }
  const { data, error } = await supabase
    .from('practice_tests')
    .select('id, lang, slug')
    .eq('translation_group', translationGroup)
  if (error) {
    // Колонок ещё нет — у пробника только русская версия (группа = id).
    if (error.code !== MISSING_COLUMN) console.error('fetchTestVersions error:', error)
    return [{ id: translationGroup, lang: 'ru', slug: null }]
  }
  return data.map(withLanguage)
}

// Слаг уже занят другой версией на этом языке?
export async function isSlugTaken(lang, slug, exceptId) {
  if (!slug) return false
  if (!isSupabaseConfigured) return localTests().some((t) => t.lang === lang && t.slug === slug && t.id !== exceptId)
  const { data, error } = await supabase.from('practice_tests').select('id').eq('lang', lang).eq('slug', slug)
  if (error) return false
  return data.some((row) => row.id !== exceptId)
}

// Копия пробника на другой язык (тест + вопросы + тексты) — SQL-функция
// create_test_translation из add-languages.sql. Возвращает id копии.
export async function createTestTranslation(sourceTestId, targetLang) {
  if (!isSupabaseConfigured) return store.createTestTranslation(sourceTestId, targetLang)
  const { data, error } = await supabase.rpc('create_test_translation', {
    source_test_id: sourceTestId,
    target_lang: targetLang,
  })
  if (error) {
    if (error.code === 'PGRST202') throw new Error('errors.noLanguages')
    if (error.message?.includes('already exists')) throw new Error('errors.versionExists')
    throw error
  }
  return data
}

// update по всей группе переводов (а без колонок языков — по id).
async function updateGroup(test, patch) {
  const group = test.translation_group ?? test.id
  let result = await supabase.from('practice_tests').update(patch).eq('translation_group', group).select('id')
  if (result.error?.code === MISSING_COLUMN) {
    result = await supabase.from('practice_tests').update(patch).eq('id', test.id).select('id')
  }
  if (result.error) throw result.error
  if (result.data.length === 0) throw notAllowedError()
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
  if (error?.code === MISSING_COLUMN && error.message?.includes('download_url')) throw new Error('errors.noDownloadUrl')
  if (error) throw error
  // Общие поля (SHARED_TEST_FIELDS) — сразу во всех языковых версиях.
  if (test.id && data.translation_group) {
    const shared = Object.fromEntries(SHARED_TEST_FIELDS.filter((f) => f in test).map((f) => [f, test[f]]))
    await updateGroup(data, shared)
  }
  return data
}

// Сохраняет порядок пробников после перетаскивания в админке: sort_order =
// позиция в orderedGroups (translation_group) — сразу у всех языковых версий.
// Отдельные update, а не upsert — upsert с неполной строкой падает на
// NOT NULL-колонках (см. setTestProAccess).
export async function reorderTests(orderedGroups) {
  if (!isSupabaseConfigured) return store.reorderTests(orderedGroups)

  const byGroup = (column) =>
    Promise.all(
      orderedGroups.map((group, index) =>
        supabase.from('practice_tests').update({ sort_order: index }).eq(column, group).select('id'),
      ),
    )
  let results = await byGroup('translation_group')
  // Колонки языков ещё нет — группа = id пробника.
  if (results.some((r) => r.error?.message?.includes('translation_group'))) results = await byGroup('id')
  const failed = results.find((r) => r.error)
  if (failed?.error.code === MISSING_COLUMN) {
    throw new Error('errors.noSortOrder')
  }
  if (failed) throw failed.error
  if (results.some((r) => r.data.length === 0)) throw notAllowedError()
}

// Переключает доступ к пробнику: только PRO или для всех — у всех языковых
// версий сразу. Отдельный update, а не saveTest (upsert): upsert с одним
// полем вместо всей строки в Postgres падает на NOT NULL-колонках (title и т.п.).
// test — { id, translation_group }.
export async function setTestProAccess(test, isPro) {
  if (!isSupabaseConfigured) return store.updateGroup(test, { is_pro: isPro })
  await updateGroup(test, { is_pro: isPro })
}

// Закрепить/открепить пробник (все языковые версии). Отдельный update —
// upsert с неполной строкой падает на NOT NULL-колонках (см. setTestProAccess).
export async function setTestPinned(test, isPinned) {
  if (!isSupabaseConfigured) return store.updateGroup(test, { is_pinned: isPinned })
  await updateGroup(test, { is_pinned: isPinned })
}

// Переносит пробник (все языковые версии) в другую категорию — вкладку на
// странице «Пробники» — прямо из списка в админке.
export async function setTestCategory(test, categoryId) {
  if (!isSupabaseConfigured) return store.updateGroup(test, { category_id: categoryId })
  await updateGroup(test, { category_id: categoryId })
}

// Удаляет одну языковую версию. Русскую, пока есть другие, удалить нельзя:
// она — запасная версия для языков без перевода.
export async function deleteTest(testId) {
  const test = await fetchTestById(testId)
  if (test?.lang === 'ru') {
    const versions = await fetchTestVersions(test.translation_group)
    if (versions.some((v) => v.lang !== 'ru')) throw new Error('errors.deleteRussianFirst')
  }
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

// translation_group попытки — для браузера (в базе группа берётся из
// practice_tests): попытка на любой языковой версии засчитывается всей группе.
function attemptRow({ translation_group: _group, ...attempt }) {
  return attempt
}

// Попытки, которые лежат в браузере (сделаны до входа или пока в базе не
// было колонок), переносим в аккаунт, как только запись в базу работает.
async function uploadLocalAttempts(userId) {
  const local = localProgress.list()
  if (local.length === 0) return
  const rows = local.map(({ id: _localId, ...attempt }) => ({ ...attemptRow(attempt), user_id: userId }))
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
    .insert({ ...attemptRow(attempt), user_id: userId })
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

// Каждая попытка — с translation_group своего пробника (для
// attemptsForShownTests в lib/progress.js).
export async function fetchAttempts(userId) {
  if (!isSupabaseConfigured || !userId) return localProgress.list()

  await uploadLocalAttempts(userId)
  const query = (columns) =>
    supabase.from('user_progress').select(columns).eq('user_id', userId).order('completed_at', { ascending: true })
  let { data, error } = await query(`${PROGRESS_COLUMNS}, practice_tests(translation_group)`)
  // Колонки языков ещё нет — без группы (она = test_id).
  if (error?.code === MISSING_COLUMN) ({ data, error } = await query(PROGRESS_COLUMNS))
  if (error) {
    console.error('fetchAttempts error, falling back to local store:', error)
    return localProgress.list()
  }
  return data.map(({ practice_tests: test, ...attempt }) => ({
    ...attempt,
    translation_group: test?.translation_group ?? attempt.test_id,
  }))
}
