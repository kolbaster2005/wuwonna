// Персональный словарь пользователя. Пока хранится в localStorage браузера —
// этого достаточно для MVP и работает даже без базы. Компоненты ходят только
// через эти функции, так что позже их можно переключить на Supabase, не
// трогая страницы. ВАЖНО: таблица user_vocabulary в full-reset.sql пока
// старой формы (word + context) — при переезде в неё нужно добавить колонки
// translation, example и category, как у записей здесь.

import { uid } from './uid'

const STORAGE_KEY = 'exam-prep-vocabulary'

function cleanWord(raw) {
  return raw.trim().replace(/^[«"'(]+|[»"'.,!?;:)]+$/g, '')
}

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function getVocabulary() {
  return readAll()
}

// Полноценное добавление слова — с полей модалки на странице «Словарь».
export function addWord({ word, translation = '', example = '', category = '' }) {
  const clean = cleanWord(word)
  if (!clean) return getVocabulary()

  const list = getVocabulary()
  const exists = list.some((e) => e.word.toLowerCase() === clean.toLowerCase())
  if (exists) return list

  const entry = {
    id: uid(),
    word: clean,
    translation: translation.trim(),
    example: example.trim(),
    category: category.trim(),
    added_at: new Date().toISOString(),
  }
  const next = [...list, entry]
  writeAll(next)
  return next
}

export function updateWord(id, patch) {
  const next = getVocabulary().map((e) => (e.id === id ? { ...e, ...patch } : e))
  writeAll(next)
  return next
}

export function removeWord(id) {
  const next = getVocabulary().filter((e) => e.id !== id)
  writeAll(next)
  return next
}
