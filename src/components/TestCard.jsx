import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, ListChecks, Clock, ShieldCheck, Pin, Lock, CheckCircle2, RotateCcw, Languages, Eye } from 'lucide-react'
import { setTestPinned } from '../lib/data'
import { useAuth } from '../lib/authContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { useProModal } from '../lib/proModal'
import RichText from './RichText'
import { testPath, testResultPath } from '../seo/content'
import { useI18n } from '../i18n'

// result — { best (0..1), attempts } по этому тесту, если человек его уже
// проходил (см. statsByTest в lib/progress.js). Пройденная карточка
// помечается и слегка приглушается, при наведении — обычная.
export default function TestCard({ test, result, onPinChange }) {
  const [pinning, setPinning] = useState(false)
  const { hasPro, isAdmin, loading: authLoading } = useAuth()
  const { openProModal } = useProModal()
  const { t, lang, errorText } = useI18n()
  // Закреплять/откреплять может только админ. Без Supabase входа нет вообще —
  // тогда, как и в админке (RequireAuth), не мешаем локальной разработке.
  const canPin = isAdmin || !isSupabaseConfigured
  // Пока сессия грузится, не блокируем — иначе у PRO-пользователя карточка
  // на мгновение мигает серой.
  const isLockedForUser = Boolean(test.is_pro) && !hasPro && !authLoading
  const isDone = Boolean(result?.attempts) && !isLockedForUser
  // Закрытая карточка приглушается целиком, кроме цветной плашки «Только в PRO».
  const lockedFade = isLockedForUser ? 'opacity-55 grayscale' : ''

  async function togglePin() {
    setPinning(true)
    try {
      await setTestPinned(test, !test.is_pinned)
      onPinChange?.()
    } catch (err) {
      alert(t('testCard.pinFailed', { error: errorText(err) }))
    } finally {
      setPinning(false)
    }
  }

  return (
    <div
      className={`relative flex flex-col border p-5 transition-shadow sm:p-7 ${
        isLockedForUser
          ? 'border-line bg-paper'
          : isDone
            ? 'border-line bg-[#efeeeb] hover:shadow-[0_8px_24px_-12px_rgba(20,23,26,0.15)]'
            : 'border-line bg-white hover:shadow-[0_8px_24px_-12px_rgba(20,23,26,0.15)]'
      }`}
    >
      {canPin && (
        <button
          onClick={togglePin}
          disabled={pinning}
          title={test.is_pinned ? t('testCard.unpin') : t('testCard.pin')}
          className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center border transition-colors sm:right-5 sm:top-5 ${
            test.is_pinned
              ? 'border-pine-600 bg-pine-50 text-pine-700'
              : 'border-line text-ink/30 hover:border-ink/30 hover:text-ink/60'
          }`}
        >
          <Pin size={14} className={test.is_pinned ? 'fill-pine-700' : ''} />
        </button>
      )}

      {/* flex-1 + mt-auto у строки свойств: свойства и кнопка всегда прижаты к
          низу карточки, и в одном ряду стоят ровно, как бы ни отличалась длина описания. */}
      <div className="flex flex-1 flex-col">
        {/* Значок «Пройдено» — в одной строке с иконкой, чтобы пройденная
            карточка не была выше соседних и ряд не "съезжал". */}
        <div className="flex items-center gap-3 pr-10">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pine-50 text-pine-700 sm:h-14 sm:w-14 ${lockedFade}`}>
            <FileText size={22} strokeWidth={1.75} className="sm:hidden" />
            <FileText size={24} strokeWidth={1.75} className="hidden sm:block" />
          </div>
          {isLockedForUser && (
            <span className="inline-flex items-center gap-1.5 border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              <Lock size={12} /> {t('testCard.proOnly')}
            </span>
          )}
          {isDone && (
            <span
              className="inline-flex items-center gap-1.5 bg-pine-50 px-3 py-1 text-xs font-bold text-pine-700"
              title={t('testCard.bestResult', { count: result.attempts })}
            >
              <CheckCircle2 size={13} /> {t('testCard.done', { percent: Math.round(result.best * 100) })}
            </span>
          )}
        </div>

        <div className={`mb-5 sm:mb-6 ${lockedFade}`}>
          <h3 className="mt-4 pr-8 text-lg font-extrabold tracking-tight sm:mt-5 sm:text-xl">{test.title}</h3>
          {/* Перевода на язык страницы ещё нет — показана русская версия */}
          {test.is_fallback && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <Languages size={13} /> {t('testCard.fallback')}
            </p>
          )}
          <RichText text={test.description} className="mt-2 text-sm leading-relaxed text-ink/55" />
        </div>

        <div className={`mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-4 text-[13px] text-ink/55 sm:pt-5 ${lockedFade}`}>
          <span className="flex items-center gap-1.5">
            <ListChecks size={15} /> {t('testCard.questions', { count: test.questions_count })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={15} /> {t('common.minutes', { count: test.duration_minutes })}
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={15} /> {t(`originality.${test.originality === 'unofficial' ? 'unofficial' : 'official'}`)}
          </span>
        </div>
      </div>

      {/* Закрытый пробник — не уводим на отдельную страницу, а сразу
          показываем общую PRO-модалку. Прямая ссылка на пробник всё равно
          защищена: там ProLockedNotice. */}
      {/* Кнопки внизу — одной высоты (h-11 + border у всех, у зелёных он
          прозрачный): так в ряду карточек они стоят ровно на одной линии,
          одна это кнопка или две. */}
      {isLockedForUser ? (
        <button
          onClick={() => openProModal()}
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 border border-ink/25 bg-white text-sm font-bold text-ink/60 transition-colors hover:border-pine-600 hover:bg-pine-50 hover:text-pine-700 sm:mt-6"
        >
          <Lock size={14} /> {t('testCard.openWithPro')}
        </button>
      ) : isDone ? (
        // Пройденный: посмотреть разбор последней попытки или пройти заново.
        // Две кнопки в ряд — текст мельче, чтобы помещался в одну строку.
        <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6">
          <Link
            to={testResultPath(test, result.last?.id, lang)}
            className="flex h-11 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap border border-ink/25 bg-white px-2 text-[12px] font-bold text-ink/75 transition-colors hover:border-pine-600 hover:bg-pine-50 hover:text-pine-700"
          >
            <Eye size={13} className="shrink-0" /> {t('testCard.results')}
          </Link>
          <Link
            to={testPath(test, lang)}
            className="flex h-11 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap border border-transparent bg-pine-600 px-2 text-[12px] font-bold text-white transition-colors hover:bg-pine-700"
          >
            <RotateCcw size={13} className="shrink-0" /> {t('testCard.retake')}
          </Link>
        </div>
      ) : (
        <Link
          to={testPath(test, lang)}
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 border border-transparent bg-pine-600 text-sm font-bold text-white transition-colors hover:bg-pine-700 sm:mt-6"
        >
          {t('testCard.start')}
        </Link>
      )}
    </div>
  )
}
