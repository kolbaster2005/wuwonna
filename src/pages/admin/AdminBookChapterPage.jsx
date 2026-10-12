import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, FileStack } from 'lucide-react'
import { fetchChapterById, fetchSubchapters, saveSubchapter, deleteSubchapter, fetchPages } from '../../lib/data'
import { reportErrors } from '../../lib/reportErrors'
import { useConfirm } from '../../lib/confirmDialog'

function SubchapterForm({ initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Впиши название подглавы.')
      return
    }
    onSave({ title: title.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line bg-paper/60 p-5">
      <label className="text-sm font-semibold">Название подглавы</label>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:outline-none"
        placeholder="Например: 1.1 Jeder Mensch ist Teil der Wirtschaft"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" className="bg-pine-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-pine-700">
          Сохранить
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

export default function AdminBookChapterPage() {
  const confirmAction = useConfirm()
  const { chapterId } = useParams()
  const [chapter, setChapter] = useState(undefined)
  const [subchapters, setSubchapters] = useState([])
  const [pageCounts, setPageCounts] = useState({})
  const [formOpen, setFormOpen] = useState(null) // null | 'new' | subchapterId

  useEffect(() => {
    fetchChapterById(chapterId).then(setChapter)
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterId])

  function reload() {
    fetchSubchapters(chapterId).then(async (subs) => {
      setSubchapters(subs)
      const counts = {}
      await Promise.all(
        subs.map(async (s) => {
          const pages = await fetchPages(s.id)
          counts[s.id] = pages.length
        }),
      )
      setPageCounts(counts)
    })
  }

  async function handleSave(data) {
    const id = formOpen !== 'new' ? formOpen : undefined
    await reportErrors('сохранить подглаву', async () => {
      await saveSubchapter(chapterId, { ...data, id })
      setFormOpen(null)
      reload()
    })
  }

  async function handleDelete(sub) {
    const ok = await confirmAction({
      title: `Удалить подглаву «${sub.title}»?`,
      message: 'Все её страницы и заметки читателей тоже пропадут.',
      confirmLabel: 'Удалить',
      danger: true,
    })
    if (!ok) return
    await reportErrors('удалить подглаву', async () => {
      await deleteSubchapter(chapterId, sub.id)
      reload()
    })
  }

  if (chapter === undefined) return <p className="text-sm text-ink/40">Загрузка...</p>

  return (
    <div>
      <Link to="/admin/kniga" className="flex items-center gap-1.5 text-sm font-semibold text-ink/50 hover:text-ink">
        <ArrowLeft size={15} /> К списку глав
      </Link>

      <h2 className="mt-4 text-lg font-bold">{chapter?.title}</h2>

      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-base font-bold">Подглавы ({subchapters.length})</h3>
        {formOpen === null && (
          <button
            onClick={() => setFormOpen('new')}
            className="flex items-center gap-2 bg-pine-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-pine-700"
          >
            <Plus size={16} /> Добавить подглаву
          </button>
        )}
      </div>

      {formOpen === 'new' && (
        <div className="mt-4">
          <SubchapterForm onSave={handleSave} onCancel={() => setFormOpen(null)} />
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {subchapters.map((s) => (
          <li key={s.id} className="border border-line bg-white p-4">
            {formOpen === s.id ? (
              <SubchapterForm initial={s} onSave={handleSave} onCancel={() => setFormOpen(null)} />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-pine-50 text-pine-700">
                    <FileStack size={15} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="mt-0.5 text-xs text-ink/40">{pageCounts[s.id] ?? 0} страниц</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    to={`/admin/kniga/${chapterId}/${s.id}`}
                    className="border border-line px-3 py-2 text-xs font-semibold text-ink/70 hover:border-ink/30"
                  >
                    Страницы →
                  </Link>
                  <button
                    onClick={() => setFormOpen(s.id)}
                    className="p-2 text-ink/40 hover:bg-black/5 hover:text-ink"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
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

      {subchapters.length === 0 && formOpen === null && (
        <p className="mt-4 border border-dashed border-line py-8 text-center text-sm text-ink/50">
          Подглав пока нет — добавь первую.
        </p>
      )}
    </div>
  )
}
