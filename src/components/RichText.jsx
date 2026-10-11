// Markdown-лайт для нередактируемого показа (описания пробников, вступление
// главы книги): пустая/новая строка = новый абзац, **жирный**, *курсив*,
// [[callout:иконка]]...[[/callout]] = сноска (иконка + текст). Этого
// достаточно без подключения полноценного WYSIWYG-редактора.

import { parseBlocks } from '../lib/markdownLite'
import CalloutBox from './CalloutBox'
import InlineMarkdown from './InlineMarkdown'

function renderTextBlock(raw, keyPrefix) {
  const paragraphs = raw.split(/\n+/).filter((p) => p.trim() !== '')
  return paragraphs.map((para, i) => (
    <p key={`${keyPrefix}-${i}`} className={i < paragraphs.length - 1 ? 'mb-3' : ''}>
      <InlineMarkdown text={para} />
    </p>
  ))
}

export default function RichText({ text, className = '' }) {
  if (!text) return null
  const blocks = parseBlocks(text)
  if (blocks.length === 0) return null

  return (
    <div className={className}>
      {blocks.map((block, i) =>
        block.type === 'callout' ? (
          <CalloutBox key={i} icon={block.icon} raw={block.raw} className="my-4" />
        ) : (
          renderTextBlock(block.raw, i)
        ),
      )}
    </div>
  )
}
