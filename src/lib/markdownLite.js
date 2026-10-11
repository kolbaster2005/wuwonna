// Лёгкая разметка для книги/пробников: **жирный**, *курсив* и блок-сноска
// [[callout:иконка]]...[[/callout]] (заголовок + текст рядом с иконкой,
// как в учебнике — "Was ist das BIP?" / "Zahlen, Daten, Fakten").
//
// Инлайновые (жирный/курсив) диапазоны считаются в символах относительно
// "чистого" текста без самих маркеров — это нужно HighlightableText, чтобы
// смещения выделений совпадали с тем, что реально видит пользователь.
// Сноска — блочный элемент, поэтому текст режется на блоки (обычный текст
// / сноска) ДО инлайнового парсинга: степень смешивания жирного\курсива
// внутри сноски и вне её — независимая для каждого блока.

const CALLOUT_RE = /\[\[callout:(\w+)\]\]([\s\S]*?)\[\[\/callout\]\]/g

// Разбивает сырой текст на блоки: обычный текст и сноски (с иконкой).
export function parseBlocks(raw) {
  if (!raw) return []
  const blocks = []
  let cursor = 0
  let match
  CALLOUT_RE.lastIndex = 0
  while ((match = CALLOUT_RE.exec(raw))) {
    if (match.index > cursor) {
      blocks.push({ type: 'text', raw: raw.slice(cursor, match.index) })
    }
    blocks.push({ type: 'callout', icon: match[1], raw: match[2].trim() })
    cursor = CALLOUT_RE.lastIndex
  }
  if (cursor < raw.length) {
    blocks.push({ type: 'text', raw: raw.slice(cursor) })
  }
  return blocks
}

// Инлайновый парсинг: убирает ** и * из текста, возвращает "чистый" текст
// плюс диапазоны жирного/курсива (в символах относительно чистого текста).
export function parseInline(raw) {
  if (!raw) return { plainText: '', boldRanges: [], italicRanges: [] }

  const boldRanges = []
  const italicRanges = []
  let plain = ''
  let i = 0
  while (i < raw.length) {
    if (raw[i] === '*' && raw[i + 1] === '*') {
      const end = raw.indexOf('**', i + 2)
      if (end !== -1) {
        const inner = raw.slice(i + 2, end)
        const start = plain.length
        plain += inner
        boldRanges.push({ start, end: start + inner.length })
        i = end + 2
        continue
      }
    }
    if (raw[i] === '*') {
      const end = raw.indexOf('*', i + 1)
      if (end !== -1) {
        const inner = raw.slice(i + 1, end)
        const start = plain.length
        plain += inner
        italicRanges.push({ start, end: start + inner.length })
        i = end + 1
        continue
      }
    }
    plain += raw[i]
    i++
  }
  return { plainText: plain, boldRanges, italicRanges }
}
