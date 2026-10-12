// Незавершённые попытки (черновики): начал пробник и ушёл — ответы, текущий
// вопрос и время на таймере сохраняются, тест можно продолжить позже.
// Где хранится (как словарь, см. lib/vocabulary.js):
//   • вошёл и Supabase настроен — в таблице user_test_drafts (с любого
//     устройства; нужен supabase/add-test-drafts.sql);
//   • гость (или таблицы ещё нет) — в localStorage этого браузера.
// При входе черновики из браузера переносятся в аккаунт.
//
// Черновик: { test_id, translation_group, answers: [{question_id, selected,
// score, max}], current_step, elapsed_seconds, questions_count, updated_at }.
// Один черновик на языковую версию пробника; после «Завершить» удаляется.

import { supabase, isSupabaseConfigured } from './supabaseClient'

const STORAGE_KEY = 'exam-prep-drafts' // { [test_id]: draft }
const COLUMNS = 'test_id, translation_group, answers, current_step, elapsed_seconds, questions_count, updated_at'

// Таблицы ещё нет (скрипт не выполнен) — работаем в браузере.
const NO_TABLE = ['42P01', 'PGRST205']
let tableMissing = false

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function writeLocal(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // без localStorage черновик просто не сохранится
  }
}

const inAccount = (userId) => isSupabaseConfigured && Boolean(userId) && !tableMissing

function handleError(error, action) {
  if (NO_TABLE.includes(error.code)) {
    tableMissing = true
    console.warn('user_test_drafts не найдена — выполни supabase/add-test-drafts.sql; черновики пока в браузере')
  } else {
    console.error(`Черновики: не получилось ${action}:`, error)
  }
}

// Черновики из браузера — в аккаунт (если там нет более свежего), затем
// браузерная копия очищается.
async function uploadLocal(userId, remote) {
  const local = Object.values(readLocal())
  if (local.length === 0) return remote
  const fresher = local.filter((d) => {
    const existing = remote.find((r) => r.test_id === d.test_id)
    return !existing || existing.updated_at < d.updated_at
  })
  if (fresher.length > 0) {
    const { error } = await supabase
      .from('user_test_drafts')
      .upsert(fresher.map((d) => ({ ...d, user_id: userId })), { onConflict: 'user_id,test_id' })
    if (error) {
      handleError(error, 'перенести черновики из браузера')
      return remote
    }
  }
  writeLocal({})
  const merged = new Map(remote.map((d) => [d.test_id, d]))
  fresher.forEach((d) => merged.set(d.test_id, d))
  return [...merged.values()]
}

// Все черновики, самые свежие первыми.
export async function loadDrafts(userId) {
  let drafts = Object.values(readLocal())
  if (inAccount(userId)) {
    const { data, error } = await supabase.from('user_test_drafts').select(COLUMNS).eq('user_id', userId)
    if (error) handleError(error, 'загрузить')
    else drafts = await uploadLocal(userId, data)
  }
  return drafts.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
}

export async function saveDraft(userId, draft) {
  const row = { ...draft, updated_at: new Date().toISOString() }
  if (inAccount(userId)) {
    const { error } = await supabase
      .from('user_test_drafts')
      .upsert({ ...row, user_id: userId }, { onConflict: 'user_id,test_id' })
    if (!error) return
    handleError(error, 'сохранить')
  }
  writeLocal({ ...readLocal(), [row.test_id]: row })
}

export async function deleteDraft(userId, testId) {
  const local = readLocal()
  if (local[testId]) {
    delete local[testId]
    writeLocal(local)
  }
  if (inAccount(userId)) {
    const { error } = await supabase.from('user_test_drafts').delete().eq('user_id', userId).eq('test_id', testId)
    if (error) handleError(error, 'удалить')
  }
}
