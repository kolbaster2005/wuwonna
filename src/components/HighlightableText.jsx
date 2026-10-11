import { useEffect, useRef, useState } from 'react'
import { Languages, BookmarkPlus, Highlighter, Check, StickyNote, Trash2 } from 'lucide-react'
import { translateText } from '../data/translations'

// Считает смещение (node, offset) в абсолютный индекс символа внутри
// всего текста контейнера — работает независимо от того, сколько там уже
// вложенных <mark> от предыдущих выделений, потому что мы просто обходим
// все текстовые узлы по порядку.
function getTextOffset(container, node, offset) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let total = 0
  let current = walker.nextNode()
  while (current) {
    if (current === node) return total + offset
    total += current.textContent.length
    current = walker.nextNode()
  }
  return total
}

function mergeHighlight(existing, next) {
  const overlapping = existing.filter((h) => h.start < next.end && h.end > next.start)
  const nonOverlapping = existing.filter((h) => !(h.start < next.end && h.end > next.start))
  const start = Math.min(next.start, ...overlapping.map((h) => h.start))
  const end = Math.max(next.end, ...overlapping.map((h) => h.end))
  return [...nonOverlapping, { start, end }].sort((a, b) => a.start - b.start)
}

const POPOVER_WIDTH = 280
const POPOVER_MARGIN = 10

