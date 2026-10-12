import { useState } from 'react'
import RichTextEditor from './RichTextEditor'

export default function AdminPassageForm({ initial, questions, onSave, onCancel }) {
  const [category, setCategory] = useState(initial?.category ?? '')
  const [type, setType] = useState(initial?.type ?? 'intro')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [anchorQuestionId, setAnchorQuestionId] = useState(initial?.anchor_question_id ?? '')
  const [error, setError] = useState('')

  const existingCategories = [...new Set(questions.map((q) => q.category).filter(Boolean))]
  const questionsInCategory = questions.filter((q) => q.category === category)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!category.trim()) {
      setError('Укажи категорию — к какой группе вопросов относится этот текст.')
      return
    }
    if (!content.trim()) {
      setError('Впиши содержимое блока.')
      return
    }

    onSave({
      category: category.trim(),
      type,
      title: title.trim() || null,
      content: content.trim(),
      anchor_question_id: type === 'pinned' ? anchorQuestionId || null : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line bg-paper/60 p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold">Категория</label>
          <input
            list="passage-categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:outline-none"
            placeholder="Например: Понимание немецкого текста"
          />
          <datalist id="passage-categories">
            {existingCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="text-sm font-semibold">Тип блока</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:outline-none"
          >
            <option value="intro">Вступление (один раз, перед первым вопросом раздела)</option>
            <option value="pinned">Текст для чтения (закреплён рядом с вопросами)</option>
          </select>
        </div>
      </div>

      {type === 'pinned' && (
        <div className="mt-4">
          <label className="text-sm font-semibold">С какого вопроса показывать этот текст</label>
          <select
            value={anchorQuestionId}
            onChange={(e) => setAnchorQuestionId(e.target.value)}
            className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">Не выбрано — весь раздел (если текст один)</option>
            {questionsInCategory.map((q) => (
              <option key={q.id} value={q.id}>
                Вопрос: {q.prompt.slice(0, 60)}
                {q.prompt.length > 60 ? '…' : ''}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink/40">
            Текст останется закреплён на экране, пока не встретится следующий такой же текст этой категории.
          </p>
        </div>
      )}

      <div className="mt-4">
        <label className="text-sm font-semibold">Заголовок (необязательно)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:outline-none"
        />
      </div>

      <div className="mt-4">
        <label className="text-sm font-semibold">Содержимое</label>
        <div className="mt-1.5">
          <RichTextEditor
            value={content}
            onChange={setContent}
            rows={type === 'pinned' ? 10 : 6}
            placeholder={
              type === 'pinned'
                ? 'Текст для чтения — пользователи смогут выделять в нём слова и переводить их.'
                : 'Например, для экономики — описание раздела, для математики — список формул.'
            }
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
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
