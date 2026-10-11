import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, ImageIcon, Video, ImagePlus, X } from 'lucide-react'
import { fetchSubchapterById, fetchPages, savePage, deletePage } from '../../lib/data'
import { reportErrors } from '../../lib/reportErrors'
import RichTextEditor from '../../components/admin/RichTextEditor'
import { useConfirm } from '../../lib/confirmDialog'

function PageForm({ initial, onSave, onCancel }) {
  const [content, setContent] = useState(initial?.content ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '')
  const [videoUrl, setVideoUrl] = useState(initial?.video_url ?? '')
  const [error, setError] = useState('')

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImageUrl(reader.result)
    reader.readAsDataURL(file)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) {
      setError('Текст страницы не может быть пустым.')
      return
    }
    onSave({ content: content.trim(), image_url: imageUrl || null, video_url: videoUrl.trim() || null })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-paper/60 p-5">
      <label className="text-sm font-semibold">Текст страницы</label>
      <div className="mt-1.5">
        <RichTextEditor value={content} onChange={setContent} rows={10} placeholder="Текст страницы..." />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold">Фото (необязательно)</label>
          {imageUrl ? (
            <div className="mt-1.5 flex items-center gap-3">
              <img src={imageUrl} alt="" className="h-14 w-14 rounded-lg border border-line object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
              >
                <X size={14} /> Убрать
              </button>
            </div>
          ) : (
            <label className="mt-1.5 flex w-full cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line bg-white px-3 py-2 text-sm text-ink/50 hover:border-ink/30">
              <ImagePlus size={16} />
              Загрузить фото
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}
        </div>

        <div>
          <label className="text-sm font-semibold">Видео — ссылка (необязательно)</label>
          <input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none"
            placeholder="YouTube/Vimeo или прямая ссылка на файл"
          />
          <p className="mt-1 text-xs text-ink/40">Видео не загружается на сайт — только ссылка на внешний хостинг.</p>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button type="submit" className="rounded-lg bg-pine-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-pine-700">
          Сохранить страницу
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-ink/60 hover:border-ink/30"
        >
          Отмена
        </button>
      </div>
    </form>
  )
}

export default function AdminBookSubchapterPage() {
  const confirmAction = useConfirm()
  const { chapterId, subchapterId } = useParams()
  const [subchapter, setSubchapter] = useState(undefined)
  const [pages, setPages] = useState([])
  const [formOpen, setFormOpen] = useState(null) // null | 'new' | pageId

  useEffect(() => {
    fetchSubchapterById(subchapterId).then(setSubchapter)
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subchapterId])

  function reload() {
    fetchPages(subchapterId).then(setPages)
  }

  async function handleSave(data) {
    const id = formOpen !== 'new' ? formOpen : undefined
    await reportErrors('сохранить страницу', async () => {
      await savePage(subchapterId, { ...data, id })
      setFormOpen(null)
      reload()
    })
  }

  async function handleDelete(page, index) {
    const ok = await confirmAction({
      title: `Удалить страницу ${index + 1}?`,
      message: 'Заметки читателей к ней тоже пропадут.',
      confirmLabel: 'Удалить',
      danger: true,
    })
    if (!ok) return
    await reportErrors('удалить страницу', async () => {
      await deletePage(subchapterId, page.id)
      reload()
    })
  }

  if (subchapter === undefined) return <p className="text-sm text-ink/40">Загрузка...</p>

  return (
    <div>
      <Link
        to={`/admin/kniga/${chapterId}`}
        className="flex items-center gap-1.5 text-sm font-semibold text-ink/50 hover:text-ink"
      >
        <ArrowLeft size={15} /> К подглавам
      </Link>

      <h2 className="mt-4 text-lg font-bold">{subchapter?.title}</h2>

      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-base font-bold">Страницы ({pages.length})</h3>
        {formOpen === null && (
          <button
            onClick={() => setFormOpen('new')}
            className="flex items-center gap-2 rounded-xl bg-pine-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-pine-700"
          >
            <Plus size={16} /> Добавить страницу
          </button>
        )}
      </div>

      {formOpen === 'new' && (
        <div className="mt-4">
          <PageForm onSave={handleSave} onCancel={() => setFormOpen(null)} />
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {pages.map((p, i) => (
          <li key={p.id} className="rounded-xl border border-line bg-white p-4">
            {formOpen === p.id ? (
              <PageForm initial={p} onSave={handleSave} onCancel={() => setFormOpen(null)} />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-pine-50 px-2.5 py-0.5 text-xs font-semibold text-pine-700">
                      Страница {i + 1}
                    </span>
                    {p.image_url && (
                      <span className="flex items-center gap-1 text-xs text-ink/40">
                        <ImageIcon size={12} /> фото
                      </span>
                    )}
                    {p.video_url && (
                      <span className="flex items-center gap-1 text-xs text-ink/40">
                        <Video size={12} /> видео
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-sm text-ink/70">{p.content}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => setFormOpen(p.id)}
                    className="rounded-lg p-2 text-ink/40 hover:bg-black/5 hover:text-ink"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(p, i)}
                    className="rounded-lg p-2 text-ink/40 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {pages.length === 0 && formOpen === null && (
        <p className="mt-4 rounded-xl border border-dashed border-line py-8 text-center text-sm text-ink/50">
          Страниц пока нет — добавь первую.
        </p>
      )}
    </div>
  )
}
