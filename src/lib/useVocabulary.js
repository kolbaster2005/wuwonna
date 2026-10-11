import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from './authContext'
import * as vocabulary from './vocabulary'

// Словарь для страниц: сам знает, вошёл ли человек, и берёт слова из аккаунта
// или из браузера (см. lib/vocabulary.js).
//   entries     — список слов
//   categories  — категории без повторов (для подсказок в окне добавления)
//   local       — true, если слова сейчас только в этом браузере
//   add/update/remove — изменить словарь (async)
export function useVocabulary() {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id
  const [entries, setEntries] = useState([])
  const [local, setLocal] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    let alive = true
    vocabulary.loadWords(userId).then(({ words, local: isLocal }) => {
      if (!alive) return
      setEntries(words)
      setLocal(isLocal)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [authLoading, userId])

  const add = useCallback(
    async (data) => {
      const saved = await vocabulary.addWord(userId, data, entries)
      if (saved) setEntries((prev) => [...prev, saved])
      return saved
    },
    [userId, entries],
  )

  const update = useCallback(
    async (id, patch) => {
      const saved = await vocabulary.updateWord(userId, id, patch)
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...saved } : e)))
    },
    [userId],
  )

  const remove = useCallback(
    async (id) => {
      await vocabulary.removeWord(userId, id)
      setEntries((prev) => prev.filter((e) => e.id !== id))
    },
    [userId],
  )

  const categories = useMemo(() => [...new Set(entries.map((e) => e.category).filter(Boolean))], [entries])

  return { entries, categories, local, loading, add, update, remove }
}
