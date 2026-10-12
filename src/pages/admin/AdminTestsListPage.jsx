import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, FileText, Pin, Crown, Users, GripVertical } from 'lucide-react'
import { fetchTests, fetchCategories, deleteTest, setTestProAccess, setTestCategory, reorderTests } from '../../lib/data'
import { reportErrors } from '../../lib/reportErrors'
import { isSupabaseConfigured } from '../../lib/supabaseClient'
import { originalityLabel } from '../../lib/originality'
import { useConfirm } from '../../lib/confirmDialog'
import { translateError } from '../../i18n/translate'

export default function AdminTestsListPage() {
  const confirmAction = useConfirm()
  const [tests, setTests] = useState(null)
  const [categories, setCategories] = useState([])
  const [togglingProId, setTogglingProId] = useState(null)

  // Перетаскивание: список переставляется "вживую" по мере движения, а в
  // базу порядок уходит один раз — когда отпустили (dragend).
  const [draggingId, setDraggingId] = useState(null)
  const orderAtDragStart = useRef(null)
  const [savingOrder, setSavingOrder] = useState(false)

  function reload() {
    fetchTests().then(setTests)
  }

  useEffect(reload, [])

  useEffect(() => {
    fetchCategories().then(setCategories)
  }, [])

  // Категория = вкладка на странице «Пробники». Меняется прямо в списке,
  // без захода в редактирование.
  async function handleCategoryChange(test, categoryId) {
    const previous = test.category_id
    setTests((prev) => prev.map((t) => (t.id === test.id ? { ...t, category_id: categoryId } : t)))
    try {
      await setTestCategory(test.id, categoryId)
    } catch (err) {
      alert(`Не получилось изменить категорию: ${translateError('ru', err)}`)
      setTests((prev) => prev.map((t) => (t.id === test.id ? { ...t, category_id: previous } : t)))
    }
  }

  function handleDragStart(e, test) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', test.id) // без этого Firefox не начинает перетаскивание
    orderAtDragStart.current = tests.map((t) => t.id)
    setDraggingId(test.id)
  }

  function handleDragOver(e, target) {
    if (draggingId === null) return
    e.preventDefault()
    if (target.id === draggingId) return
    setTests((prev) => {
      const from = prev.findIndex((t) => t.id === draggingId)
      const to = prev.findIndex((t) => t.id === target.id)
      // Закреплённые всегда идут первыми (см. sortTests в data.js), поэтому
      // переставлять можно только внутри своей группы: закреплённые между
      // собой, остальные между собой.
      if (Boolean(prev[from].is_pinned) !== Boolean(prev[to].is_pinned)) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  async function handleDragEnd() {
    setDraggingId(null)
    const before = orderAtDragStart.current
    orderAtDragStart.current = null
    const orderedIds = tests.map((t) => t.id)
    if (!before || before.join() === orderedIds.join()) return

    setSavingOrder(true)
    try {
      await reorderTests(orderedIds)
    } catch (err) {
      alert(`Не получилось сохранить порядок: ${translateError('ru', err)}`)
      reload()
    } finally {
      setSavingOrder(false)
    }
  }

  async function handleDelete(test) {
    const ok = await confirmAction({
      title: `Удалить пробник «${test.title}»?`,
      message: 'Все его вопросы и тексты тоже удалятся.',
      confirmLabel: 'Удалить',
      danger: true,
    })
    if (!ok) return
    await reportErrors('удалить пробник', async () => {
      await deleteTest(test.id)
      reload()
    })
  }

  async function handleToggleProAccess(test) {
    const nextIsPro = !test.is_pro
    setTogglingProId(test.id)
    try {
      await setTestProAccess(test.id, nextIsPro)
      setTests((prev) => prev.map((t) => (t.id === test.id ? { ...t, is_pro: nextIsPro } : t)))
    } catch (err) {
      alert(`Не получилось изменить доступ: ${translateError('ru', err)}`)
    } finally {
      setTogglingProId(null)
    }
  }

  return (
    <div>
      {!isSupabaseConfigured && (
        <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Supabase не подключен — изменения сохраняются в этом браузере (localStorage). Заполни{' '}
          <code className="rounded bg-amber-100 px-1">.env</code>, чтобы данные хранились в настоящей базе.
        </p>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Все пробники</h2>
        <Link
          to="/admin/probniki/new"
          className="flex items-center gap-2 rounded-xl bg-pine-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-pine-700"
        >
          <Plus size={16} /> Добавить пробник
        </Link>
      </div>

      {tests === null ? (
        <p className="mt-6 text-sm text-ink/40">Загрузка...</p>
      ) : tests.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line py-10 text-center text-sm text-ink/50">
          Пробников пока нет — добавь первый.
        </p>
      ) : (
        <>
        <p className="mt-5 text-sm text-ink/50">
          Перетащи пробник за <GripVertical size={14} className="inline -translate-y-px" />, чтобы поменять порядок —
          в таком же порядке они показываются на странице «Пробники». Закреплённые всегда идут первыми.
          {savingOrder && <span className="ml-2 font-semibold text-pine-700">Сохраняем порядок…</span>}
        </p>
        <ul className="mt-3 divide-y divide-line rounded-xl border border-line bg-white">
          {tests.map((test) => (
            <li
              key={test.id}
              draggable
              onDragStart={(e) => handleDragStart(e, test)}
              onDragOver={(e) => handleDragOver(e, test)}
              onDrop={(e) => e.preventDefault()}
              onDragEnd={handleDragEnd}
              className={`flex flex-col gap-3 py-4 pl-2 pr-4 transition-colors sm:pr-5 lg:flex-row lg:items-center lg:justify-between lg:gap-4 ${
                draggingId === test.id ? 'bg-pine-50/70 opacity-60' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="cursor-grab px-1 text-ink/30 hover:text-ink/60 active:cursor-grabbing" title="Перетащи, чтобы поменять порядок">
                  <GripVertical size={18} />
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pine-50 text-pine-700">
                  <FileText size={16} />
                </span>
                <div>
                  <p className="flex items-center gap-1.5 font-semibold">
                    {test.is_pinned && <Pin size={13} className="fill-pine-700 text-pine-700" />}
                    {test.title}
                  </p>
                  <p className="text-sm text-ink/50">
                    {test.section?.trim() && <>{test.section.trim()} · </>}
                    {test.year} · {test.questions_count} вопросов · {originalityLabel(test.originality)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pl-9 lg:pl-0">
                <select
                  value={test.category_id ?? ''}
                  onChange={(e) => handleCategoryChange(test, e.target.value)}
                  title="Вкладка, в которой пробник показывается на странице «Пробники»"
                  className="max-w-[190px] rounded-lg border border-line bg-white px-2.5 py-2 text-sm font-semibold text-ink/70 hover:border-ink/30 focus:outline-none"
                >
                  {!test.category_id && <option value="">Без категории</option>}
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleToggleProAccess(test)}
                  disabled={togglingProId === test.id}
                  title={test.is_pro ? 'Сейчас только для PRO — нажми, чтобы открыть для всех' : 'Сейчас доступен всем — нажми, чтобы сделать только для PRO'}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                    test.is_pro
                      ? 'border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400'
                      : 'border-line text-ink/70 hover:border-ink/30'
                  }`}
                >
                  {test.is_pro ? <Crown size={14} /> : <Users size={14} />}
                  {test.is_pro ? 'Только PRO' : 'Для всех'}
                </button>
                <Link
                  to={`/admin/probniki/${test.id}`}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink/70 hover:border-ink/30"
                >
                  <Pencil size={14} /> Редактировать
                </Link>
                <button
                  onClick={() => handleDelete(test)}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-red-600 hover:border-red-300 hover:bg-red-50"
                >
                  <Trash2 size={14} /> Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
        </>
      )}
    </div>
  )
}
