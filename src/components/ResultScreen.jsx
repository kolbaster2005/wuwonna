import { CheckCircle2, Circle, Clock, Eye, MinusCircle, Trophy, XCircle } from 'lucide-react'
import { formatDuration } from '../lib/time'
import { useI18n } from '../i18n'

// Баллы бывают дробными (частичные баллы) — до сотых.
const SCORE = { maximumFractionDigits: 2 }

function resultHeadline(ratio) {
  if (ratio >= 0.85) return 'result.headline.excellent'
  if (ratio >= 0.6) return 'result.headline.good'
  if (ratio >= 0.3) return 'result.headline.workOn'
  return 'result.headline.repeat'
}

// Общий экран результата — после теста (TestTakingPage) и после тренировки
// по темам (TrainingPage): крупно процент, оценка словами, разбивка ответов.
//
//   kicker          — надпись над оценкой ("Тест завершён")
//   counts          — { correct, partial, incorrect, unanswered }
//   elapsedSeconds  — время по таймеру; null — не показывать (в тренировке таймера нет)
//   onReview        — кнопка «Разобрать ответы»
//   actions         — остальные кнопки рядом с ней
//   footer          — строка под кнопками (например, статус сохранения)
export default function ResultScreen({
  kicker,
  ratio,
  score,
  maxScore,
  counts,
  elapsedSeconds = null,
  onReview,
  actions,
  footer,
}) {
  const { t, formatNumber } = useI18n()
  const pct = Math.round(ratio * 100)
  const tiles = [
    { key: 'correct', value: counts.correct, icon: CheckCircle2, color: 'text-pine-600' },
    { key: 'partial', value: counts.partial, icon: MinusCircle, color: 'text-amber-600' },
    { key: 'incorrect', value: counts.incorrect, icon: XCircle, color: 'text-red-500' },
    { key: 'unanswered', value: counts.unanswered, icon: Circle, color: 'text-ink/35' },
  ]

  return (
    <div className="mx-auto max-w-xl py-4 text-center sm:py-8">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pine-50 text-pine-700">
        <Trophy size={26} />
      </span>
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-ink/40">{kicker}</p>
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{t(resultHeadline(ratio))}</h2>

      <p className="mt-5 text-6xl font-extrabold tracking-tight">{pct}%</p>
      <div
        className="mx-auto mt-3 h-2.5 max-w-sm overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full rounded-full bg-pine-600" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 flex items-center justify-center gap-3 text-sm text-ink/55">
        <span>{t('result.score', { score: formatNumber(score, SCORE), max: formatNumber(maxScore, SCORE), count: maxScore })}</span>
        {elapsedSeconds !== null && (
          <>
            <span className="text-ink/25">•</span>
            <span className="flex items-center gap-1">
              <Clock size={14} /> {formatDuration(elapsedSeconds)}
            </span>
          </>
        )}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {tiles.map(({ key, value, icon: Icon, color }) => (
          <div key={key} className="rounded-xl border border-line px-3 py-3">
            <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-ink/50">
              <Icon size={14} className={color} /> {t(`result.tiles.${key}`)}
            </p>
            <p className="mt-1 text-2xl font-extrabold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-7 flex flex-col flex-wrap justify-center gap-3 sm:flex-row">
        <button
          onClick={onReview}
          className="flex items-center justify-center gap-2 rounded-xl bg-pine-600 px-6 py-3 text-sm font-bold text-white hover:bg-pine-700"
        >
          <Eye size={16} /> {t('result.review')}
        </button>
        {actions}
      </div>

      {footer && <div className="mt-5 text-xs leading-relaxed text-ink/45">{footer}</div>}
    </div>
  )
}

// Класс второстепенной кнопки рядом с «Разобрать ответы» — чтобы страницы
// оформляли свои действия одинаково.
export const secondaryActionClass =
  'flex items-center justify-center gap-2 rounded-xl border border-line px-6 py-3 text-sm font-bold text-ink/70 hover:border-ink/30'
