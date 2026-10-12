import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, X } from 'lucide-react'
import { PRO_PRICE, PRO_PURCHASE_URL, ProForeverTitle, ProPerkList, ProPriceTag, Squiggle } from './ProOffer'
import { useI18n } from '../i18n'

// Сама модалка. Открывать не напрямую, а через useProModal() из lib/proModal.jsx.
export default function ProModal({ onClose }) {
  const closeRef = useRef(null)
  const { t, path } = useI18n()

  // Esc закрывает, фон под модалкой не прокручивается, фокус — на крестик
  // (чтобы с клавиатуры можно было сразу закрыть или пройти Tab'ом к кнопкам).
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pro-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="relative max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto bg-white px-5 pb-7 pt-9 text-center shadow-2xl sm:px-10 sm:pb-9 sm:pt-10"
      >
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label={t('common.close')}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center border border-ink/25 text-ink/60 transition-colors hover:border-pine-600 hover:bg-pine-50 hover:text-pine-700 sm:right-5 sm:top-5"
        >
          <X size={20} />
        </button>

        <ProForeverTitle id="pro-modal-title" className="mt-2 px-10" />

        <ProPerkList className="mx-auto mt-7" />

        <div className="mt-7">
          <ProPriceTag />
        </div>
        <p className="mt-3 text-sm font-medium text-ink/50">
          {t('proOffer.oneTimePayment')} <span className="mx-1 text-pine-600">•</span>{' '}
          <Squiggle>{t('proOffer.accessForever')}</Squiggle>
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={PRO_PURCHASE_URL}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
            className="flex flex-[2] items-center justify-center gap-2 whitespace-nowrap bg-pine-600 px-5 py-4 text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgba(47,122,61,0.8)] transition-colors hover:bg-pine-700"
          >
            {t('proOffer.buy', { price: PRO_PRICE })} <ArrowRight size={16} />
          </a>
          {/* Подробности — на странице /pro (там же вопросы и подсказка войти). */}
          <Link
            to={path('pro')}
            onClick={onClose}
            className="flex flex-1 items-center justify-center border-2 border-pine-600 px-5 py-3.5 text-sm font-bold text-pine-700 transition-colors hover:bg-pine-50"
          >
            {t('proOffer.more')}
          </Link>
        </div>
      </div>
    </div>
  )
}
