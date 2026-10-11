import { useMemo } from 'react'
import { parseBlocks, parseInline } from '../lib/markdownLite'
import HighlightableText from './HighlightableText'
import CalloutBox from './CalloutBox'

// Контент вида "текст ... [[callout:иконка]]...[[/callout]] ... текст" не
// укладывается в модель HighlightableText (сплошной поток символов с
// сквозными смещениями) — сноска визуально другая (иконка + текст рядом) и
// не участвует в выделении. Поэтому режем на блоки: обычный текст (через
// HighlightableText, с пересчётом глобальных смещений выделений в
// локальные для каждого блока) и сноски (через CalloutBox, без выделения).
export default function RichSelectableContent({
  content,
  highlights = [],
  onHighlightsChange,
  onCreateHighlight,
  onUpdateNote,
  onDeleteHighlight,
  onAddWordRequest,
  className = '',
}) {
  const textBlocks = useMemo(() => {
    let offset = 0
    return parseBlocks(content).map((block, i) => {
      if (block.type === 'callout') return { ...block, key: i }
      const { plainText, boldRanges, italicRanges } = parseInline(block.raw)
      const globalStart = offset
      offset += plainText.length
      return { type: 'text', key: i, plainText, boldRanges, italicRanges, globalStart, globalEnd: offset }
    })
  }, [content])

  return (
    <div className={className}>
      {textBlocks.map((block) => {
        if (block.type === 'callout') {
          return <CalloutBox key={block.key} icon={block.icon} raw={block.raw} className="my-4" />
        }
        if (!block.plainText.trim()) return null

        const localHighlights = highlights
          .filter((h) => h.start < block.globalEnd && h.end > block.globalStart)
          .map((h) => ({
            ...h,
            start: Math.max(0, h.start - block.globalStart),
            end: Math.min(block.plainText.length, h.end - block.globalStart),
          }))

        return (
          <HighlightableText
            key={block.key}
            text={block.plainText}
            boldRanges={block.boldRanges}
            italicRanges={block.italicRanges}
            highlights={localHighlights}
            onHighlightsChange={
              onHighlightsChange &&
              ((nextLocal) => {
                const others = highlights.filter((h) => !(h.start < block.globalEnd && h.end > block.globalStart))
                const nextGlobal = nextLocal.map((h) => ({
                  start: h.start + block.globalStart,
                  end: h.end + block.globalStart,
                }))
                onHighlightsChange([...others, ...nextGlobal].sort((a, b) => a.start - b.start))
              })
            }
            onCreateHighlight={
              onCreateHighlight && ((start, end) => onCreateHighlight(start + block.globalStart, end + block.globalStart))
            }
            onUpdateNote={onUpdateNote}
            onDeleteHighlight={onDeleteHighlight}
            onAddWordRequest={onAddWordRequest}
            className="whitespace-pre-wrap"
          />
        )
      })}
    </div>
  )
}
