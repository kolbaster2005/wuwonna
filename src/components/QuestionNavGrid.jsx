import { useState } from 'react'
import { Pause, Play, Info, ChevronDown } from 'lucide-react'
import { formatDuration } from '../lib/time'

const legend = [
  { swatch: 'border-pine-600 bg-white', label: 'Ответил верно' },
  { swatch: 'border-amber-500 bg-white', label: 'Частично верно' },
  { swatch: 'border-red-500 bg-white', label: 'Ответил неверно' },
  { swatch: 'border-line bg-white', label: 'Не отвечено' },
]

export default function QuestionNavGrid({
  groups,
  currentStepIndex,
  statuses,
  totalQuestions,
  answeredCount,
  elapsedSeconds,
  isPaused,
  onToggleTimer,
  onSelectStep,
}) {
  // На мобиле по умолчанию свёрнуто — сетка вопросов и легенда съедали
  // весь экран ещё до самого вопроса. На десктопе (lg+) всегда развёрнуто.
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="w-full shrink-0 rounded-2xl border border-line bg-white p-4 sm:p-5 lg:w-[280px]">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">Вопросы</span>
        <div className="flex items-center gap-2">
          <span className="tabular-nums text-ink/60">{formatDuration(elapsedSeconds)}</span>
          <button
            onClick={onToggleTimer}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-line text-ink/50 hover:border-ink/30 hover:text-ink"
            title={isPaused ? 'Продолжить таймер' : 'Поставить таймер на паузу'}
          >
            {isPaused ? <Play size={12} /> : <Pause size={12} />}
          </button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-line text-ink/50 hover:border-ink/30 hover:text-ink lg:hidden"
            title={expanded ? 'Свернуть' : 'Показать все вопросы'}
          >
            <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-ink/40">
        Отвечено {answeredCount} из {totalQuestions}
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-pine-600 transition-all"
          style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
        />
      </div>

      <div className={`${expanded ? 'mt-5 space-y-5' : 'hidden'} lg:mt-5 lg:block lg:space-y-5`}>
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.category && (
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wide text-ink/40">{group.category}</p>
                {group.introStepIndex !== null && (
                  <button
                    onClick={() => onSelectStep(group.introStepIndex)}
                    className={`flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${
                      currentStepIndex === group.introStepIndex
                        ? 'border-pine-600 text-pine-700'
                        : 'border-line text-ink/40 hover:border-ink/30'
                    }`}
                    title="Вступление к разделу"
                  >
                    <Info size={13} />
                  </button>
                )}
              </div>
            )}
            <div className="grid grid-cols-5 gap-2">
              {group.questionSteps.map(({ stepIndex, questionNumber, questionIndex }) => {
                const status = statuses[questionIndex]
                const isCurrent = stepIndex === currentStepIndex

                let cls = 'border-line bg-white text-ink/70'
                if (status === 'correct') cls = 'border-pine-600 bg-white text-pine-700'
                else if (status === 'partial') cls = 'border-amber-500 bg-white text-amber-700'
                else if (status === 'incorrect') cls = 'border-red-500 bg-white text-red-600'

                return (
                  <button
                    key={stepIndex}
                    onClick={() => onSelectStep(stepIndex)}
                    className={`flex h-9 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${cls} ${
                      isCurrent ? 'ring-2 ring-pine-600 ring-offset-1' : ''
                    }`}
                  >
                    {questionNumber}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className={`${expanded ? 'mt-6 space-y-2.5 border-t border-line pt-5' : 'hidden'} lg:mt-6 lg:block lg:space-y-2.5 lg:border-t lg:border-line lg:pt-5`}>
        {legend.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 text-[13px] text-ink/60">
            <span className={`h-3.5 w-3.5 shrink-0 rounded border ${item.swatch}`} />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}
