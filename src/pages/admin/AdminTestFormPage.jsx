import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, ImageIcon, FileText, FileUp, X } from 'lucide-react'
import {
  fetchTestById,
  fetchCategories,
  saveTest,
  fetchQuestions,
  saveQuestion,
  deleteQuestion,
  fetchPassages,
  savePassage,
  deletePassage,
} from '../../lib/data'
import { reportErrors } from '../../lib/reportErrors'
import { ORIGINALITY_OPTIONS } from '../../lib/originality'
import AdminQuestionForm from '../../components/admin/AdminQuestionForm'
import AdminPassageForm from '../../components/admin/AdminPassageForm'
import RichTextEditor from '../../components/admin/RichTextEditor'
import { useConfirm } from '../../lib/confirmDialog'

const emptyForm = {
  title: '',
  description: '',
  long_description: '',
  duration_minutes: 90,
  originality: 'official',
  year: new Date().getFullYear(),
  category_id: '',
}

export default function AdminTestFormPage() {
  const confirmAction = useConfirm()
  const { testId } = useParams()
  const isNew = !testId
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [savedNotice, setSavedNotice] = useState(false)

  const [questions, setQuestions] = useState([])
  const [questionFormOpen, setQuestionFormOpen] = useState(null) // null | 'new' | questionId

  const [passages, setPassages] = useState([])
  const [passageFormOpen, setPassageFormOpen] = useState(null) // null | 'new' | passageId

  useEffect(() => {
    fetchCategories().then((cats) => {
      setCategories(cats)
      setForm((prev) => (prev.category_id ? prev : { ...prev, category_id: cats[0]?.id ?? '' }))
    })
  }, [])

  useEffect(() => {
    if (isNew) return
    setLoading(true)
    fetchTestById(testId).then((t) => {
      if (t) setForm(t)
      setLoading(false)
    })
    reloadQuestions()
    reloadPassages()
  }, [testId])

  function reloadQuestions() {
    if (isNew) return
    fetchQuestions(testId).then(setQuestions)
  }

  function reloadPassages() {
    if (isNew) return
    fetchPassages(testId).then(setPassages)
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handlePdfChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => update('pdf_url', reader.result)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const { has_pdf: _hasPdf, ...formWithoutDerived } = form
      const payload = {
        ...formWithoutDerived,
        id: isNew ? undefined : testId,
        duration_minutes: Number(form.duration_minutes),
        year: Number(form.year),
      }
      await reportErrors('сохранить пробник', async () => {
        const saved = await saveTest(payload)
        if (isNew) {
          navigate(`/admin/probniki/${saved.id}`, { replace: true })
        } else {
          setSavedNotice(true)
          setTimeout(() => setSavedNotice(false), 2000)
        }
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveQuestion(data) {
    const id = questionFormOpen !== 'new' ? questionFormOpen : undefined
    await reportErrors('сохранить вопрос', async () => {
      await saveQuestion(testId, { ...data, id })
      setQuestionFormOpen(null)
      reloadQuestions()
    })
  }

  async function handleDeleteQuestion(q) {
    if (!(await confirmAction({ title: 'Удалить этот вопрос?', confirmLabel: 'Удалить', danger: true }))) return
    await reportErrors('удалить вопрос', async () => {
      await deleteQuestion(testId, q.id)
      reloadQuestions()
    })
  }

  async function handleSavePassage(data) {
    const id = passageFormOpen !== 'new' ? passageFormOpen : undefined
    await reportErrors('сохранить текст', async () => {
      await savePassage(testId, { ...data, id })
      setPassageFormOpen(null)
      reloadPassages()
    })
  }

  async function handleDeletePassage(p) {
    if (!(await confirmAction({ title: 'Удалить этот текст/вступление?', confirmLabel: 'Удалить', danger: true }))) return
    await reportErrors('удалить текст', async () => {
      await deletePassage(testId, p.id)
      reloadPassages()
    })
  }

  if (loading) return <p className="text-sm text-ink/40">Загрузка...</p>

  // fetchTestById больше не тянет сам файл (тяжёлый base64) — только флаг
  // has_pdf. pdf_url в форме появляется, только если админ только что
  // загрузил новый файл или явно нажал "Убрать" (null).
  const pdfPresent = form.pdf_url !== undefined ? Boolean(form.pdf_url) : Boolean(form.has_pdf)

  return (
    <div>
      <Link to="/admin/probniki" className="flex items-center gap-1.5 text-sm font-semibold text-ink/50 hover:text-ink">
        <ArrowLeft size={15} /> К списку пробников
      </Link>

      <h2 className="mt-4 text-lg font-bold">{isNew ? 'Новый пробник' : `Редактирование: ${form.title}`}</h2>

      <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-line bg-white p-5">
        <div>
          <label className="text-sm font-semibold">Название</label>
          <input
            required
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none"
            placeholder="Пробник 2026"
          />
        </div>

        <div className="mt-4">
          <label className="text-sm font-semibold">Краткое описание (для карточки)</label>
          <div className="mt-1.5">
            <RichTextEditor value={form.description} onChange={(v) => update('description', v)} rows={2} />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-semibold">Полное описание (на странице пробника)</label>
          <div className="mt-1.5">
            <RichTextEditor value={form.long_description} onChange={(v) => update('long_description', v)} rows={4} />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-semibold">PDF-файл пробника (необязательно)</label>
          {pdfPresent ? (
            <div className="mt-1.5 flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-ink/60">
                <FileUp size={15} /> Файл загружен
              </span>
              <button
                type="button"
                onClick={() => update('pdf_url', null)}
                className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
              >
                <X size={14} /> Убрать
              </button>
            </div>
          ) : (
            <label className="mt-1.5 flex w-full max-w-xs cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line bg-white px-3 py-2 text-sm text-ink/50 hover:border-ink/30">
              <FileUp size={16} />
              Загрузить PDF
              <input type="file" accept="application/pdf" onChange={handlePdfChange} className="hidden" />
            </label>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="text-sm font-semibold">Год</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => update('year', e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Минут</label>
            <input
              type="number"
              value={form.duration_minutes}
              onChange={(e) => update('duration_minutes', e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Оригинальность</label>
            <select
              value={form.originality}
              onChange={(e) => update('originality', e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none"
            >
              {ORIGINALITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold">Категория</label>
            <select
              value={form.category_id}
              onChange={(e) => update('category_id', e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="text-sm font-semibold">Раздел внутри вкладки (необязательно)</label>
          <input
            value={form.section ?? ''}
            onChange={(e) => update('section', e.target.value)}
            className="mt-1.5 w-full max-w-xs rounded-lg border border-line px-3 py-2 text-sm focus:outline-none"
            placeholder="например, Глава 1"
          />
          <p className="mt-1 text-xs text-ink/40">
            Подзаголовок на странице «Пробники»: все пробники с одинаковым разделом показываются вместе под ним.
          </p>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-pine-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-pine-700 disabled:opacity-50"
          >
            {isNew ? 'Создать пробник' : 'Сохранить изменения'}
          </button>
          {savedNotice && <span className="text-sm font-semibold text-pine-700">Сохранено ✓</span>}
        </div>
      </form>

      {!isNew && (
        <>
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Вопросы ({questions.length})</h3>
              {questionFormOpen === null && (
                <button
                  onClick={() => setQuestionFormOpen('new')}
                  className="flex items-center gap-2 rounded-xl bg-pine-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-pine-700"
                >
                  <Plus size={16} /> Добавить вопрос
                </button>
              )}
            </div>

            {questionFormOpen === 'new' && (
              <div className="mt-4">
                <AdminQuestionForm onSave={handleSaveQuestion} onCancel={() => setQuestionFormOpen(null)} />
              </div>
            )}

            <ul className="mt-4 space-y-3">
              {questions.map((q) => (
                <li key={q.id} className="rounded-xl border border-line bg-white p-4">
                  {questionFormOpen === q.id ? (
                    <AdminQuestionForm
                      initial={q}
                      onSave={handleSaveQuestion}
                      onCancel={() => setQuestionFormOpen(null)}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          {q.category && (
                            <span className="rounded-full bg-pine-50 px-2.5 py-0.5 text-xs font-semibold text-pine-700">
                              {q.category}
                            </span>
                          )}
                          {q.image_url && (
                            <span className="flex items-center gap-1 text-xs text-ink/40">
                              <ImageIcon size={12} /> с фото
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-sm font-medium">{q.prompt}</p>
                        <p className="mt-1 text-xs text-ink/40">
                          {q.options.length} вариантов · {q.correct_option_ids.length} верных
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => setQuestionFormOpen(q.id)}
                          className="rounded-lg p-2 text-ink/40 hover:bg-black/5 hover:text-ink"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q)}
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

            {questions.length === 0 && questionFormOpen === null && (
              <p className="mt-4 rounded-xl border border-dashed border-line py-8 text-center text-sm text-ink/50">
                Вопросов пока нет — добавь первый.
              </p>
            )}
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Тексты и вступления ({passages.length})</h3>
                <p className="mt-1 text-sm text-ink/50">
                  Вступительный блок перед первым вопросом категории или текст для чтения, закреплённый рядом с
                  вопросами (например, немецкий текст).
                </p>
              </div>
              {passageFormOpen === null && (
                <button
                  onClick={() => setPassageFormOpen('new')}
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-pine-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-pine-700"
                >
                  <Plus size={16} /> Добавить текст
                </button>
              )}
            </div>

            {passageFormOpen === 'new' && (
              <div className="mt-4">
                <AdminPassageForm questions={questions} onSave={handleSavePassage} onCancel={() => setPassageFormOpen(null)} />
              </div>
            )}

            <ul className="mt-4 space-y-3">
              {passages.map((p) => (
                <li key={p.id} className="rounded-xl border border-line bg-white p-4">
                  {passageFormOpen === p.id ? (
                    <AdminPassageForm
                      initial={p}
                      questions={questions}
                      onSave={handleSavePassage}
                      onCancel={() => setPassageFormOpen(null)}
                    />
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-pine-50 px-2.5 py-0.5 text-xs font-semibold text-pine-700">
                            {p.category}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-ink/40">
                            <FileText size={12} /> {p.type === 'pinned' ? 'текст для чтения' : 'вступление'}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm font-medium">{p.title || '(без заголовка)'}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-ink/40">{p.content}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          onClick={() => setPassageFormOpen(p.id)}
                          className="rounded-lg p-2 text-ink/40 hover:bg-black/5 hover:text-ink"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeletePassage(p)}
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

            {passages.length === 0 && passageFormOpen === null && (
              <p className="mt-4 rounded-xl border border-dashed border-line py-8 text-center text-sm text-ink/50">
                Текстов и вступлений пока нет.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
