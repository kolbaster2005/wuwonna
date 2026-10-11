import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, ListChecks, Clock, ShieldCheck, Pin, Lock, CheckCircle2, RotateCcw } from 'lucide-react'
import { setTestPinned } from '../lib/data'
import { useAuth } from '../lib/authContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { useProModal } from '../lib/proModal'
import { originalityLabel } from '../lib/originality'
import RichText from './RichText'

// result — { best (0..1), attempts } по этому тесту, если человек его уже
// проходил (см. statsByTest в lib/progress.js). Пройденная карточка
// помечается и слегка приглушается, при наведении — обычная.
export default function TestCard({ test, result, onPinChange }) {
  const [pinning, setPinning] = useState(false)
  const { hasPro, isAdmin, loading: authLoading } = useAuth()
  const { openProModal } = useProModal()
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
      await setTestPinned(test.id, !test.is_pinned)
      onPinChange?.()
    } catch (err) {
      alert(`Не получилось закрепить: ${err.message}`)
    } finally {
      setPinning(false)
    }
  }

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-5 transition-shadow sm:p-7 ${
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
          title={test.is_pinned ? 'Открепить' : 'Закрепить наверху'}
          className={`absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border transition-colors sm:right-5 sm:top-5 ${
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
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              <Lock size={12} /> Только в PRO
            </span>
          )}
          {isDone && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-pine-50 px-3 py-1 text-xs font-bold text-pine-700"
              title={`Лучший результат, попыток: ${result.attempts}`}
            >
              <CheckCircle2 size={13} /> Пройдено · {Math.round(result.best * 100)}%
            </span>
          )}
        </div>

        <div className={`mb-5 sm:mb-6 ${lockedFade}`}>
          <h3 className="mt-4 pr-8 text-lg font-extrabold tracking-tight sm:mt-5 sm:text-xl">{test.title}</h3>
          <RichText text={test.description} className="mt-2 text-sm leading-relaxed text-ink/55" />
        </div>

        <div className={`mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-4 text-[13px] text-ink/55 sm:pt-5 ${lockedFade}`}>
          <span className="flex items-center gap-1.5">
            <ListChecks size={15} /> {test.questions_count} заданий
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={15} /> {test.duration_minutes} мин
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={15} /> {originalityLabel(test.originality)}
          </span>
        </div>
      </div>

      {/* Закрытый пробник — не уводим на отдельную страницу, а сразу
          показываем общую PRO-модалку. Прямая ссылка на пробник всё равно
          защищена: там ProLockedNotice. */}
      {isLockedForUser ? (
        <button
          onClick={() => openProModal()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white py-3 text-sm font-bold text-ink/60 transition-colors hover:border-ink/30 hover:text-ink sm:mt-6"
        >
          <Lock size={14} /> Открыть с PRO
        </button>
      ) : (
        <Link
          to={`/probniki/${test.id}`}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-pine-600 py-3 text-sm font-bold text-white transition-colors hover:bg-pine-700 sm:mt-6"
        >
          {isDone ? (
            <>
              <RotateCcw size={15} /> Пройти ещё раз
            </>
          ) : (
            'Начать тест'
          )}
        </Link>
      )}
    </div>
  )
}
