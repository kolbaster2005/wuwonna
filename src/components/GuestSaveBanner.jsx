import { Link, useLocation } from 'react-router-dom'
import { LogIn } from 'lucide-react'

// Плашка для гостя: «сохраняется только в этом браузере — войди». После входа
// человек вернётся на эту же страницу, а данные из браузера перенесутся в
// аккаунт сами (см. lib/vocabulary.js и uploadLocalAttempts в lib/data.js).
export default function GuestSaveBanner({ children, className = '' }) {
  const location = useLocation()
  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p className="flex items-start gap-2 leading-relaxed">
        <LogIn size={16} className="mt-0.5 shrink-0" />
        <span>{children}</span>
      </p>
      <Link
        to="/login"
        state={{ from: location, mode: 'signup' }}
        className="btn btn-sm shrink-0 border border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
      >
        Создать аккаунт
      </Link>
    </div>
  )
}
