// Локальный фолбэк для результатов тестов («Мой прогресс») — если Supabase
// не подключен, человек не вошёл или в базе ещё нет нужных колонок
// (supabase/add-progress.sql не выполнен). Живёт только в этом браузере.

import { uid } from './uid'

const STORAGE_KEY = 'exam-prep-progress' // Attempt[]

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function list() {
  return readAll()
}

export function save(attempt) {
  const saved = { ...attempt, id: uid(), completed_at: attempt.completed_at ?? new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...readAll(), saved]))
  return saved
}

// Вызывается после переноса попыток в аккаунт (data.js) — чтобы они не
// загрузились второй раз.
export function clear() {
  localStorage.removeItem(STORAGE_KEY)
}
