// Личный словарь. Где хранится:
//   • вошёл и Supabase настроен — в таблице user_vocabulary (виден с любого
//     устройства; нужен supabase/add-vocabulary.sql);
//   • гость (или база недоступна) — в localStorage этого браузера.
// При входе слова из браузера переносятся в аккаунт (как результаты тестов).
// Страницы ходят сюда не напрямую, а через хук useVocabulary().

import { supabase, isSupabaseConfigured } from './supabaseClient'
import { uid } from './uid'

const STORAGE_KEY = 'exam-prep-vocabulary'
const COLUMNS = 'id, word, translation, example, category, added_at'

export function cleanWord(raw) {
  return raw.trim().replace(/^[«"'(]+|[»"'.,!?;:)]+$/g, '')
}

function normalize({ word, translation = '', example = '', category = '' }) {
  return {
    word: cleanWord(word),
    translation: (translation ?? '').trim(),
    example: (example ?? '').trim(),
    category: (category ?? '').trim(),
  }
}

function sameWord(a, b) {
  return a.toLowerCase() === b.toLowerCase()
}

// --- браузер ---

function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeLocal(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

// --- аккаунт ---

const inAccount = (userId) => isSupabaseConfigured && Boolean(userId)

function fromRow(row) {
  return {
    id: row.id,
    word: row.word,
    translation: row.translation ?? '',
    example: row.example ?? '',
    category: row.category ?? '',
    added_at: row.added_at,
  }
}

// Слова, накопленные в браузере до входа, — в аккаунт (без дублей), затем
// браузерная копия очищается. Если база ещё не готова — слова остаются в
// браузере и перенесутся при следующей загрузке.
async function uploadLocalWords(userId, remoteWords) {
  const local = readLocal()
  if (local.length === 0) return remoteWords
  const fresh = local.filter((w) => !remoteWords.some((r) => sameWord(r.word, w.word)))
  if (fresh.length > 0) {
    const rows = fresh.map((w) => ({ ...normalize(w), user_id: userId, added_at: w.added_at }))
    const { data, error } = await supabase.from('user_vocabulary').insert(rows).select(COLUMNS)
    if (error) {
      console.warn('Словарь: пока не получилось перенести слова из браузера в аккаунт:', error)
      return remoteWords
    }
    remoteWords = [...remoteWords, ...data.map(fromRow)]
  }
  localStorage.removeItem(STORAGE_KEY)
  return remoteWords
}

// Все слова. Возвращает { words, local } — local: true, если слова сейчас
// только в браузере (гость или база недоступна).
export async function loadWords(userId) {
  if (!inAccount(userId)) return { words: readLocal(), local: true }

  const { data, error } = await supabase
    .from('user_vocabulary')
    .select(COLUMNS)
    .eq('user_id', userId)
    .order('added_at', { ascending: true })
  if (error) {
    console.error('Словарь: не получилось загрузить из аккаунта, показываю слова из браузера:', error)
    return { words: readLocal(), local: true }
  }
  return { words: await uploadLocalWords(userId, data.map(fromRow)), local: false }
}

// Добавить слово. Возвращает новую запись или null, если такое слово уже есть.
export async function addWord(userId, input, existing = []) {
  const entry = normalize(input)
  if (!entry.word || existing.some((e) => sameWord(e.word, entry.word))) return null

  if (inAccount(userId)) {
    const { data, error } = await supabase
      .from('user_vocabulary')
      .insert({ ...entry, user_id: userId })
      .select(COLUMNS)
      .single()
    if (!error) return fromRow(data)
    if (error.code === '23505') return null // уже есть в аккаунте
    console.error('Словарь: не получилось сохранить в аккаунт, сохраняю в браузере:', error)
  }

  const saved = { ...entry, id: uid(), added_at: new Date().toISOString() }
  writeLocal([...readLocal(), saved])
  return saved
}

export async function updateWord(userId, id, patch) {
  const changes = normalize(patch)
  if (inAccount(userId)) {
    const { data, error } = await supabase
      .from('user_vocabulary')
      .update(changes)
      .eq('id', id)
      .select(COLUMNS)
      .single()
    if (!error) return fromRow(data)
    console.error('Словарь: не получилось изменить слово в аккаунте:', error)
  }
  const list = readLocal().map((e) => (e.id === id ? { ...e, ...changes } : e))
  writeLocal(list)
  return list.find((e) => e.id === id) ?? { id, ...changes }
}

export async function removeWord(userId, id) {
  if (inAccount(userId)) {
    const { error } = await supabase.from('user_vocabulary').delete().eq('id', id)
    if (!error) return
    console.error('Словарь: не получилось удалить слово из аккаунта:', error)
  }
  writeLocal(readLocal().filter((e) => e.id !== id))
}
