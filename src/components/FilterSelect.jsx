import { ChevronDown } from 'lucide-react'

export default function FilterSelect({ icon: Icon, label, options, value, onChange }) {
  return (
    <div className="relative flex min-w-[190px] flex-1 items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 py-2.5 sm:px-4 sm:py-3">
      <Icon size={17} className="shrink-0 text-ink/40" strokeWidth={2} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-transparent text-sm font-medium text-ink focus:outline-none"
        aria-label={label}
      >
        <option value="">{label}</option>
        {options.map((opt) => {
          const value = typeof opt === 'string' ? opt : opt.value
          const label = typeof opt === 'string' ? opt : opt.label
          return (
            <option key={value} value={value}>
              {label}
            </option>
          )
        })}
      </select>
      <ChevronDown size={16} className="shrink-0 text-ink/40" />
    </div>
  )
}
