import { useRef, useState } from 'react'
import { Bold, Italic, MessageSquarePlus } from 'lucide-react'
import { CALLOUT_ICONS } from '../CalloutBox'

export default function RichTextEditor({ value, onChange, rows = 4, placeholder }) {
  const textareaRef = useRef(null)
  const [calloutIcon, setCalloutIcon] = useState('lightbulb')

  function applyWrap(marker) {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart, selectionEnd } = el
    if (selectionStart === selectionEnd) return

    const before = value.slice(0, selectionStart)
    const selected = value.slice(selectionStart, selectionEnd)
    const after = value.slice(selectionEnd)
    onChange(`${before}${marker}${selected}${marker}${after}`)

    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(selectionStart + marker.length, selectionEnd + marker.length)
    })
  }

  function applyCallout() {
    const el = textareaRef.current
    if (!el) return
    const { selectionStart, selectionEnd } = el
    if (selectionStart === selectionEnd) return

    const before = value.slice(0, selectionStart)
    const selected = value.slice(selectionStart, selectionEnd)
    const after = value.slice(selectionEnd)
    const open = `[[callout:${calloutIcon}]]\n`
    const close = `\n[[/callout]]`
    onChange(`${before}${open}${selected}${close}${after}`)

    requestAnimationFrame(() => {
      el.focus()
      const pos = selectionStart + open.length + selected.length + close.length
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => applyWrap('**')}
          className="flex items-center gap-1 border border-line px-2 py-1 text-xs font-semibold text-ink/60 hover:border-ink/30 hover:text-ink"
          title="Выделить жирным — сначала выдели текст мышкой"
        >
          <Bold size={13} /> Жирный
        </button>
        <button
          type="button"
          onClick={() => applyWrap('*')}
          className="flex items-center gap-1 border border-line px-2 py-1 text-xs font-semibold text-ink/60 hover:border-ink/30 hover:text-ink"
          title="Выделить курсивом — сначала выдели текст мышкой"
        >
          <Italic size={13} /> Курсив
        </button>

        <span className="mx-0.5 h-4 w-px bg-line" />

        <select
          value={calloutIcon}
          onChange={(e) => setCalloutIcon(e.target.value)}
          className="border border-line bg-white px-1.5 py-1 text-xs text-ink/60 focus:outline-none"
          title="Иконка сноски"
        >
          {Object.entries(CALLOUT_ICONS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={applyCallout}
          className="flex items-center gap-1 border border-line px-2 py-1 text-xs font-semibold text-ink/60 hover:border-ink/30 hover:text-ink"
          title="Сделать сноску с иконкой — сначала выдели текст (заголовок + абзац)"
        >
          <MessageSquarePlus size={13} /> Сноска
        </button>

        <span className="text-xs text-ink/35">Новая строка — новый абзац</span>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full border border-line bg-white px-3 py-2 text-sm focus:outline-none"
      />
    </div>
  )
}
