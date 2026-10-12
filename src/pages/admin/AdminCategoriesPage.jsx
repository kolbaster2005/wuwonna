import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { fetchCategories, createCategory } from '../../lib/data'
import { isSupabaseConfigured } from '../../lib/supabaseClient'
import { translateError } from '../../i18n/translate'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCategories().then(setCategories)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return

    setSaving(true)
    try {
      const slug = name.trim().toLowerCase().replace(/\s+/g, '-')
      const created = await createCategory({ name: name.trim(), slug })
      setCategories((prev) => [...prev, created])
      setName('')
    } catch (err) {
      setError(translateError('ru', err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {!isSupabaseConfigured && (
        <p className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Supabase не подключен — категории сохраняются в этом браузере (localStorage).
        </p>
      )}

      <p className="mb-4 text-sm text-ink/50">
        Каждая категория — отдельная вкладка на странице «Пробники», в порядке добавления. Пробник в нужную вкладку
        переносится выбором категории в списке пробников.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название категории, например «Понимание экономики»"
          className="flex-1 rounded-xl border border-line bg-white px-4 py-3 text-sm focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-pine-700 disabled:opacity-50"
        >
          <Plus size={16} /> Добавить
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-white">
        {categories.map((cat) => (
          <li key={cat.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
            <span className="font-semibold">{cat.name}</span>
            <span className="text-ink/40">{cat.slug}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
