import { useEffect, useState } from 'react'
import { X, Languages } from 'lucide-react'
import { translateText } from '../data/translations'
import { useI18n } from '../i18n'

export default function AddWordModal({ initial, existingCategories, onSave, onClose }) {
  const isEditing = Boolean(initial?.id)
  const { t, lang, errorText } = useI18n()
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
      const result = await translateText(word.trim(), lang)
      setTranslation(result)
    } catch (err) {
      setTranslation(errorText(err) || t('addWord.translateFailed'))
    } finally {
      setTranslatingWord(false)
    }
  }

  async function handleTranslateExample() {
    if (!example.trim() || translatingExample) return
    setTranslatingExample(true)
    try {
      const result = await translateText(example.trim(), lang)
      setExamplePreview(result)
    } catch (err) {
      setExamplePreview(errorText(err) || t('addWord.translateFailed'))
    } finally {
      setTranslatingExample(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!word.trim()) {
      setError(t('addWord.wordRequired'))
      return
    }
    onSave({ word: word.trim(), translation: translation.trim(), example: example.trim(), category: category.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md border border-line bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{isEditing ? t('addWord.editTitle') : t('addWord.addTitle')}</h2>
          <button onClick={onClose} className="p-1.5 text-ink/40 hover:bg-black/5 hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-sm font-semibold">{t('addWord.word')}</label>
            <div className="mt-1.5 flex gap-2">
              <input
                autoFocus
                value={word}
                onChange={(e) => setWord(e.target.value)}
                className="flex-1 border border-line px-3 py-2 text-sm focus:outline-none"
                placeholder={t('addWord.wordPlaceholder')}
              />
              <button
                type="button"
                onClick={handleTranslateWord}
                disabled={translatingWord}
                className="flex shrink-0 items-center gap-1.5 border border-ink/25 px-3 py-2 text-xs font-semibold text-ink/60 hover:border-pine-600 hover:bg-pine-50 hover:text-pine-700 disabled:opacity-50"
              >
                <Languages size={14} /> {translatingWord ? '...' : t('addWord.translate')}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold">{t('addWord.translation')}</label>
            <input
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              className="mt-1.5 w-full border border-line px-3 py-2 text-sm focus:outline-none"
              placeholder={t('addWord.translationPlaceholder')}
            />
          </div>

          <div>
            <label className="text-sm font-semibold">{t('addWord.example')}</label>
            <textarea
              value={example}
              onChange={(e) => {
                setExample(e.target.value)
                setExamplePreview(null)
              }}
              rows={2}
              className="mt-1.5 w-full border border-line px-3 py-2 text-sm focus:outline-none"
              placeholder={t('addWord.examplePlaceholder')}
            />
            {example.trim() && (
              <button
                type="button"
                onClick={handleTranslateExample}
                disabled={translatingExample}
                className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink/50 hover:text-ink disabled:opacity-50"
              >
                <Languages size={13} /> {translatingExample ? t('addWord.translating') : t('addWord.translateExample')}
              </button>
            )}
            {examplePreview && <p className="mt-1.5 bg-paper px-3 py-2 text-xs text-ink/60">{examplePreview}</p>}
          </div>

          <div>
            <label className="text-sm font-semibold">{t('addWord.category')}</label>
            <input
              list="vocab-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 w-full border border-line px-3 py-2 text-sm focus:outline-none"
              placeholder={t('addWord.categoryPlaceholder')}
            />
            <datalist id="vocab-categories">
              {existingCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" className="bg-pine-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-pine-700">
              {t('addWord.save')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border border-ink/25 px-5 py-2.5 text-sm font-semibold text-ink/60 hover:border-pine-600 hover:bg-pine-50 hover:text-pine-700"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
