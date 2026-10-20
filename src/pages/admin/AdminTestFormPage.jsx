import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, ImageIcon, FileText, FileUp, X, Download, Upload } from 'lucide-react'
import {
  fetchTestById,
  fetchTestVersions,
  isSlugTaken,
  deleteTest,
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
import { LANGS } from '../../i18n/routes'
import { buildTranslationExport, planTranslationImport } from '../../lib/translationFile'

const SLUG_FORMAT = /^[a-z0-9]+(-[a-z0-9]+)*$/

// Подпись у полей, общих для всех языковых версий (SHARED_TEST_FIELDS в data.js).
function SharedHint() {
  return <span className="ml-1 text-xs font-normal text-amber-700">меняется во всех языках</span>
}

function Counter({ value, max }) {
  const length = (value ?? '').length
  return (
    <span className={`text-xs ${length > max ? 'font-semibold text-red-600' : 'text-ink/40'}`}>
      {length} / {max}
    </span>
  )
}

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

  // Языковые версии этого пробника — вкладки вверху формы.
  const [versions, setVersions] = useState([])
  // Слаг, под которым версия уже опубликована (предупреждение при смене).
  const [publishedSlug, setPublishedSlug] = useState(null)
  const [slugError, setSlugError] = useState('')

  // Материалы для скачивания: 'none' | 'pdf' (файл в базе) | 'link' (ссылка:
  // Google Диск и т.п.). Есть ли колонка download_url (add-download-url.sql) —
  // видно по загруженному пробнику.
  const [downloadMode, setDownloadMode] = useState('none')
  const [hasDownloadColumn, setHasDownloadColumn] = useState(false)
  const [downloadError, setDownloadError] = useState('')

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
      if (t) {
        setForm(t)
        setDownloadMode(t.download_url ? 'link' : t.has_pdf ? 'pdf' : 'none')
        setHasDownloadColumn('download_url' in t)
        setPublishedSlug(t.slug)
        fetchTestVersions(t.translation_group).then(setVersions)
      }
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
    setSlugError('')
    setDownloadError('')
    const downloadUrl = form.download_url?.trim() ?? ''
    if (downloadMode === 'link' && !/^https?:\/\/\S+$/i.test(downloadUrl)) {
      setDownloadError('Вставь полную ссылку, начиная с https://')
      return
    }
    const slug = form.slug?.trim() || null
    const lang = form.lang ?? 'ru'
    if (slug && !SLUG_FORMAT.test(slug)) {
      setSlugError('Только латиница в нижнем регистре, цифры и дефисы, например offizieller-probetest-wiso-2026.')
      return
    }
    if (slug && (await isSlugTaken(lang, slug, isNew ? null : testId))) {
      setSlugError(`Такой адрес уже есть у другого пробника на языке ${lang.toUpperCase()}.`)
      return
    }
    setSaving(true)
    try {
      const { has_pdf: _hasPdf, is_fallback: _fallback, ...formWithoutDerived } = form
      const payload = {
        ...formWithoutDerived,
        id: isNew ? undefined : testId,
        duration_minutes: Number(form.duration_minutes),
        year: Number(form.year),
        slug,
        seo_title: form.seo_title?.trim() || null,
        seo_description: form.seo_description?.trim() || null,
      }
      // До миграции add-languages.sql этих колонок в базе нет.
      if (form.lang === undefined) {
        delete payload.slug
        delete payload.seo_title
        delete payload.seo_description
      }
      // Либо PDF, либо ссылка, либо ничего: лишнее очищаем.
      if (downloadMode !== 'pdf') payload.pdf_url = null
      if (downloadMode === 'link') payload.download_url = downloadUrl
      else if (hasDownloadColumn) payload.download_url = null
      else delete payload.download_url
      await reportErrors('сохранить пробник', async () => {
        const saved = await saveTest(payload)
        if (isNew) {
          navigate(`/admin/probniki/${saved.id}`, { replace: true })
        } else {
          setPublishedSlug(saved.slug ?? slug)
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

  async function handleDeleteVersion() {
    const ok = await confirmAction({
      title: `Удалить версию ${(form.lang ?? 'ru').toUpperCase()}?`,
      message: 'Удалится только эта языковая версия с её вопросами и текстами. Остальные языки не затронет.',
      confirmLabel: 'Удалить',
      danger: true,
    })
    if (!ok) return
    await reportErrors('удалить версию', async () => {
      await deleteTest(testId)
      navigate('/admin/probniki')
    })
  }

  // Всё, что переводят, — одним файлом (для перевода вручную или нейросетью).
  function handleExport() {
    const data = buildTranslationExport(form, questions, passages)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form.slug || testId}-${form.lang ?? 'ru'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Загрузить перевод: сначала сводка (что изменится, что не найдено или
  // отклонено), потом — сохранение.
  async function handleImport(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    let data
    try {
      data = JSON.parse(await file.text())
    } catch {
      alert('Это не JSON-файл.')
      return
    }
    const plan = planTranslationImport(data, form, questions, passages)
    const lines = [
      plan.testChanges.length ? `Пробник: ${plan.testChanges.join(', ')}` : 'Поля пробника не меняются',
      `Вопросов изменится: ${plan.questions.length}`,
      `Текстов изменится: ${plan.passages.length}`,
      plan.notFound.length ? `Не найдены id: ${plan.notFound.join(', ')}` : null,
      ...plan.rejected.map((r) => `Пропущен вопрос ${r.id}: ${r.reason}`),
      plan.langMismatch ? `Внимание: файл для языка ${plan.langMismatch}, а эта версия — ${(form.lang ?? 'ru').toUpperCase()}.` : null,
    ].filter(Boolean)
    const ok = await confirmAction({ title: 'Загрузить перевод?', message: lines.join('\n'), confirmLabel: 'Сохранить' })
    if (!ok) return
    await reportErrors('загрузить перевод', async () => {
      if (plan.testChanges.length) {
        const { has_pdf: _hasPdf, is_fallback: _fallback, ...rest } = { ...form, ...plan.test }
        const saved = await saveTest({ ...rest, id: testId })
        setForm((prev) => ({ ...prev, ...saved }))
      }
      for (const question of plan.questions) await saveQuestion(testId, question)
      for (const passage of plan.passages) await savePassage(testId, passage)
      reloadQuestions()
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          {isNew ? 'Новый пробник' : `Редактирование: ${form.title}`}{' '}
          {!isNew && (
            <span className="ml-1 bg-pine-600 px-1.5 py-0.5 align-middle text-xs font-bold text-white">
              {(form.lang ?? 'ru').toUpperCase()}
            </span>
          )}
        </h2>
        {!isNew && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 border border-line px-3 py-2 text-sm font-semibold text-ink/70 hover:border-ink/30"
            >
              <Download size={14} /> Скачать JSON
            </button>
            <label className="flex cursor-pointer items-center gap-1.5 border border-line px-3 py-2 text-sm font-semibold text-ink/70 hover:border-ink/30">
              <Upload size={14} /> Загрузить перевод
              <input type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        )}
      </div>

      {/* Другие языковые версии этого пробника */}
      {!isNew && versions.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 text-sm">
          <span className="text-ink/50">Версии:</span>
          {LANGS.map((lang) => {
            const version = versions.find((v) => v.lang === lang)
            if (!version) return null
            const current = version.id === testId
            return current ? (
              <span key={lang} className="bg-pine-50 px-2.5 py-1 font-bold text-pine-700">
                {lang.toUpperCase()}
              </span>
            ) : (
              <Link
                key={lang}
                to={`/admin/probniki/${version.id}`}
                className="border border-line px-2.5 py-1 font-semibold text-ink/60 hover:border-ink/30"
              >
                {lang.toUpperCase()}
              </Link>
            )
          })}
          <span className="text-xs text-ink/40">— новую версию создаёт чип «+ DE» / «+ EN» в списке пробников</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 border border-line bg-white p-5">
        <div>
          <label className="text-sm font-semibold">Название</label>
          <input
            required
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            className="mt-1.5 w-full border border-line px-3 py-2 text-sm focus:outline-none"
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
          <label className="text-sm font-semibold">Материалы для скачивания (необязательно)</label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {[
              ['none', 'Нет'],
              ['pdf', 'PDF-файл'],
              ['link', 'Ссылка'],
            ].map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setDownloadMode(mode)
                  setDownloadError('')
                }}
                className={`border px-3 py-1.5 text-sm font-semibold transition-colors ${
                  downloadMode === mode ? 'border-pine-600 bg-pine-50 text-pine-700' : 'border-line text-ink/60 hover:border-ink/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-ink/40">
            На странице пробника кнопка «Скачать материалы» — только если выбран PDF или ссылка.
          </p>
          {downloadMode === 'link' && (
            <div className="mt-2">
              <input
                value={form.download_url ?? ''}
                onChange={(e) => update('download_url', e.target.value)}
                className="w-full max-w-xl border border-line px-3 py-2 text-sm focus:outline-none"
                placeholder="https://drive.google.com/…"
              />
              <p className="mt-1 text-xs text-ink/40">Google Диск или любая другая ссылка — откроется в новой вкладке.</p>
              {downloadError && <p className="mt-1 text-xs font-semibold text-red-600">{downloadError}</p>}
            </div>
          )}
          {downloadMode !== 'pdf' ? null : pdfPresent ? (
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
            <label className="mt-1.5 flex w-full max-w-xs cursor-pointer items-center gap-2 border border-dashed border-line bg-white px-3 py-2 text-sm text-ink/50 hover:border-ink/30">
              <FileUp size={16} />
              Загрузить PDF
              <input type="file" accept="application/pdf" onChange={handlePdfChange} className="hidden" />
            </label>
          )}
        </div>

        {/* Адрес и поиск — у каждой языковой версии свои */}
        {form.lang !== undefined && (
          <div className="mt-4 space-y-4 bg-paper p-4">
            <div>
              <label className="text-sm font-semibold">Адрес страницы (slug)</label>
              <input
                value={form.slug ?? ''}
                onChange={(e) => update('slug', e.target.value)}
                className="mt-1.5 w-full max-w-md border border-line px-3 py-2 font-mono text-sm focus:outline-none"
                placeholder="offizieller-probetest-wiso-2026"
              />
              <p className="mt-1 text-xs text-ink/40">
                Латиница, цифры и дефисы, на языке версии. Пусто — адрес по id.
              </p>
              {publishedSlug && form.slug !== publishedSlug && (
                <p className="mt-1 text-xs font-semibold text-amber-700">
                  Старая ссылка (…/{publishedSlug}) перестанет работать — и в поиске, и у тех, кто её сохранил.
                </p>
              )}
              {slugError && <p className="mt-1 text-xs font-semibold text-red-600">{slugError}</p>}
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-semibold">Заголовок для поиска (title)</label>
                <Counter value={form.seo_title} max={70} />
              </div>
              <input
                value={form.seo_title ?? ''}
                onChange={(e) => update('seo_title', e.target.value)}
                className="mt-1.5 w-full border border-line px-3 py-2 text-sm focus:outline-none"
                placeholder="Пусто — соберётся из названия автоматически"
              />
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <label className="text-sm font-semibold">Описание для поиска (description)</label>
                <Counter value={form.seo_description} max={160} />
              </div>
              <textarea
                value={form.seo_description ?? ''}
                onChange={(e) => update('seo_description', e.target.value)}
                rows={2}
                className="mt-1.5 w-full border border-line px-3 py-2 text-sm focus:outline-none"
                placeholder="Пусто — возьмётся краткое описание"
              />
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="text-sm font-semibold">
              Год <SharedHint />
            </label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => update('year', e.target.value)}
              className="mt-1.5 w-full border border-line px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">
              Минут <SharedHint />
            </label>
            <input
              type="number"
              value={form.duration_minutes}
              onChange={(e) => update('duration_minutes', e.target.value)}
              className="mt-1.5 w-full border border-line px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">
              Оригинальность <SharedHint />
            </label>
            <select
              value={form.originality}
              onChange={(e) => update('originality', e.target.value)}
              className="mt-1.5 w-full border border-line px-3 py-2 text-sm focus:outline-none"
            >
              {ORIGINALITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold">
              Категория <SharedHint />
            </label>
            <select
              value={form.category_id}
              onChange={(e) => update('category_id', e.target.value)}
              className="mt-1.5 w-full border border-line px-3 py-2 text-sm focus:outline-none"
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
            className="mt-1.5 w-full max-w-xs border border-line px-3 py-2 text-sm focus:outline-none"
            placeholder="например, Глава 1 / Kapitel 1 / Chapter 1"
          />
          <p className="mt-1 text-xs text-ink/40">
            Подзаголовок на странице «Пробники»: все пробники с одинаковым разделом показываются вместе под ним.
            Внутри одного языка названия должны совпадать (все немецкие версии главы 1 — «Kapitel 1»).
          </p>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-pine-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-pine-700 disabled:opacity-50"
          >
            {isNew ? 'Создать пробник' : 'Сохранить изменения'}
          </button>
          {savedNotice && <span className="text-sm font-semibold text-pine-700">Сохранено ✓</span>}
          {!isNew && (
            <button
              type="button"
              onClick={handleDeleteVersion}
              className="ml-auto flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
            >
              <Trash2 size={14} /> Удалить эту версию
            </button>
          )}
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
                  className="flex items-center gap-2 bg-pine-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-pine-700"
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
                <li key={q.id} className="border border-line bg-white p-4">
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
                            <span className="bg-pine-50 px-2.5 py-0.5 text-xs font-semibold text-pine-700">
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
                          className="p-2 text-ink/40 hover:bg-black/5 hover:text-ink"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q)}
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

            {questions.length === 0 && questionFormOpen === null && (
              <p className="mt-4 border border-dashed border-line py-8 text-center text-sm text-ink/50">
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
                  className="flex shrink-0 items-center gap-2 bg-pine-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-pine-700"
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
                <li key={p.id} className="border border-line bg-white p-4">
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
                          <span className="bg-pine-50 px-2.5 py-0.5 text-xs font-semibold text-pine-700">
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
                          className="p-2 text-ink/40 hover:bg-black/5 hover:text-ink"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeletePassage(p)}
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

            {passages.length === 0 && passageFormOpen === null && (
              <p className="mt-4 border border-dashed border-line py-8 text-center text-sm text-ink/50">
                Текстов и вступлений пока нет.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
