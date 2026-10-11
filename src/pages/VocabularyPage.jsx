import { useState } from 'react'
import { Plus, Pencil, Trash2, Download, BookOpen, MousePointerClick, Languages } from 'lucide-react'
import { useVocabulary } from '../lib/useVocabulary'
import GuestSaveBanner from '../components/GuestSaveBanner'
import AddWordModal from '../components/AddWordModal'
import PageHeader from '../components/PageHeader'
import { useConfirm } from '../lib/confirmDialog'

function exportForAnkiQuizlet(entries) {
  // Формат "слово [TAB] перевод" построчно — подходит и для импорта в Anki
  // (File -> Import, разделитель Tab), и для Quizlet (Import -> между
  // термином и определением: Tab, между карточками: новая строка).
  const lines = entries.map((e) => {
    const back = [e.translation, e.example ? `Пример: ${e.example}` : null].filter(Boolean).join(' — ')
    return `${e.word}\t${back || '—'}`
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'slovar-anki-quizlet.txt'
  a.click()
  URL.revokeObjectURL(url)
}

function plural(n, one, few, many) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export default function VocabularyPage() {
  const confirmAction = useConfirm()
  const { entries, categories, local, loading, add, update, remove } = useVocabulary()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)

  function openAddModal() {
    setEditingEntry(null)
    setModalOpen(true)
  }

  function openEditModal(entry) {
    setEditingEntry(entry)
    setModalOpen(true)
  }

  async function handleSave(data) {
    if (editingEntry) await update(editingEntry.id, data)
    else await add(data)
    setModalOpen(false)
  }

  async function handleDelete(entry) {
    const ok = await confirmAction({
      title: `Удалить слово «${entry.word}»?`,
      message: 'Оно пропадёт из словаря вместе с переводом и примером.',
      confirmLabel: 'Удалить',
      danger: true,
    })
    if (!ok) return
    await remove(entry.id)
  }

  const groups = [
    ...categories.map((cat) => ({ category: cat, items: entries.filter((e) => e.category === cat) })),
    { category: null, items: entries.filter((e) => !e.category) },
  ].filter((g) => g.items.length > 0)

  return (
    <main className="page">
      <PageHeader
        icon={BookOpen}
        title="Словарь"
        subtitle={
          entries.length > 0
            ? `${entries.length} ${plural(entries.length, 'слово', 'слова', 'слов')} — сохранено во время подготовки`
            : 'Слова, которые ты сохранишь во время подготовки'
        }
        actions={
          entries.length > 0 && (
            <>
              <button
                onClick={() => exportForAnkiQuizlet(entries)}
                className="btn btn-secondary"
                title="Файл для импорта в Anki или Quizlet"
              >
                <Download size={16} /> Для Anki / Quizlet
              </button>
              <button onClick={openAddModal} className="btn btn-primary">
                <Plus size={16} /> Добавить слово
              </button>
            </>
          )
        }
      />

      {!loading && local && (
        <GuestSaveBanner className="-mt-2 mb-8">
          Слова сохраняются только в этом браузере — войди, чтобы они были в аккаунте и на любом устройстве.
        </GuestSaveBanner>
      )}

      {loading ? (
        <p className="text-sm text-ink/40">Загружаем словарь…</p>
      ) : entries.length === 0 ? (
        <section className="card grid grid-cols-1 gap-8 p-6 sm:p-8 md:grid-cols-[1fr_1fr] md:items-center">
          <div>
            <h2 className="h-section">Словарь пока пуст</h2>
            <p className="lead mt-3">
              Сохраняй незнакомые слова и термины — потом их удобно повторять здесь или выгрузить в Anki и Quizlet.
            </p>
            <button onClick={openAddModal} className="btn btn-primary mt-6">
              <Plus size={16} /> Добавить первое слово
            </button>
          </div>
          <ol className="space-y-5">
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pine-50 text-pine-700">
                <MousePointerClick size={19} />
              </span>
              <p className="text-sm leading-relaxed text-ink/65">
                <span className="block font-bold text-ink">Выдели слово в задании</span>
                В пробнике выдели слово мышкой и нажми «Добавить в словарь».
              </p>
            </li>
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pine-50 text-pine-700">
                <Languages size={19} />
              </span>
              <p className="text-sm leading-relaxed text-ink/65">
                <span className="block font-bold text-ink">Перевод — одной кнопкой</span>
                В окне добавления нажми «Перевести», допиши пример и категорию.
              </p>
            </li>
          </ol>
        </section>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.category ?? '__none'}>
              <h2 className="eyebrow">{group.category ?? 'Без категории'}</h2>
              <ul className="card mt-3 divide-y divide-line">
                {group.items.map((entry) => (
                  <li key={entry.id} className="flex items-start justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-5">
                    <div className="min-w-0">
                      <p className="font-bold">{entry.word}</p>
                      {entry.translation && <p className="mt-0.5 text-sm text-ink/65">{entry.translation}</p>}
                      {entry.example && <p className="mt-1 text-sm italic text-ink/45">«{entry.example}»</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => openEditModal(entry)}
                        className="btn btn-ghost btn-sm"
                        aria-label={`Изменить «${entry.word}»`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(entry)}
                        className="btn btn-sm text-ink/45 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Удалить «${entry.word}»`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {modalOpen && (
        <AddWordModal
          initial={editingEntry}
          existingCategories={categories}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </main>
  )
}
