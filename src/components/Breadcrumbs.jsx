import { Link } from 'react-router-dom'
import { Home, ChevronRight } from 'lucide-react'
import { useI18n } from '../i18n'

export default function Breadcrumbs({ items }) {
  const { t, path } = useI18n()
  return (
    <nav className="flex items-center gap-2 text-sm text-ink/50" aria-label={t('breadcrumbs.label')}>
      <Link to={path('home')} className="flex items-center hover:text-ink">
        <Home size={16} />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <ChevronRight size={14} className="text-ink/30" />
          {item.to ? (
            <Link to={item.to} className="hover:text-ink">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
