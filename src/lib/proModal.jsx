import { createContext, useCallback, useContext, useState } from 'react'
import ProModal from '../components/ProModal'

// Общая модалка "Это доступно в PRO". Подключена один раз в main.jsx, а
// открывается из любого места, где пользователь упёрся в ограничение
// базовой версии:
//
//   const { openProModal } = useProModal()
//   openProModal()

const ProModalContext = createContext(null)

export function ProModalProvider({ children }) {
  const [open, setOpen] = useState(false)

  const openProModal = useCallback(() => setOpen(true), [])
  const closeProModal = useCallback(() => setOpen(false), [])

  return (
    <ProModalContext.Provider value={{ openProModal, closeProModal }}>
      {children}
      {open && <ProModal onClose={closeProModal} />}
    </ProModalContext.Provider>
  )
}

export function useProModal() {
  const ctx = useContext(ProModalContext)
  if (!ctx) throw new Error('useProModal must be used within ProModalProvider')
  return ctx
}
