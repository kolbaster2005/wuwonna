import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'

// Любой несуществующий адрес. Раньше показывалась пустая страница.
export default function NotFoundPage() {
  return (
    <main className="page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pine-50 text-pine-700">
        <Compass size={26} />
      </span>
      <p className="eyebrow mt-6">Ошибка 404</p>
      <h1 className="h-page mt-2">Такой страницы нет</h1>
      <p className="lead mt-3 max-w-md">Возможно, ссылка устарела или в адресе опечатка. Начни с главной или открой пробники.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/" className="btn btn-primary">
          <ArrowLeft size={16} /> На главную
        </Link>
        <Link to="/probniki" className="btn btn-secondary">
          К пробникам
        </Link>
      </div>
    </main>
  )
}
