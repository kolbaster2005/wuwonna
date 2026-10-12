import { useEffect, useRef } from 'react'
import { AlertTriangle, HelpCircle } from 'lucide-react'

// Окно подтверждения в стиле сайта — вместо браузерного confirm().
// Открывать не напрямую, а через useConfirm() из lib/confirmDialog.jsx.
//   danger — красная кнопка подтверждения (для удалений)
export default function ConfirmDialog({ title, message, confirmLabel, cancelLabel, danger, onConfirm, onCancel }) {
  const confirmRef = useRef(null)

  // Esc — отмена, Enter — подтверждение (фокус сразу на кнопке подтверждения),
  // страница под окном не прокручивается.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    confirmRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onCancel])

  const Icon = danger ? AlertTriangle : HelpCircle

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-[2px]"
      onMouseDown={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={message ? 'confirm-dialog-message' : undefined}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white p-6 shadow-pop sm:p-7"
      >
        <span
          className={`flex h-12 w-12 items-center justify-center ${
            danger ? 'bg-red-50 text-red-600' : 'bg-pine-50 text-pine-700'
          }`}
        >
          <Icon size={22} />
        </span>
        <h2 id="confirm-dialog-title" className="mt-4 text-xl font-extrabold tracking-tight">
          {title}
        </h2>
        {message && (
          <p id="confirm-dialog-message" className="mt-2 whitespace-pre-line leading-relaxed text-ink/60">
            {message}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            className="border border-line px-5 py-3 text-sm font-bold text-ink/70 transition-colors hover:border-ink/30"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`px-5 py-3 text-sm font-bold text-white transition-colors ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-pine-600 hover:bg-pine-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
