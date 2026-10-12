import { createContext, useCallback, useContext, useRef, useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import { useI18n } from '../i18n'

// Своё окно подтверждения вместо браузерного confirm(). Подключено один раз
// в main.jsx, вызывается из любого места и возвращает Promise<boolean>:
//
//   const confirm = useConfirm()
//   if (!(await confirm({ title: 'Удалить слово?', confirmLabel: 'Удалить', danger: true }))) return
//
// Поля: title (обязательно), message, confirmLabel («Да»), cancelLabel («Отмена»),
// danger (красная кнопка — для удалений).

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null)
  const resolveRef = useRef(null)
  const { t } = useI18n()

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolveRef.current?.(false) // если вдруг открыли второе поверх — первое считается отменённым
        resolveRef.current = resolve
        setDialog({ confirmLabel: t('common.yes'), cancelLabel: t('common.cancel'), ...options })
      }),
    [t],
  )

  const close = useCallback((result) => {
    resolveRef.current?.(result)
    resolveRef.current = null
    setDialog(null)
  }, [])

  const handleCancel = useCallback(() => close(false), [close])
  const handleConfirm = useCallback(() => close(true), [close])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && <ConfirmDialog {...dialog} onConfirm={handleConfirm} onCancel={handleCancel} />}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