// Два режима работы:
// 1) Обычный (по умолчанию, используется в пробниках): highlights — просто
//    [{start,end}], onHighlightsChange(next) заменяет весь список целиком,
//    перекрывающиеся выделения сливаются. Заметок нет.
// 2) С заметками (передан onCreateHighlight — используется в книге):
//    highlights — [{id,start,end,note}], каждое выделение — своя запись в
//    базе. Клик по уже выделенному фрагменту открывает мини-редактор
//    заметки. Новое выделение не сливается со старыми — на уже выделенный
//    текст не выделить поверх, это осознанное упрощение.
export default function HighlightableText({
  text,
  highlights,
  onHighlightsChange,
  onAddWordRequest,
  onCreateHighlight,
  onUpdateNote,
  onDeleteHighlight,
  boldRanges = [],
  italicRanges = [],
  as: Tag = 'p',
  className = '',
}) {
  const containerRef = useRef(null)
  const popoverRef = useRef(null)
  const noteRef = useRef(null)
  const notesMode = Boolean(onCreateHighlight)

  // popover: { top, left, start, end, phrase } — сам жёлтый маркер (mark)
  // сюда НЕ применяется автоматически, только по кнопке «Выделить».
  const [popover, setPopover] = useState(null)
  const [translation, setTranslation] = useState(null)
  const [translating, setTranslating] = useState(false)
  const [highlighted, setHighlighted] = useState(false)

  // редактор заметки для уже существующего выделения (режим notesMode)
  const [noteEditor, setNoteEditor] = useState(null) // { top, left, highlight, draft }

  useEffect(() => {
    function handlePointerDown(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopover(null)
        setTranslation(null)
        setTranslating(false)
        setHighlighted(false)
      }
      if (noteRef.current && !noteRef.current.contains(e.target)) {
        setNoteEditor(null)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  function clampLeft(centerX) {
    return Math.min(
      Math.max(centerX, POPOVER_WIDTH / 2 + POPOVER_MARGIN),
      window.innerWidth - POPOVER_WIDTH / 2 - POPOVER_MARGIN,
    )
  }

  function handleMouseUp() {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || selection.toString().trim() === '') return

    const range = selection.getRangeAt(0)
    if (!containerRef.current.contains(range.commonAncestorContainer)) return

    let start = getTextOffset(containerRef.current, range.startContainer, range.startOffset)
    let end = getTextOffset(containerRef.current, range.endContainer, range.endOffset)
    if (start > end) [start, end] = [end, start]

    // подрезаем пробелы по краям выделения, знаки препинания не трогаем —
    // выделение целого предложения со знаком вопроса должно попадать в попап целиком
    while (start < end && /\s/.test(text[start])) start++
    while (end > start && /\s/.test(text[end - 1])) end--
    if (start >= end) return

    const rect = range.getBoundingClientRect()
    const phrase = text.slice(start, end)

    setTranslation(null)
    setTranslating(false)
    setHighlighted(false)
    setNoteEditor(null)
    // Попап открывается для выделения любой длины — от одного слова до
    // целого предложения. Сам жёлтый маркер применяется только по кнопке
    // «Выделить», а не автоматически.
    setPopover({
      top: rect.top,
      left: clampLeft(rect.left + rect.width / 2),
      start,
      end,
      phrase,
    })
  }

  async function handleTranslate() {
    if (!popover || translating) return
    setTranslating(true)
    setTranslation(null)
    try {
      const result = await translateText(popover.phrase)
      setTranslation(result)
    } catch (err) {
      setTranslation(err.message ?? 'Не получилось перевести — попробуй ещё раз.')
    } finally {
      setTranslating(false)
    }
  }

  function handleAddToVocab() {
    if (!popover) return
    onAddWordRequest?.(popover.phrase)
    setPopover(null)
  }

  function handleHighlight() {
    if (!popover) return
    if (notesMode) {
      const overlaps = highlights.some((h) => h.start < popover.end && h.end > popover.start)
      if (!overlaps) onCreateHighlight(popover.start, popover.end)
    } else {
      onHighlightsChange(mergeHighlight(highlights, { start: popover.start, end: popover.end }))
    }
    setHighlighted(true)
  }

  function openNoteEditor(highlight, rect) {
    setPopover(null)
    setNoteEditor({
      top: rect.top,
      left: clampLeft(rect.left + rect.width / 2),
      highlight,
      draft: highlight.note ?? '',
    })
  }

  function handleSaveNote() {
    if (!noteEditor) return
    onUpdateNote?.(noteEditor.highlight.id, noteEditor.draft)
    setNoteEditor(null)
  }

  function handleDeleteHighlight() {
    if (!noteEditor) return
    onDeleteHighlight?.(noteEditor.highlight.id)
    setNoteEditor(null)
  }

  const isSingleWord = popover ? !/\s/.test(popover.phrase) : false

  // Разбиваем текст на сегменты по границам выделений, жирного и курсива —
  // получается то же самое, что деление отрезка [0,length] точками из всех
  // трёх коллекций. Каждый сегмент красится независимо и может сочетать
  // жирный+курсив одновременно (вложенные <strong><em>).
  const boundaries = new Set([0, text.length])
  highlights.forEach((h) => {
    boundaries.add(h.start)
    boundaries.add(h.end)
  })
  boldRanges.forEach((b) => {
    boundaries.add(b.start)
    boundaries.add(b.end)
  })
  italicRanges.forEach((r) => {
    boundaries.add(r.start)
    boundaries.add(r.end)
  })
  const points = [...boundaries].sort((a, b) => a - b)

  const segments = []
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]
    const end = points[i + 1]
    if (start >= end) continue
    const highlight = highlights.find((h) => h.start <= start && h.end >= end)
    const bold = boldRanges.some((b) => b.start <= start && b.end >= end)
    const italic = italicRanges.some((r) => r.start <= start && r.end >= end)
    segments.push({ key: `${start}-${end}`, value: text.slice(start, end), highlight, bold, italic })
  }

  return (
    <>
      <Tag ref={containerRef} onMouseUp={handleMouseUp} className={`select-text ${className}`}>
        {segments.map((seg) => {
          let content = seg.italic ? <em>{seg.value}</em> : seg.value
          if (seg.bold) content = <strong>{content}</strong>
          if (!seg.highlight) return <span key={seg.key}>{content}</span>

          return (
            <mark
              key={seg.key}
              onClick={
                notesMode
                  ? (e) => {
                      e.stopPropagation()
                      openNoteEditor(seg.highlight, e.currentTarget.getBoundingClientRect())
                    }
                  : undefined
              }
              className={`rounded px-0.5 text-inherit ${
                notesMode
                  ? `cursor-pointer ${seg.highlight.note ? 'bg-amber-300/90 underline decoration-amber-600 decoration-dotted underline-offset-2' : 'bg-amber-200/80 hover:bg-amber-300/80'}`
                  : 'bg-amber-200/80'
              }`}
              title={notesMode ? seg.highlight.note || 'Нажми, чтобы добавить заметку' : undefined}
            >
              {content}
            </mark>
          )
        })}
      </Tag>

      {popover && (
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: popover.top - 12,
            left: popover.left,
            width: POPOVER_WIDTH,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-50 rounded-xl border border-line bg-white p-2 shadow-lg"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleTranslate}
              disabled={translating}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-ink/70 hover:bg-black/5 disabled:opacity-60"
            >
              <Languages size={15} className={translating ? 'animate-pulse' : ''} />
              {translating ? 'Переводим…' : 'Перевести'}
            </button>

            {isSingleWord && onAddWordRequest && (
              <button
                onClick={handleAddToVocab}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-pine-700 hover:bg-pine-50"
              >
                <BookmarkPlus size={15} /> Добавить в словарь
              </button>
            )}

            <button
              onClick={handleHighlight}
              disabled={highlighted}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
            >
              {highlighted ? <Check size={15} /> : <Highlighter size={15} />}
              {highlighted ? 'Выделено' : 'Выделить'}
            </button>
          </div>

          {translation && (
            <div className="mt-1.5 border-t border-line p-1.5 pt-2.5 text-sm">
              <p className="font-semibold">{popover.phrase}</p>
              <p className="mt-1 text-ink/60">{translation}</p>
            </div>
          )}
        </div>
      )}

      {noteEditor && (
        <div
          ref={noteRef}
          style={{
            position: 'fixed',
            top: noteEditor.top - 12,
            left: noteEditor.left,
            width: POPOVER_WIDTH,
            transform: 'translate(-50%, -100%)',
          }}
          className="z-50 rounded-xl border border-line bg-white p-3 shadow-lg"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink/40">
            <StickyNote size={13} /> Заметка
          </div>
          <textarea
            autoFocus
            value={noteEditor.draft}
            onChange={(e) => setNoteEditor((prev) => ({ ...prev, draft: e.target.value }))}
            rows={3}
            placeholder="Что тут важно запомнить?"
            className="mt-1.5 w-full rounded-lg border border-line px-2.5 py-2 text-sm focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={handleDeleteHighlight}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 size={13} /> Убрать выделение
            </button>
            <button
              onClick={handleSaveNote}
              className="rounded-lg bg-pine-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-pine-700"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </>
  )
}
