import { useState } from 'react'
import { Plus, Pencil, Trash2, Download, BookOpen, MousePointerClick, Languages } from 'lucide-react'
import { useVocabulary } from '../lib/useVocabulary'
import GuestSaveBanner from '../components/GuestSaveBanner'
import AddWordModal from '../components/AddWordModal'
import PageHeader from '../components/PageHeader'
import { useConfirm } from '../lib/confirmDialog'
import { useI18n } from '../i18n'

function exportForAnkiQuizlet(entries, t) {
  // Формат "слово [TAB] перевод" построчно — подходит и для импорта в Anki
  // (File -> Import, разделитель Tab), и для Quizlet (Import -> между
  // термином и определением: Tab, между карточками: новая строка).
  const lines = entries.map((e) => {
    const back = [e.translation, e.example ? t('vocabulary.exampleLine', { example: e.example }) : null]
      .filter(Boolean)
      .join(' — ')
    return `${e.word}\t${back || '—'}`
  })
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = t('vocabulary.exportFileName')
  a.click()
  URL.revokeObjectURL(url)
}

export default function VocabularyPage() {
  const confirmAction = useConfirm()
  const { t } = useI18n()
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
      title: t('vocabulary.deleteConfirm.title', { word: entry.word }),
      message: t('vocabulary.deleteConfirm.message'),
      confirmLabel: t('vocabulary.deleteConfirm.confirm'),
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
        title={t('vocabulary.title')}
        subtitle={entries.length > 0 ? t('vocabulary.subtitle', { count: entries.length }) : t('vocabulary.subtitleEmpty')}
        actions={
          entries.length > 0 && (
            <>
              <button
                onClick={() => exportForAnkiQuizlet(entries, t)}
                className="btn btn-secondary"
                title={t('vocabulary.exportHint')}
              >
                <Download size={16} /> {t('vocabulary.export')}
              </button>
              <button onClick={openAddModal} className="btn btn-primary">
                <Plus size={16} /> {t('vocabulary.add')}
              </button>
            </>
          )
        }
      />

      {!loading && local && (
        <GuestSaveBanner className="-mt-2 mb-8">
          {t('vocabulary.guestBanner')}
        </GuestSaveBanner>
      )}

      {loading ? (
        <p className="text-sm text-ink/40">{t('vocabulary.loading')}</p>
      ) : entries.length === 0 ? (
        <section className="card grid grid-cols-1 gap-8 p-6 sm:p-8 md:grid-cols-[1fr_1fr] md:items-center">
          <div>
            <h2 className="h-section">{t('vocabulary.empty.title')}</h2>
            <p className="lead mt-3">{t('vocabulary.empty.text')}</p>
            <button onClick={openAddModal} className="btn btn-primary mt-6">
              <Plus size={16} /> {t('vocabulary.empty.addFirst')}
            </button>
          </div>
          <ol className="space-y-5">
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-pine-50 text-pine-700">
                <MousePointerClick size={19} />
              </span>
              <p className="text-sm leading-relaxed text-ink/65">
                <span className="block font-bold text-ink">{t('vocabulary.empty.selectTitle')}</span>
                {t('vocabulary.empty.selectText')}
              </p>
            </li>
            <li className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-pine-50 text-pine-700">
                <Languages size={19} />
              </span>
              <p className="text-sm leading-relaxed text-ink/65">
                <span className="block font-bold text-ink">{t('vocabulary.empty.translateTitle')}</span>
                {t('vocabulary.empty.translateText')}
              </p>
            </li>
          </ol>
        </section>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.category ?? '__none'}>
              <h2 className="eyebrow">{group.category ?? t('vocabulary.noCategory')}</h2>
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
                        aria-label={t('vocabulary.edit', { word: entry.word })}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(entry)}
                        className="btn btn-sm text-ink/45 hover:bg-red-50 hover:text-red-600"
                        aria-label={t('vocabulary.delete', { word: entry.word })}
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
