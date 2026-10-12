import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, MinusCircle, Shuffle, ListChecks, Crown, Circle, Eye, RotateCcw, Dumbbell } from 'lucide-react'
import { fetchTopics, fetchQuestionCountsByTopic, fetchQuestionsByTopics } from '../lib/data'
import { groupTopicsByChapter } from '../data/topics'
import { scoreQuestion, scoreStatus } from '../lib/scoring'
import { useVocabulary } from '../lib/useVocabulary'
import { useAuth } from '../lib/authContext'
import { useProModal } from '../lib/proModal'
import Breadcrumbs from '../components/Breadcrumbs'
import PageHeader from '../components/PageHeader'
import QuestionNavGrid from '../components/QuestionNavGrid'
import HighlightableText from '../components/HighlightableText'
import AddWordModal from '../components/AddWordModal'
import ResultScreen, { secondaryActionClass } from '../components/ResultScreen'
import { useConfirm } from '../lib/confirmDialog'

// Тасует массив (Fisher-Yates), не трогая исходный.
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function TrainingPage() {
  const vocabulary = useVocabulary()
  const confirmAction = useConfirm()
  const [phase, setPhase] = useState('setup') // 'setup' | 'session' | 'finished'
  // completed — тренировка уже завершена: вопросы открываются в режиме
  // разбора (ответить нельзя, видно свой выбор и верные варианты).
  const [completed, setCompleted] = useState(false)

  // Тренировка по темам — только в PRO. Темы без PRO видно и можно отметить
  // (чтобы было понятно, что даёт PRO), но собрать тренировку нельзя —
  // вместо старта открывается PRO-модалка. Пока сессия грузится, не блокируем.
  const { hasPro, loading: authLoading } = useAuth()
  const { openProModal } = useProModal()
  const isLocked = !hasPro && !authLoading

  // --- Шаг выбора тем ---
  const [chapters, setChapters] = useState([])
  const [counts, setCounts] = useState({})
  const [selected, setSelected] = useState(() => new Set())
  const [shuffleQuestions, setShuffleQuestions] = useState(true)
  // Сколько вопросов взять из выбранных тем: null — все.
  const [questionLimit, setQuestionLimit] = useState(null)
  const [loadingSetup, setLoadingSetup] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([fetchTopics(), fetchQuestionCountsByTopic()]).then(([topics, c]) => {
      if (!alive) return
      setChapters(groupTopicsByChapter(topics))
      setCounts(c)
      setLoadingSetup(false)
    })
    return () => {
      alive = false
    }
  }, [])

  function toggleTopic(code) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  function toggleChapter(chapter) {
    const codesWithQuestions = chapter.topics.filter((t) => (counts[t.code] ?? 0) > 0).map((t) => t.code)
    const allSelected = codesWithQuestions.length > 0 && codesWithQuestions.every((c) => selected.has(c))
    setSelected((prev) => {
      const next = new Set(prev)
      codesWithQuestions.forEach((c) => (allSelected ? next.delete(c) : next.add(c)))
      return next
    })
  }

  const selectedCount = selected.size
  const selectedQuestionsAvailable = useMemo(
    () => [...selected].reduce((sum, code) => sum + (counts[code] ?? 0), 0),
    [selected, counts],
  )
  // Сколько реально попадёт в тренировку: лимит не больше, чем есть в темах.
  const plannedCount =
    questionLimit === null ? selectedQuestionsAvailable : Math.min(questionLimit, selectedQuestionsAvailable)

  // --- Сама тренировочная сессия ---
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // questionIndex -> { selected, score, max, status }
  const [pendingSelection, setPendingSelection] = useState([])
  const [highlightsByQuestion, setHighlightsByQuestion] = useState({})
  const [highlightsByOption, setHighlightsByOption] = useState({})
  const [wordModalPrefill, setWordModalPrefill] = useState(null)

  async function startTraining() {
    if (isLocked) {
      openProModal()
      return
    }
    if (selectedCount === 0) return
    setStarting(true)
    const fetched = await fetchQuestionsByTopics([...selected])
    // Лимит — случайная выборка из всех выбранных тем (а не первые N по
    // порядку, иначе каждый раз попадались бы одни и те же вопросы первой
    // темы). Без «Перемешать» выбранные идут в исходном порядке.
    let picked = fetched
    if (questionLimit !== null && questionLimit < fetched.length) {
      const chosen = new Set(shuffle(fetched).slice(0, questionLimit))
      picked = fetched.filter((q) => chosen.has(q))
    }
    const ordered = shuffleQuestions ? shuffle(picked) : picked
    setQuestions(ordered)
    setAnswers({})
    setCurrentIndex(0)
    setPendingSelection([])
    setHighlightsByQuestion({})
    setHighlightsByOption({})
    setStarting(false)
    setCompleted(false)
    setPhase('session')
  }

  function backToSetup() {
    setPhase('setup')
  }

  function restartSameTopics() {
    const ordered = shuffleQuestions ? shuffle(questions) : questions
    setQuestions(ordered)
    setAnswers({})
    setCurrentIndex(0)
    setPendingSelection([])
    setCompleted(false)
    setPhase('session')
  }

  useEffect(() => {
    setPendingSelection(answers[currentIndex]?.selected ?? [])
  }, [currentIndex, answers])

  // Темы, выбранные для тренировки, в исходном порядке оглавления —
  // используется и в группировке по левой панели, и в заголовке сессии.
  const topicByCode = useMemo(() => {
    const map = {}
    chapters.forEach((ch) => ch.topics.forEach((t) => (map[t.code] = t)))
    return map
  }, [chapters])

  // Группы для QuestionNavGrid: если вопросы перемешаны — одна общая группа;
  // если нет — группируем по теме, в порядке следования вопросов.
  const groups = useMemo(() => {
    if (questions.length === 0) return []
    if (shuffleQuestions) {
      return [
        {
          category: null,
          introStepIndex: null,
          questionSteps: questions.map((_, i) => ({ stepIndex: i, questionNumber: i + 1, questionIndex: i })),
        },
      ]
    }
    const result = []
    let lastCode = Symbol('none')
    let num = 0
    questions.forEach((q, i) => {
      if (q.topic_code !== lastCode) {
        const t = topicByCode[q.topic_code]
        result.push({ category: t ? `${t.code} ${t.title}` : q.topic_code, introStepIndex: null, questionSteps: [] })
        lastCode = q.topic_code
      }
      num += 1
      result[result.length - 1].questionSteps.push({ stepIndex: i, questionNumber: num, questionIndex: i })
    })
    return result
  }, [questions, shuffleQuestions, topicByCode])

  const statuses = useMemo(() => {
    const map = {}
    Object.entries(answers).forEach(([i, a]) => (map[i] = a.status))
    return map
  }, [answers])

  const question = questions[currentIndex]
  const currentAnswer = answers[currentIndex]
  const answeredCount = Object.keys(answers).length
  const totalScore = Object.values(answers).reduce((sum, a) => sum + a.score, 0)
  const totalMax = questions.reduce((sum, q) => sum + (q.points ?? 1), 0)

  function toggleOption(optionId) {
    if (currentAnswer || completed) return
    setPendingSelection((prev) =>
      prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId],
    )
  }

  function submitAnswer() {
    if (currentAnswer || completed || pendingSelection.length === 0) return
    const max = question.points ?? 1
    const score = scoreQuestion(question, pendingSelection)
    const status = scoreStatus(score, max)
    setAnswers((prev) => ({ ...prev, [currentIndex]: { selected: pendingSelection, score, max, status } }))
  }

  function goTo(index) {
    if (index < 0 || index >= questions.length) return
    setCurrentIndex(index)
  }

  async function handleNext() {
    if (currentIndex === questions.length - 1) {
      if (!completed && answeredCount < questions.length) {
        const unanswered = questions.length - answeredCount
        const confirmed = await confirmAction({
          title: 'Завершить тренировку?',
          message: `Без ответа ${unanswered} ${pluralQuestions(unanswered)} из ${questions.length} — они засчитаются в 0 баллов.`,
          confirmLabel: 'Завершить',
          cancelLabel: 'Вернуться к вопросам',
        })
        if (!confirmed) return
      }
      setCompleted(true)
      setPhase('finished')
      return
    }
    goTo(currentIndex + 1)
  }

  // «Разобрать ответы» — с первого вопроса, в режиме просмотра.
  function startReview() {
    setCurrentIndex(0)
    setPhase('session')
  }

  const resultCounts = { correct: 0, partial: 0, incorrect: 0, unanswered: questions.length - answeredCount }
  Object.values(answers).forEach((a) => (resultCounts[a.status] += 1))

  async function handleSaveWord(data) {
    await vocabulary.add(data)
    setWordModalPrefill(null)
  }

  // ---------- Экран выбора тем ----------
  if (phase === 'setup') {
    return (
      <main className="page">
        <Breadcrumbs items={[{ label: 'Пробники', to: '/probniki' }, { label: 'Тренировка по темам' }]} />
        <div className="mt-6 sm:mt-8">
          <PageHeader
            icon={Dumbbell}
            title="Тренировка по темам"
            subtitle="Выбери темы по оглавлению книги — соберём вопросы по ним из всех пробников"
          />
        </div>
        {isLocked && (
          <p className="-mt-2 mb-8 flex items-start gap-2 border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm leading-relaxed text-amber-900">
            <Crown size={16} className="mt-0.5 shrink-0" />
            <span>
              Тренировка по темам доступна в PRO. Темы можно посмотреть, а собрать тренировку —{' '}
              <button onClick={() => openProModal()} className="font-semibold underline">
                с PRO
              </button>
              .
            </span>
          </p>
        )}

        {loadingSetup ? (
          <div className="mt-14 text-center text-sm text-ink/40">Загружаем список тем...</div>
        ) : (
          <>
            <div className="space-y-5">
              {chapters.map((chapter) => {
                const codesWithQuestions = chapter.topics.filter((t) => (counts[t.code] ?? 0) > 0).map((t) => t.code)
                const allSelected = codesWithQuestions.length > 0 && codesWithQuestions.every((c) => selected.has(c))
                return (
                  <div key={chapter.chapter_number} className="border border-line bg-white p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-sm font-bold uppercase tracking-wide text-ink/50">
                        Глава {chapter.chapter_number} · {chapter.chapter_title}
                      </h2>
                      <button
                        onClick={() => toggleChapter(chapter)}
                        disabled={codesWithQuestions.length === 0}
                        className="shrink-0 text-xs font-semibold text-pine-600 hover:text-pine-700 disabled:opacity-30"
                      >
                        {allSelected ? 'Снять всю главу' : 'Выбрать всю главу'}
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {chapter.topics.map((topic) => {
                        const count = counts[topic.code] ?? 0
                        const disabled = count === 0
                        const isSelected = selected.has(topic.code)
                        return (
                          <label
                            key={topic.code}
                            className={`flex items-start gap-2.5 border p-3 text-sm transition-colors ${
                              disabled
                                ? 'cursor-not-allowed border-line/60 opacity-40'
                                : isSelected
                                  ? 'cursor-pointer border-pine-600 bg-pine-50/60'
                                  : 'cursor-pointer border-line hover:border-ink/30'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={disabled}
                              onChange={() => toggleTopic(topic.code)}
                              className="mt-0.5 h-4 w-4 shrink-0 accent-pine-600"
                            />
                            <span>
                              <span className="block font-semibold text-ink">
                                {topic.code} {topic.title}
                              </span>
                              <span className="mt-0.5 block text-xs text-ink/40">
                                {count === 0 ? 'пока нет вопросов' : `${count} ${pluralQuestions(count)}`}
                              </span>
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="sticky bottom-4 mt-6 flex flex-col gap-3 border border-line bg-white p-4 shadow-lg sm:mt-8 sm:p-5 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-ink/70">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="h-4 w-4 accent-pine-600"
                  />
                  <Shuffle size={15} className="text-ink/40" />
                  Перемешать вопросы
                </label>
                <span className="flex items-center gap-1.5 text-sm text-ink/50">
                  <ListChecks size={15} />
                  {selectedCount === 0
                    ? 'Темы не выбраны'
                    : `${selectedCount} ${pluralTopics(selectedCount)} · в тренировке ${plannedCount} из ${selectedQuestionsAvailable} ${pluralQuestions(selectedQuestionsAvailable)}`}
                </span>
              </div>
              <QuestionLimitPicker
                value={questionLimit}
                onChange={setQuestionLimit}
                available={selectedQuestionsAvailable}
              />
              <button
                onClick={startTraining}
                disabled={(!isLocked && selectedCount === 0) || starting}
                className="flex items-center justify-center gap-2 bg-pine-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-pine-700 disabled:opacity-40"
              >
                {isLocked && <Crown size={15} />}
                {starting ? 'Собираем вопросы...' : isLocked ? 'Начать тренировку · PRO' : 'Начать тренировку'}
              </button>
            </div>
          </>
        )}
      </main>
    )
  }

  // ---------- Итоговый экран ----------
  if (phase === 'finished') {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <Breadcrumbs items={[{ label: 'Тренировка по темам', to: '/trenirovka' }, { label: 'Результат' }]} />
        <div className="mt-6 border border-line bg-white p-4 sm:mt-8 sm:p-7 lg:p-8">
          <ResultScreen
            kicker="Тренировка завершена"
            ratio={totalMax ? totalScore / totalMax : 0}
            score={Math.round(totalScore * 100) / 100}
            maxScore={totalMax}
            counts={resultCounts}
            onReview={startReview}
            actions={
              <>
                <button onClick={restartSameTopics} className={secondaryActionClass}>
                  <RotateCcw size={15} /> Повторить эти темы
                </button>
                <button onClick={backToSetup} className={secondaryActionClass}>
                  Выбрать другие темы <ArrowRight size={15} />
                </button>
              </>
            }
          />
        </div>
      </main>
    )
  }

  // ---------- Сама сессия тренировки ----------
  if (questions.length === 0 || !question) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6">
        <p className="text-sm text-ink/50">По выбранным темам не нашлось вопросов.</p>
        <button
          onClick={backToSetup}
          className="mt-4 bg-pine-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-pine-700"
        >
          Выбрать другие темы
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <Breadcrumbs items={[{ label: 'Тренировка по темам', to: '/trenirovka' }, { label: 'Тренировка' }]} />

      <div className="mt-5 flex flex-col gap-4 sm:mt-6 sm:gap-6 lg:flex-row">
        <QuestionNavGrid
          groups={groups}
          currentStepIndex={currentIndex}
          statuses={statuses}
          totalQuestions={questions.length}
          answeredCount={answeredCount}
          elapsedSeconds={0}
          isPaused
          onToggleTimer={() => {}}
          onSelectStep={goTo}
        />

        <div className="flex-1 border border-line bg-white p-4 sm:p-7 lg:p-8">
          <div className="flex items-center justify-between gap-3">
            <span className="border border-line px-3 py-1.5 text-sm font-semibold text-ink/70">
              Вопрос {currentIndex + 1} из {questions.length}
              {question?.topic_code && topicByCode[question.topic_code]
                ? ` · ${question.topic_code}`
                : ''}
            </span>
            {completed && (
              <button
                onClick={() => setPhase('finished')}
                className="flex items-center gap-1.5 bg-pine-50 px-3 py-1.5 text-sm font-semibold text-pine-700 hover:bg-pine-100"
              >
                <Eye size={15} /> Разбор · к результату
              </button>
            )}
          </div>

          <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-ink/40 sm:mt-6">Вопрос</h2>
          <div className="mt-2">
            <HighlightableText
              text={question.prompt}
              highlights={highlightsByQuestion[currentIndex] ?? []}
              onHighlightsChange={(next) => setHighlightsByQuestion((prev) => ({ ...prev, [currentIndex]: next }))}
              onAddWordRequest={setWordModalPrefill}
              className="text-lg font-semibold leading-snug"
            />
          </div>
          <p className="mt-1.5 text-xs text-ink/35">
            Выдели слово или фразу мышкой, чтобы перевести её или добавить слово в словарь.
          </p>

          {question.image_url && (
            <img
              src={question.image_url}
              alt=""
              className="mt-4 max-h-80 w-full border border-line object-contain"
            />
          )}

          <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-ink/40 sm:mt-6">
            Варианты ответов <span className="normal-case text-ink/35">(можно выбрать несколько)</span>
          </h3>
          <div className="mt-3 space-y-3">
            {question.options.map((opt) => {
              const isSelected = currentAnswer ? currentAnswer.selected.includes(opt.id) : pendingSelection.includes(opt.id)
              const isCorrectOption = question.correct_option_ids.includes(opt.id)

              let rowClass = 'border-line'
              let textClass = 'text-ink'
              // В разборе верные ответы видны и у вопросов, оставленных без ответа.
              if (currentAnswer || completed) {
                if (isCorrectOption) {
                  rowClass = 'border-pine-600'
                  textClass = 'text-pine-700'
                } else if (isSelected) {
                  rowClass = 'border-red-500'
                  textClass = 'text-red-600'
                }
              } else if (isSelected) {
                rowClass = 'border-ink/30'
              }

              const optionKey = `${currentIndex}:${opt.id}`

              return (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 border-b pb-3 ${rowClass} ${
                    currentAnswer || completed ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={Boolean(currentAnswer) || completed}
                    onChange={() => toggleOption(opt.id)}
                    className="mt-1 h-4 w-4 shrink-0 accent-pine-600"
                  />
                  <HighlightableText
                    as="span"
                    text={opt.text}
                    highlights={highlightsByOption[optionKey] ?? []}
                    onHighlightsChange={(next) => setHighlightsByOption((prev) => ({ ...prev, [optionKey]: next }))}
                    onAddWordRequest={setWordModalPrefill}
                    className={`block text-[15px] font-medium ${textClass}`}
                  />
                </label>
              )
            })}
          </div>

          {!currentAnswer && !completed && (
            <button
              onClick={submitAnswer}
              disabled={pendingSelection.length === 0}
              className="mt-4 bg-pine-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-pine-700 disabled:opacity-40"
            >
              Ответить
            </button>
          )}

          {!currentAnswer && completed && (
            <div className="mt-6 flex items-start gap-3 bg-paper p-5">
              <Circle size={20} className="mt-0.5 shrink-0 text-ink/35" />
              <div className="text-sm">
                <p className="font-bold text-ink/70">Без ответа — 0 из {question.points ?? 1} баллов</p>
                <p className="mt-1 text-ink/55">Верные варианты отмечены зелёным.</p>
                {question.explanation && <p className="mt-1 whitespace-pre-line text-ink/70">{question.explanation}</p>}
              </div>
            </div>
          )}

          {currentAnswer && (
            <div
              className={`mt-6 flex items-start gap-3 p-5 ${
                currentAnswer.status === 'correct' ? 'bg-pine-50/70' : currentAnswer.status === 'partial' ? 'bg-amber-50' : 'bg-red-50'
              }`}
            >
              {currentAnswer.status === 'correct' ? (
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-pine-600" />
              ) : currentAnswer.status === 'partial' ? (
                <MinusCircle size={20} className="mt-0.5 shrink-0 text-amber-600" />
              ) : (
                <XCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
              )}
              <div className="text-sm">
                <p
                  className={`font-bold ${
                    currentAnswer.status === 'correct'
                      ? 'text-pine-700'
                      : currentAnswer.status === 'partial'
                        ? 'text-amber-700'
                        : 'text-red-700'
                  }`}
                >
                  {currentAnswer.status === 'correct' ? 'Правильно!' : currentAnswer.status === 'partial' ? 'Частично верно' : 'Неправильно'}{' '}
                  — {currentAnswer.score} из {currentAnswer.max} баллов
                </p>
                {question.explanation && <p className="mt-1 whitespace-pre-line text-ink/70">{question.explanation}</p>}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2.5 border-t border-line pt-5 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-6">
            <button
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="flex w-full items-center justify-center gap-2 border border-line px-5 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:border-ink/30 disabled:opacity-40 sm:w-auto sm:justify-start"
            >
              <ArrowLeft size={15} /> Назад
            </button>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
              {!completed && (
                <button
                  onClick={() => goTo(currentIndex + 1)}
                  disabled={currentIndex === questions.length - 1}
                  className="w-full border border-line px-5 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:border-ink/30 disabled:opacity-40 sm:w-auto"
                >
                  Пропустить
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex w-full items-center justify-center gap-2 bg-pine-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-pine-700 sm:w-auto sm:justify-start"
              >
                {currentIndex === questions.length - 1 ? (completed ? 'К результату' : 'Завершить') : 'Далее'}{' '}
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {wordModalPrefill !== null && (
        <AddWordModal
          initial={{ word: wordModalPrefill }}
          existingCategories={vocabulary.categories}
          onSave={handleSaveWord}
          onClose={() => setWordModalPrefill(null)}
        />
      )}
    </main>
  )
}

// Выбор количества вопросов: быстрые варианты + своё число. null = все.
const LIMIT_PRESETS = [10, 20, 30]

function QuestionLimitPicker({ value, onChange, available }) {
  const isCustom = value !== null && !LIMIT_PRESETS.includes(value)
  const chip = (active) =>
    `px-3 py-1.5 text-sm font-semibold transition-colors ${
      active ? 'bg-pine-600 text-white' : 'text-ink/60 hover:bg-black/5'
    }`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-ink/70">Вопросов:</span>
      <div className="flex gap-1 border border-line p-1">
        {LIMIT_PRESETS.map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} className={chip(value === n)}>
            {n}
          </button>
        ))}
        <button type="button" onClick={() => onChange(null)} className={chip(value === null)}>
          Все
        </button>
      </div>
      <input
        type="number"
        min={1}
        max={available || undefined}
        value={isCustom ? value : ''}
        onChange={(e) => {
          const n = Math.floor(Number(e.target.value))
          onChange(e.target.value === '' || !(n > 0) ? null : n)
        }}
        placeholder="своё"
        aria-label="Своё количество вопросов"
        className={`w-20 border px-2.5 py-1.5 text-sm focus:outline-none ${
          isCustom ? 'border-pine-600' : 'border-line'
        }`}
      />
    </div>
  )
}

function pluralQuestions(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'вопрос'
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'вопроса'
  return 'вопросов'
}

function pluralTopics(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'тема'
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'темы'
  return 'тем'
}
