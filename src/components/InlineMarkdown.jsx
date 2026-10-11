import { parseInline } from '../lib/markdownLite'

// Строка с **жирным** и *курсивом* -> набор <span> (с <strong>/<em> внутри).
// Текст режется по всем границам жирного и курсива, поэтому куски могут
// сочетать оба стиля сразу. Используется в RichText и CalloutBox.
export default function InlineMarkdown({ text }) {
  const { plainText, boldRanges, italicRanges } = parseInline(text)
  const boundaries = new Set([0, plainText.length])
  boldRanges.forEach((b) => {
    boundaries.add(b.start)
    boundaries.add(b.end)
  })
  italicRanges.forEach((r) => {
    boundaries.add(r.start)
    boundaries.add(r.end)
  })
  const points = [...boundaries].sort((a, b) => a - b)

  return points.slice(0, -1).map((start, i) => {
    const end = points[i + 1]
    if (start >= end) return null
    const value = plainText.slice(start, end)
    const bold = boldRanges.some((b) => b.start <= start && b.end >= end)
    const italic = italicRanges.some((r) => r.start <= start && r.end >= end)
    let content = italic ? <em>{value}</em> : value
    if (bold) content = <strong>{content}</strong>
    return <span key={`${start}-${end}`}>{content}</span>
  })
}
