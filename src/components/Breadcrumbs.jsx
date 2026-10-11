import { Link } from 'react-router-dom'
import { Home, ChevronRight } from 'lucide-react'

export default function Breadcrumbs({ items }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-ink/50" aria-label="Хлебные крошки">
      <Link to="/" className="flex items-center hover:text-ink">
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
