import { NavLink, Outlet } from 'react-router-dom'
import { Settings } from 'lucide-react'
import PageHeader from '../../components/PageHeader'

const tabs = [
  { to: '/admin/probniki', label: 'Пробники' },
  { to: '/admin/kniga', label: 'Книга' },
  { to: '/admin/categories', label: 'Категории' },
  { to: '/admin/users', label: 'Пользователи' },
]

export default function AdminLayout() {
  return (
    <main className="page">
      <PageHeader icon={Settings} title="Админ-панель" subtitle="Доступно только аккаунтам с ролью admin">
        {/* на телефоне вкладки листаются пальцем, а не ломают ширину страницы */}
        <div className="mt-6 border-b border-line">
          <nav className="-mb-px flex gap-6 overflow-x-auto [scrollbar-width:none] sm:gap-8 [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `shrink-0 whitespace-nowrap border-b-2 pb-3 text-[15px] font-bold transition-colors ${
                    isActive ? 'border-pine-600 text-pine-700' : 'border-transparent text-ink/50 hover:text-ink/80'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </PageHeader>

      <Outlet />
    </main>
  )
}
