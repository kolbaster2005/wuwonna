// Вкладки с подчёркиванием активной — общие для «Пробников» и «Об экзамене».
//   items    — [{ id, label }]
//   value    — id активной вкладки
//   onChange — (id) => void
// Серая линия — на обёртке, а не на самом nav: иначе подчёркивание активной
// вкладки вылезало бы за край прокручиваемого nav и Windows рисовал полосу
// прокрутки. На узком экране вкладки листаются пальцем, полоса скрыта.
export default function Tabs({ items, value, onChange, className = '' }) {
  return (
    <div className={`border-b border-line ${className}`}>
      <nav
        role="tablist"
        className="-mb-px flex gap-6 overflow-x-auto [scrollbar-width:none] sm:gap-8 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const active = item.id === value
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.id)}
              className={`shrink-0 whitespace-nowrap border-b-2 pb-3 text-[15px] font-bold transition-colors ${
                active ? 'border-pine-600 text-pine-700' : 'border-transparent text-ink/50 hover:text-ink/80'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
