import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react'
import { fetchChapters, saveChapter, deleteChapter } from '../../lib/data'
import { reportErrors } from '../../lib/reportErrors'
import RichTextEditor from '../../components/admin/RichTextEditor'
import { useConfirm } from '../../lib/confirmDialog'

function ChapterForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Впиши название главы.')
      return
    }
    onSave({ title: title.trim(), content: content.trim() || null })
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line bg-paper/60 p-5">
      <div>
        <label className="text-sm font-semibold">Название главы</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:outline-none"
          placeholder="Например: 1. Warum wir wirtschaften und was Wirtschaften bedeutet"
        />
      </div>

      <div className="mt-4">
        <label className="text-sm font-semibold">Вступительный текст (необязательно)</label>
        <p className="mb-1.5 text-xs text-ink/40">
          Абзац сразу под заголовком главы, до первой подглавы — если он есть в учебнике. Сама подглава наполняется
          страницами отдельно, после сохранения главы.
        </p>
        <RichTextEditor value={content} onChange={setContent} rows={4} placeholder="Необязательно" />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button type="submit" className="bg-pine-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-pine-700">
          Сохранить главу
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-line px-5 py-2.5 text-sm font-semibold text-ink/60 hover:border-ink/30"
        >
          Отмена
        </button>
      </div>
    </form>
  )
}

export default function AdminBookPage() {
  const confirmAction = useConfirm()
  const [chapters, setChapters] = useState([])
  const [formOpen, setFormOpen] = useState(null) // null | 'new' | chapterId

  function reload() {
    fetchChapters().then(setChapters)
  }

  useEffect(reload, [])

  async function handleSave(data) {
    const id = formOpen !== 'new' ? formOpen : undefined
    await reportErrors('сохранить главу', async () => {
      await saveChapter({ ...data, id })
      setFormOpen(null)
      reload()
    })
  }

  async function handleDelete(chapter) {
    const ok = await confirmAction({
      title: `Удалить главу «${chapter.title}»?`,
      message: 'Все её подглавы, страницы и заметки читателей тоже пропадут.',
      confirmLabel: 'Удалить',
      danger: true,
    })
    if (!ok) return
    await reportErrors('удалить главу', async () => {
      await deleteChapter(chapter.id)
      reload()
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Главы книги ({chapters.length})</h2>
        {formOpen === null && (
          <button
            onClick={() => setFormOpen('new')}
            className="flex items-center gap-2 bg-pine-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-pine-700"
          >
            <Plus size={16} /> Добавить главу
          </button>
        )}
      </div>

      {formOpen === 'new' && (
        <div className="mt-4">
          <ChapterForm onSave={handleSave} onCancel={() => setFormOpen(null)} />
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {chapters.map((c) => (
          <li key={c.id} className="border border-line bg-white p-4">
            {formOpen === c.id ? (
              <ChapterForm initial={c} onSave={handleSave} onCancel={() => setFormOpen(null)} />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-pine-50 text-pine-700">
                    <BookOpen size={15} />
                  </span>
                  <p className="text-sm font-semibold">{c.title}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    to={`/admin/kniga/${c.id}`}
                    className="border border-line px-3 py-2 text-xs font-semibold text-ink/70 hover:border-ink/30"
                  >
                    Подглавы →
                  </Link>
                  <button
                    onClick={() => setFormOpen(c.id)}
                    className="p-2 text-ink/40 hover:bg-black/5 hover:text-ink"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="p-2 text-ink/40 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {chapters.length === 0 && formOpen === null && (
        <p className="mt-4 border border-dashed border-line py-8 text-center text-sm text-ink/50">
          Глав пока нет — добавь первую.
        </p>
      )}
    </div>
  )
}
