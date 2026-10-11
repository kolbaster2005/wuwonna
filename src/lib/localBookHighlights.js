// Локальный фолбэк для выделений и заметок в книге — на случай, если
// Supabase не подключен или человек не залогинен. Работает только в этом
// браузере и не синхронизируется между устройствами (в отличие от
// book_highlights в Supabase, где прогресс привязан к аккаунту).

import { uid } from './uid'

const STORAGE_KEY = 'exam-prep-book-highlights' // { [chapterId]: Highlight[] }

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function list(chapterId) {
  return readAll()[chapterId] ?? []
}

export function save(chapterId, highlight) {
  const map = readAll()
  const items = map[chapterId] ?? []
  const idx = items.findIndex((h) => h.id === highlight.id)
  let result
  if (idx === -1) {
    result = { ...highlight, id: highlight.id || uid() }
    map[chapterId] = [...items, result]
  } else {
    result = { ...items[idx], ...highlight }
    map[chapterId] = items.map((h) => (h.id === highlight.id ? result : h))
  }
  writeAll(map)
  return result
}

export function remove(chapterId, highlightId) {
  const map = readAll()
  map[chapterId] = (map[chapterId] ?? []).filter((h) => h.id !== highlightId)
  writeAll(map)
}
