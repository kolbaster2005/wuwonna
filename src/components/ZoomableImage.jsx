import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, X } from 'lucide-react'
import { useI18n } from '../i18n'

// Картинка, которая по клику открывается крупно — в окне поверх страницы
// (не на весь экран: до 5xl по ширине и 85% высоты окна). Закрыть — крестик,
// Esc или клик мимо картинки. Используется для картинок в вопросах.
export default function ZoomableImage({ src, alt = '', className = '' }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('imageZoom.open')}
        title={t('imageZoom.open')}
        className={`group relative block w-full cursor-zoom-in ${className}`}
      >
        <img src={src} alt={alt} className="max-h-80 w-full border border-line object-contain" />
        <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink/60 shadow-sm transition-colors group-hover:text-pine-700">
          <Maximize2 size={15} />
        </span>
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('imageZoom.open')}
            onMouseDown={() => setOpen(false)}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-[2px] sm:p-8"
          >
            <div onMouseDown={(e) => e.stopPropagation()} className="relative max-w-5xl border border-line bg-white p-2 shadow-2xl sm:p-3">
              <img src={src} alt={alt} className="max-h-[85vh] w-[min(64rem,calc(100vw-4rem))] object-contain" />
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('common.close')}
                className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center border border-ink/25 bg-white text-ink/70 shadow-md transition-colors hover:border-pine-600 hover:bg-pine-50 hover:text-pine-700"
              >
                <X size={18} />
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
