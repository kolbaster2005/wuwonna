import { Lightbulb, Search, Info, AlertTriangle } from 'lucide-react'
import InlineMarkdown from './InlineMarkdown'

export const CALLOUT_ICONS = {
  lightbulb: { icon: Lightbulb, label: 'Лампочка (объяснение)' },
  search: { icon: Search, label: 'Лупа (цифры/факты)' },
  info: { icon: Info, label: 'Инфо' },
  warning: { icon: AlertTriangle, label: 'Предупреждение' },
}

export default function CalloutBox({ icon = 'lightbulb', raw, className = '' }) {
  const Icon = CALLOUT_ICONS[icon]?.icon ?? Lightbulb
  const paragraphs = raw.split(/\n+/).filter((p) => p.trim() !== '')

  return (
    <div className={`flex items-start gap-3 bg-pine-50/60 p-4 sm:gap-4 sm:p-5 ${className}`}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-white text-pine-700 sm:h-9 sm:w-9">
        <Icon size={17} />
      </span>
      <div className="min-w-0 text-sm leading-relaxed text-ink/80">
        {paragraphs.map((p, i) => (
          <p key={i} className={i < paragraphs.length - 1 ? 'mb-2' : ''}>
            <InlineMarkdown text={p} />
          </p>
        ))}
      </div>
    </div>
  )
}
