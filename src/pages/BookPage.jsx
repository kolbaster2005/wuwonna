import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { BookOpen, LogIn, ChevronDown, ArrowLeft, ArrowRight } from 'lucide-react'
import {
  fetchChapters,
  fetchSubchapters,
  fetchPages,
  fetchBookHighlights,
  saveBookHighlight,
  deleteBookHighlight,
} from '../lib/data'
import { useVocabulary } from '../lib/useVocabulary'
import { useAuth } from '../lib/authContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import RichSelectableContent from '../components/RichSelectableContent'
import RichText from '../components/RichText'
import AddWordModal from '../components/AddWordModal'

export default function BookPage() {
  const vocabulary = useVocabulary()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [chapters, setChapters] = useState(undefined)
  const [expandedChapter, setExpandedChapter] = useState(null)
  const [subchaptersByChapter, setSubchaptersByChapter] = useState({})
  const [pages, setPages] = useState([])
  const [highlights, setHighlights] = useState([])
  const [wordModalPrefill, setWordModalPrefill] = useState(null)

  const chapterId = searchParams.get('chapter')
  const subId = searchParams.get('sub')
  const pageIndex = Number(searchParams.get('page') ?? 0)
  const page = pages[pageIndex]
  const chapter = chapters?.find((c) => c.id === chapterId) ?? null

  useEffect(() => {
    fetchChapters().then((cs) => {
      setChapters(cs)
      const initialChapterId = searchParams.get('chapter')
      if (initialChapterId) {
        setExpandedChapter(initialChapterId)
        fetchSubchapters(initialChapterId).then((subs) =>
          setSubchaptersByChapter((prev) => ({ ...prev, [initialChapterId]: subs })),
        )
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function toggleChapter(chapterId) {
    if (expandedChapter === chapterId) {
      setExpandedChapter(null)
      return
    }
    setExpandedChapter(chapterId)
    if (!subchaptersByChapter[chapterId]) {
      const subs = await fetchSubchapters(chapterId)
      setSubchaptersByChapter((prev) => ({ ...prev, [chapterId]: subs }))
    }
  }

  // Клик по названию главы — открыть её вступительный текст (если есть) и
  // заодно развернуть список подглав. Отдельно от стрелки, чтобы можно
  // было и посмотреть вступление, и просто развернуть список одним кликом.
  function selectChapterIntro(id) {
    setSearchParams({ chapter: id })
    if (expandedChapter !== id) toggleChapter(id)
  }

  function openSubchapter(chapterId, subchapterId) {
    setSearchParams({ chapter: chapterId, sub: subchapterId, page: '0' })
  }

  useEffect(() => {
    if (!subId) {
      setPages([])
      return
    }
    fetchPages(subId).then(setPages)
  }, [subId])

  useEffect(() => {
    if (!page) {
      setHighlights([])
      return
    }
    fetchBookHighlights(page.id, user?.id).then(setHighlights)
  }, [page?.id, user?.id])

  async function handleCreateHighlight(start, end) {
    const saved = await saveBookHighlight(page.id, user?.id, { start, end, note: '' })
    setHighlights((prev) => [...prev, saved].sort((a, b) => a.start - b.start))
  }

  async function handleUpdateNote(highlightId, note) {
    const saved = await saveBookHighlight(page.id, user?.id, { id: highlightId, note })
    setHighlights((prev) => prev.map((h) => (h.id === highlightId ? saved : h)))
  }

  async function handleDeleteHighlight(highlightId) {
    await deleteBookHighlight(page.id, user?.id, highlightId)
    setHighlights((prev) => prev.filter((h) => h.id !== highlightId))
  }

  async function handleSaveWord(data) {
    await vocabulary.add(data)
    setWordModalPrefill(null)
  }

  function goToPage(nextIndex) {
    if (nextIndex < 0 || nextIndex >= pages.length) return
    setSearchParams({ chapter: chapterId, sub: subId, page: String(nextIndex) })
  }

  // **жирный**/*курсив*/сноски парсятся внутри RichSelectableContent —
  // компонент сам режет контент на текстовые блоки и сноски и пересчитывает
  // смещения выделений между ними.

  if (chapters === undefined) {
    return <main className="mx-auto max-w-6xl px-6 py-12 text-sm text-ink/40">Загружаем книгу...</main>
  }

  if (chapters.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-24 text-center">
        <BookOpen size={28} className="mx-auto text-ink/25" />
        <h1 className="mt-4 text-2xl font-extrabold">Книга скоро появится</h1>
        <p className="mt-2 text-ink/55">Главы ещё не загружены — заходи попозже.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Книга</h1>

      {!isSupabaseConfigured || !user ? (
        <p className="mt-3 border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm leading-relaxed text-amber-900">
          <LogIn size={15} className="mr-1.5 inline-block shrink-0 -translate-y-px align-middle" />
          Выделения и заметки сохраняются только в этом браузере —{' '}
          <Link to="/login" className="font-semibold underline">
            войди
          </Link>
          , чтобы не потерять их и видеть на любом устройстве.
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-4 sm:mt-6 sm:gap-6 lg:flex-row">
        <nav className="w-full shrink-0 border border-line bg-white p-3 sm:p-4 lg:w-72">
          <p className="px-2 text-xs font-bold uppercase tracking-wide text-ink/40">Оглавление</p>
          <ul className="mt-2 space-y-1">
            {chapters.map((c) => (
              <li key={c.id}>
                <div
                  className={`flex items-center justify-between ${
                    c.id === chapterId && !subId ? 'bg-pine-50' : 'hover:bg-black/5'
                  }`}
                >
                  <button
                    onClick={() => selectChapterIntro(c.id)}
                    className={`flex-1 truncate px-2.5 py-2 text-left text-sm font-semibold ${
                      c.id === chapterId && !subId ? 'text-pine-700' : 'text-ink/80'
                    }`}
                  >
                    {c.title}
                  </button>
                  <button onClick={() => toggleChapter(c.id)} className="shrink-0 px-2 py-2 text-ink/40">
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${expandedChapter === c.id ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
                {expandedChapter === c.id && (
                  <ul className="ml-2 mt-1 space-y-0.5 border-l border-line pl-3">
                    {(subchaptersByChapter[c.id] ?? []).map((s) => (
                      <li key={s.id}>
                        <button
                          onClick={() => openSubchapter(c.id, s.id)}
                          className={`block w-full px-2.5 py-1.5 text-left text-sm transition-colors ${
                            s.id === subId ? 'bg-pine-50 font-semibold text-pine-700' : 'text-ink/60 hover:bg-black/5'
                          }`}
                        >
                          {s.title}
                        </button>
                      </li>
                    ))}
                    {subchaptersByChapter[c.id]?.length === 0 && (
                      <li className="px-2.5 py-1.5 text-xs text-ink/35">Подглав пока нет</li>
                    )}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 border border-line bg-white p-4 sm:p-7 lg:p-8">
          {subId ? (
            pages.length === 0 ? (
              <div className="py-16 text-center text-sm text-ink/45">В этой подглаве пока нет страниц.</div>
            ) : (
              <>
                <p className="text-xs font-semibold text-ink/40">
                  Страница {pageIndex + 1} из {pages.length}
                </p>
                <p className="mt-1.5 text-xs text-ink/35">
                  Выдели текст, чтобы перевести, добавить в словарь или оставить заметку. Клик по уже выделенному —
                  открыть заметку.
                </p>

                {page?.image_url && (
                  <img
                    src={page.image_url}
                    alt=""
                    className="mt-4 max-h-96 w-full border border-line object-contain"
                  />
                )}
                {page?.video_url && (
                  <a
                    href={page.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 block border border-line bg-paper/60 px-4 py-3 text-sm font-semibold text-pine-700 hover:bg-paper"
                  >
                    ▶ Смотреть видео к этой странице
                  </a>
                )}

                <div className="mt-4 sm:mt-5">
                  {page && (
                    <RichSelectableContent
                      content={page.content}
                      highlights={highlights}
                      onCreateHighlight={handleCreateHighlight}
                      onUpdateNote={handleUpdateNote}
                      onDeleteHighlight={handleDeleteHighlight}
                      onAddWordRequest={setWordModalPrefill}
                      className="space-y-3 text-[15px] leading-relaxed text-ink/80 sm:text-[16px]"
                    />
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5 sm:mt-8 sm:pt-6">
                  <button
                    onClick={() => goToPage(pageIndex - 1)}
                    disabled={pageIndex === 0}
                    className="flex flex-1 items-center justify-center gap-2 border border-line px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:border-ink/30 disabled:opacity-40 sm:flex-none sm:justify-start sm:px-5"
                  >
                    <ArrowLeft size={15} /> Назад
                  </button>
                  <button
                    onClick={() => goToPage(pageIndex + 1)}
                    disabled={pageIndex === pages.length - 1}
                    className="flex flex-1 items-center justify-center gap-2 bg-pine-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-pine-700 disabled:opacity-40 sm:flex-none sm:justify-start sm:px-5"
                  >
                    Далее <ArrowRight size={15} />
                  </button>
                </div>
              </>
            )
          ) : chapter ? (
            <>
              <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{chapter.title}</h2>
              {chapter.content ? (
                <RichText text={chapter.content} className="mt-4 leading-relaxed text-ink/80" />
              ) : (
                <p className="mt-4 text-sm text-ink/45">
                  У этой главы нет вступительного текста — выбери подглаву слева.
                </p>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-sm text-ink/45">Выбери главу или подглаву слева.</div>
          )}
        </div>
      </div>

      {wordModalPrefill !== null && (
        <AddWordModal
          initial={{ word: wordModalPrefill }}
          existingCategories={vocabulary.categories}
          onSave={handleSaveWord}
          onClose={() => setWordModalPrefill(null)}
        />
      )}
    </main>
  )
}
