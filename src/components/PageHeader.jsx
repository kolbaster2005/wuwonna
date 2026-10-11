// Шапка страницы — одинаковая на всех разделах: иконка в зелёном квадрате,
// заголовок, подзаголовок и (необязательно) действия справа.
//   icon     — иконка lucide-react
//   actions  — кнопки/ссылки справа (на телефоне — под заголовком)
//   children — что-то под шапкой в той же связке (например, вкладки)
export default function PageHeader({ icon: Icon, title, subtitle, actions, children }) {
  return (
    <header className="mb-6 sm:mb-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5 sm:gap-4">
          {Icon && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pine-600 text-white sm:h-11 sm:w-11">
              <Icon size={20} />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="h-page">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-ink/55">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div>}
      </div>
      {children}
    </header>
  )
}
