export const ORIGINALITY_OPTIONS = [
  { value: 'official', label: 'Официальный' },
  { value: 'unofficial', label: 'Неофициальный' },
]

export function originalityLabel(value) {
  return ORIGINALITY_OPTIONS.find((o) => o.value === value)?.label ?? 'Официальный'
}
