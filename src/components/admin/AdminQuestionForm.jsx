import { useState } from 'react'
import { Plus, Trash2, ImagePlus, X } from 'lucide-react'

function emptyOptions() {
  return [
    { id: 'opt1', text: '', correct: false },
    { id: 'opt2', text: '', correct: false },
    { id: 'opt3', text: '', correct: false },
    { id: 'opt4', text: '', correct: false },
  ]
}

function toFormOptions(question) {
  if (!question) return emptyOptions()
  return question.options.map((opt) => ({
    ...opt,
    correct: question.correct_option_ids.includes(opt.id),
  }))
}

export default function AdminQuestionForm({ initial, onSave, onCancel }) {
  const [prompt, setPrompt] = useState(initial?.prompt ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [explanation, setExplanation] = useState(initial?.explanation ?? '')
  const [points, setPoints] = useState(initial?.points ?? 1)
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '')
  const [options, setOptions] = useState(toFormOptions(initial))
  const [error, setError] = useState('')

  function updateOption(id, patch) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }

  function addOption() {
    const newId = `opt_${Date.now().toString(36)}`
    setOptions((prev) => [...prev, { id: newId, text: '', correct: false }])
  }

  function removeOption(id) {
    setOptions((prev) => (prev.length > 2 ? prev.filter((o) => o.id !== id) : prev))
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImageUrl(reader.result)
    reader.readAsDataURL(file)
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!prompt.trim()) {
      setError('Впиши текст вопроса.')
      return
    }
    const filled = options.filter((o) => o.text.trim())
    if (filled.length < 2) {
      setError('Нужно минимум два варианта ответа с текстом.')
      return
    }
    const correctOnes = filled.filter((o) => o.correct)
    if (correctOnes.length === 0) {
      setError('Отметь хотя бы один правильный вариант.')
      return
    }

    onSave({
      prompt: prompt.trim(),
      category: category.trim() || null,
      explanation: explanation.trim() || null,
      image_url: imageUrl || null,
      points: Number(points) || 1,
      options: filled.map(({ id, text }) => ({ id, text: text.trim() })),
      correct_option_ids: correctOnes.map((o) => o.id),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line bg-paper/60 p-5">
      <div>
        <label className="text-sm font-semibold">Текст вопроса</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={2}
          className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:outline-none"
          placeholder="Например: Какое из приведённых слов является паронимом к слову «адресат»?"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold">Категория вопроса (необязательно)</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:outline-none"
            placeholder="Например: Орфография"
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Баллы за вопрос</label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:outline-none"
          />
          <p className="mt-1 text-xs text-ink/40">
            При нескольких верных ответах баллы начисляются частично — см. пояснение при прохождении.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-semibold">Фото к вопросу (необязательно)</label>
        {imageUrl ? (
          <div className="mt-1.5 flex items-center gap-3">
            <img src={imageUrl} alt="" className="h-14 w-14 border border-line object-cover" />
            <button
              type="button"
              onClick={() => setImageUrl('')}
              className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700"
            >
              <X size={14} /> Убрать
            </button>
          </div>
        ) : (
          <label className="mt-1.5 flex w-full cursor-pointer items-center gap-2 border border-dashed border-line bg-white px-3 py-2 text-sm text-ink/50 hover:border-ink/30">
            <ImagePlus size={16} />
            Загрузить фото
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold">
            Варианты ответа <span className="font-normal text-ink/40">(отметь галочкой верные)</span>
          </label>
          <button
            type="button"
            onClick={addOption}
            className="flex items-center gap-1 text-sm font-semibold text-pine-700 hover:text-pine-800"
          >
            <Plus size={14} /> Добавить вариант
          </button>
        </div>

        <div className="mt-2 space-y-2">
          {options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={opt.correct}
                onChange={(e) => updateOption(opt.id, { correct: e.target.checked })}
                className="h-4 w-4 shrink-0 accent-pine-600"
                title="Отметить как верный ответ"
              />
              <input
                value={opt.text}
                onChange={(e) => updateOption(opt.id, { text: e.target.value })}
                className="flex-1 border border-line bg-white px-3 py-2 text-sm focus:outline-none"
                placeholder="Текст варианта"
              />
              <button
                type="button"
                onClick={() => removeOption(opt.id)}
                disabled={options.length <= 2}
                className="shrink-0 p-2 text-ink/30 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-semibold">Объяснение (показывается после ответа)</label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          rows={2}
          className="mt-1.5 w-full border border-line bg-white px-3 py-2 text-sm focus:outline-none"
          placeholder="Например: Пароним к слову «адресат» — «адресант»."
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button type="submit" className="bg-pine-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-pine-700">
          Сохранить вопрос
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
