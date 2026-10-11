import { useEffect, useState } from 'react'
import { X, Languages } from 'lucide-react'
import { translateText } from '../data/translations'

export default function AddWordModal({ initial, existingCategories, onSave, onClose }) {
  const isEditing = Boolean(initial?.id)
  const [word, setWord] = useState(initial?.word ?? '')
  const [translation, setTranslation] = useState(initial?.translation ?? '')
  const [example, setExample] = useState(initial?.example ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [error, setError] = useState('')

  const [translatingWord, setTranslatingWord] = useState(false)
  const [examplePreview, setExamplePreview] = useState(null)
  const [translatingExample, setTranslatingExample] = useState(false)

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function handleTranslateWord() {
    if (!word.trim() || translatingWord) return
    setTranslatingWord(true)
    try {
      const result = await translateText(word.trim())
      setTranslation(result)
    } catch (err) {
      setTranslation(err.message ?? 'Не получилось перевести.')
    } finally {
      setTranslatingWord(false)
    }
  }

  async function handleTranslateExample() {
    if (!example.trim() || translatingExample) return
    setTranslatingExample(true)
    try {
      const result = await translateText(example.trim())
      setExamplePreview(result)
    } catch (err) {
      setExamplePreview(err.message ?? 'Не получилось перевести.')
    } finally {
      setTranslatingExample(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!word.trim()) {
      setError('Впиши слово.')
      return
    }
    onSave({ word: word.trim(), translation: translation.trim(), example: example.trim(), category: category.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{isEditing ? 'Редактировать слово' : 'Добавить слово'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink/40 hover:bg-black/5 hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-semibold">Слово</label>
            <div className="mt-1.5 flex gap-2">
              <input
                autoFocus
                value={word}
                onChange={(e) => setWord(e.target.value)}
                className="flex-1 rounded-lg border border-line px-3 py-2 text-sm focus:outline-none"
                placeholder="например, Wirtschaftswachstum"
              />
              <button
                type="button"
                onClick={handleTranslateWord}
                disabled={translatingWord}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink/60 hover:border-ink/30 disabled:opacity-50"
              >
                <Languages size={14} /> {translatingWord ? '...' : 'Перевести'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">Перевод</label>
            <input
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none"
              placeholder="можно вписать вручную или получить кнопкой выше"
            />
          </div>

          <div>
            <label className="text-sm font-semibold">Пример (необязательно, один)</label>
            <textarea
              value={example}
              onChange={(e) => {
                setExample(e.target.value)
                setExamplePreview(null)
              }}
              rows={2}
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none"
              placeholder="Пример использования слова"
            />
            {example.trim() && (
              <button
                type="button"
                onClick={handleTranslateExample}
                disabled={translatingExample}
                className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink/50 hover:text-ink disabled:opacity-50"
              >
                <Languages size={13} /> {translatingExample ? 'Переводим...' : 'Перевести пример'}
              </button>
            )}
            {examplePreview && <p className="mt-1.5 rounded-lg bg-paper px-3 py-2 text-xs text-ink/60">{examplePreview}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold">Категория (необязательно)</label>
            <input
              list="vocab-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none"
              placeholder="например, Экономика"
            />
            <datalist id="vocab-categories">
              {existingCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" className="rounded-lg bg-pine-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-pine-700">
              Сохранить
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-ink/60 hover:border-ink/30"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
