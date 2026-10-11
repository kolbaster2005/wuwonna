import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, MinusCircle, BookOpen, Circle, Eye } from 'lucide-react'
import { fetchTestById, fetchQuestions, fetchPassages, fetchCategories, saveAttempt } from '../lib/data'
import { buildSteps, buildGroups, findPinnedPassage } from '../lib/steps'
import { scoreQuestion, scoreStatus } from '../lib/scoring'
import { useVocabulary } from '../lib/useVocabulary'
import { useAuth } from '../lib/authContext'
import RichSelectableContent from '../components/RichSelectableContent'
import Breadcrumbs from '../components/Breadcrumbs'
import QuestionNavGrid from '../components/QuestionNavGrid'
import HighlightableText from '../components/HighlightableText'
import RichText from '../components/RichText'
import AddWordModal from '../components/AddWordModal'
import ProLockedNotice from '../components/ProLockedNotice'
import ResultScreen, { secondaryActionClass } from '../components/ResultScreen'
import { useConfirm } from '../lib/confirmDialog'

// Строка под результатом: сохранился ли результат и где.
function SaveStatus({ status, isGuest }) {
  if (status === 'saving') return 'Сохраняем результат…'
  if (status === 'error') return 'Не получилось сохранить результат.'
  if (status === 'saved') {
    return (
      <>
        Результат сохранён —{' '}
        <Link to="/progress" className="font-semibold text-pine-700 hover:underline">
          смотри «Мой прогресс»
        </Link>
      </>
    )
  }
  if (status === 'local') {
    return isGuest ? (
      <div className="mx-auto mt-2 max-w-md rounded-2xl border border-pine-100 bg-pine-50 p-5 text-left text-sm">
        <p className="text-base font-extrabold text-ink">Сохрани результат в аккаунте</p>
        <p className="mt-1 leading-relaxed text-ink/65">
          Сейчас он только в этом браузере. С аккаунтом прогресс по главам и словарь будут с тобой на любом
          устройстве — всё, что уже сохранено здесь, перенесётся само.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link to="/login" state={{ from: { pathname: '/progress' }, mode: 'signup' }} className="btn btn-primary btn-sm px-4 py-2.5">
            Создать аккаунт
          </Link>
          <Link to="/login" state={{ from: { pathname: '/progress' } }} className="btn btn-secondary btn-sm px-4 py-2.5">
            У меня есть аккаунт
          </Link>
        </div>
      </div>
    ) : (
      'Сохранить в аккаунт пока не получилось — результат временно сохранён в этом браузере и перенесётся в аккаунт автоматически.'
    )
  }
  return null
}

function pluralQuestions(n) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'вопрос'
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'вопроса'
  return 'вопросов'
}

export default function TestTakingPage() {
  const vocabulary = useVocabulary()
  const confirmAction = useConfirm()
  const { testId } = useParams()
  const { user, hasPro, loading: authLoading } = useAuth()
  const [test, setTest] = useState(undefined)
  const [questions, setQuestions] = useState([])
  const [passages, setPassages] = useState([])

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // questionIndex -> { selected, score, max, status }
  const [pendingSelection, setPendingSelection] = useState([])
  const [highlightsByQuestion, setHighlightsByQuestion] = useState({}) // questionIndex -> [{start,end}]
  const [highlightsByOption, setHighlightsByOption] = useState({}) // "qIndex:optId" -> [{start,end}]
  const [highlightsByPassage, setHighlightsByPassage] = useState({}) // passageId -> [{start,end}]
  const [finished, setFinished] = useState(false) // сейчас открыт экран результата
  // completed — тест уже завершён хотя бы раз. После этого вопросы открываются
  // в режиме разбора: ответить больше нельзя, видно свой выбор и верный ответ,
  // таймер стоит. Результат сохраняется один раз — при первом «Завершить».
  const [completed, setCompleted] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saving' | 'saved' | 'local' | 'error'
  const [categories, setCategories] = useState([])

  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const [wordModalPrefill, setWordModalPrefill] = useState(null) // string | null

  useEffect(() => {
    let alive = true
    Promise.all([fetchTestById(testId), fetchQuestions(testId), fetchPassages(testId), fetchCategories()]).then(
      ([t, qs, ps, cats]) => {
        if (alive) {
          setTest(t)
          setQuestions(qs)
          setPassages(ps)
          setCategories(cats)
        }
      },
    )
    return () => {
      alive = false
    }
  }, [testId])

  // Таймер стартует, как только начинается тестирование, и тикает, пока не
  // поставлен на паузу.
  // После «Завершить» таймер останавливается насовсем — и на экране
  // результата, и во время разбора ответов.
  useEffect(() => {
    if (isPaused || completed || questions.length === 0) return
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [isPaused, completed, questions.length])

  const steps = useMemo(() => buildSteps(questions, passages), [questions, passages])
  const groups = useMemo(() => buildGroups(steps), [steps])

  const currentStep = steps[currentStepIndex]
  const currentQuestionIndex = currentStep?.type === 'question' ? currentStep.questionIndex : null
  const question = currentQuestionIndex !== null ? questions[currentQuestionIndex] : null
  const currentAnswer = currentQuestionIndex !== null ? answers[currentQuestionIndex] : null

  const pinnedPassage =
    currentQuestionIndex !== null ? findPinnedPassage(questions, passages, currentQuestionIndex) : null

  const statuses = useMemo(() => {
    const map = {}
    Object.entries(answers).forEach(([i, a]) => (map[i] = a.status))
    return map
  }, [answers])

  const currentQuestionNumber = useMemo(() => {
    for (const group of groups) {
      const found = group.questionSteps.find((qs) => qs.stepIndex === currentStepIndex)
      if (found) return found.questionNumber
    }
    return null
  }, [groups, currentStepIndex])

  useEffect(() => {
    setPendingSelection(currentAnswer?.selected ?? [])
  }, [currentStepIndex, currentAnswer])

  if (test === undefined || authLoading) {
    return <main className="mx-auto max-w-6xl px-6 py-12 text-sm text-ink/40">Загружаем тест...</main>
  }
  if (test === null) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h1 className="text-2xl font-extrabold">Пробник не найден</h1>
        <p className="mt-2 text-ink/55">Возможно, он был удалён или ссылка устарела.</p>
      </main>
    )
  }
  // Прямая ссылка на /exam не должна обходить замок со страницы пробника.
  if (test?.is_pro && !hasPro) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <Breadcrumbs items={[{ label: 'Пробники', to: '/probniki' }, { label: test.title, to: `/probniki/${test.id}` }]} />
        <div className="mt-5 rounded-2xl border border-line bg-white p-5 sm:mt-6 sm:p-8 lg:p-10">
          <ProLockedNotice testTitle={test.title} />
        </div>
      </main>
    )
  }
  // Тест и вопросы грузятся одним Promise.all, так что здесь вопросы уже
  // загружены — пустой список значит, что их действительно нет.
  if (questions.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <Breadcrumbs items={[{ label: 'Пробники', to: '/probniki' }, { label: test.title, to: `/probniki/${test.id}` }]} />
        <div className="mt-5 rounded-2xl border border-line bg-white px-5 py-16 text-center sm:mt-6">
          <h1 className="text-xl font-extrabold">В этом пробнике пока нет вопросов</h1>
          <p className="mt-2 text-sm text-ink/55">Загляни попозже — их скоро добавят.</p>
        </div>
      </main>
    )
  }

  // Выбор нескольких вариантов доступен всегда, независимо от того, один
  // верный ответ у вопроса или несколько.
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
    setAnswers((prev) => ({ ...prev, [currentQuestionIndex]: { selected: pendingSelection, score, max, status } }))
  }

  function goToStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= steps.length) return
    setCurrentStepIndex(stepIndex)
    setFinished(false)
  }

  function handleSkip() {
    goToStep(currentStepIndex + 1)
  }

  async function handleNext() {
    if (currentStepIndex === steps.length - 1) {
      if (completed) {
        setFinished(true) // в разборе последняя кнопка просто возвращает к результату
        return
      }
      if (answeredCount < questions.length) {
        const unanswered = questions.length - answeredCount
        const confirmed = await confirmAction({
          title: 'Завершить тест?',
          message: `Без ответа ${unanswered} ${pluralQuestions(unanswered)} из ${questions.length} — они засчитаются в 0 баллов.`,
          confirmLabel: 'Завершить',
          cancelLabel: 'Вернуться к вопросам',
        })
        if (!confirmed) return
      }
      setFinished(true)
      setCompleted(true)
      saveResult()
      return
    }
    goToStep(currentStepIndex + 1)
  }

  // «Разобрать ответы» — на первый вопрос (вступления пропускаем).
  function startReview() {
    const firstQuestionStep = steps.findIndex((s) => s.type === 'question')
    goToStep(firstQuestionStep === -1 ? 0 : firstQuestionStep)
  }

  // Попытка для «Моего прогресса»: баллы, время и баллы по каждому вопросу.
  async function saveResult() {
    setSaveStatus('saving')
    try {
      const saved = await saveAttempt(user?.id, {
        test_id: test.id,
        score: Math.round(totalScore * 100) / 100,
        max_score: totalMax,
        questions_count: questions.length,
        answered_count: answeredCount,
        duration_seconds: elapsedSeconds,
        answers: Object.entries(answers).map(([index, a]) => ({
          question_id: questions[index].id,
          score: a.score,
          max: a.max,
        })),
      })
      setSaveStatus(saved.savedLocally ? 'local' : 'saved')
    } catch (err) {
      console.error('saveResult error:', err)
      setSaveStatus('error')
    }
  }

  async function handleSaveWord(data) {
    await vocabulary.add(data)
    setWordModalPrefill(null)
  }

  const totalScore = Object.values(answers).reduce((sum, a) => sum + a.score, 0)
  const totalMax = questions.reduce((sum, q) => sum + (q.points ?? 1), 0)
  const answeredCount = Object.keys(answers).length

  const resultCounts = { correct: 0, partial: 0, incorrect: 0, unanswered: questions.length - answeredCount }
  Object.values(answers).forEach((a) => (resultCounts[a.status] += 1))

  // Куда вернуться после теста: глава (есть раздел) — к остальным главам её
  // вкладки, иначе — к остальным пробникам этой вкладки.
  const testCategory = categories.find((c) => c.id === test.category_id)
  const backToList = {
    to: testCategory ? `/probniki?tab=${encodeURIComponent(testCategory.slug)}` : '/probniki',
    label: test.section?.trim() ? 'К остальным главам' : 'К остальным пробникам',
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: 'Пробники', to: '/probniki' },
          { label: test.title, to: `/probniki/${test.id}` },
          { label: 'Выполнение' },
        ]}
      />

      <div className="mt-5 flex flex-col gap-4 sm:mt-6 sm:gap-6 lg:flex-row">
        <QuestionNavGrid
          groups={groups}
          currentStepIndex={currentStepIndex}
          statuses={statuses}
          totalQuestions={questions.length}
          answeredCount={answeredCount}
          elapsedSeconds={elapsedSeconds}
          isPaused={isPaused}
          onToggleTimer={() => setIsPaused((p) => !p)}
          onSelectStep={goToStep}
        />

        <div className="flex-1 rounded-2xl border border-line bg-white p-4 sm:p-7 lg:p-8">
          {finished ? (
            <ResultScreen
              kicker="Тест завершён"
              ratio={totalMax ? totalScore / totalMax : 0}
              score={Math.round(totalScore * 100) / 100}
              maxScore={totalMax}
              counts={resultCounts}
              elapsedSeconds={elapsedSeconds}
              onReview={startReview}
              actions={
                <Link to={backToList.to} className={secondaryActionClass}>
                  {backToList.label} <ArrowRight size={15} />
                </Link>
              }
              footer={<SaveStatus status={saveStatus} isGuest={!user} />}
            />
          ) : currentStep.type === 'intro' ? (
            <div>
              <span className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink/70">
                Вступление · {currentStep.passage.category}
              </span>
              {currentStep.passage.title && (
                <h2 className="mt-5 text-2xl font-extrabold tracking-tight">{currentStep.passage.title}</h2>
              )}
              <RichText text={currentStep.passage.content} className="mt-4 leading-relaxed text-ink/80" />

              <div className="mt-6 flex items-center justify-between border-t border-line pt-5 sm:mt-8 sm:pt-6">
                <button
                  onClick={() => goToStep(currentStepIndex - 1)}
                  disabled={currentStepIndex === 0}
                  className="flex items-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:border-ink/30 disabled:opacity-40"
                >
                  <ArrowLeft size={15} /> Назад
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-pine-700"
                >
                  К вопросам <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div className={pinnedPassage ? 'grid grid-cols-1 gap-6 xl:grid-cols-2' : ''}>
              {pinnedPassage && (
                <div className="max-h-[75vh] overflow-y-auto rounded-xl border border-line bg-paper/60 p-4 sm:p-5 xl:sticky xl:top-4 xl:self-start">
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink/50">
                    <BookOpen size={15} /> Текст для чтения
                  </div>
                  {pinnedPassage.title && <h3 className="mt-2 text-lg font-bold">{pinnedPassage.title}</h3>}
                  <div className="mt-3">
                    <RichSelectableContent
                      content={pinnedPassage.content}
                      highlights={highlightsByPassage[pinnedPassage.id] ?? []}
                      onHighlightsChange={(next) =>
                        setHighlightsByPassage((prev) => ({ ...prev, [pinnedPassage.id]: next }))
                      }
                      onAddWordRequest={setWordModalPrefill}
                      className="space-y-3 text-[15px] leading-relaxed text-ink/80"
                    />
                  </div>
                  <p className="mt-3 text-xs text-ink/35">
                    Выдели слово или фразу, чтобы перевести её или добавить в словарь.
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-ink/70">
                    Вопрос {currentQuestionNumber} из {questions.length}
                  </span>
                  {completed && (
                    <button
                      onClick={() => setFinished(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-pine-50 px-3 py-1.5 text-sm font-semibold text-pine-700 hover:bg-pine-100"
                    >
                      <Eye size={15} /> Разбор · к результату
                    </button>
                  )}
                </div>

                <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-ink/40 sm:mt-6">Вопрос</h2>
                <div className="mt-2">
                  <HighlightableText
                    text={question.prompt}
                    highlights={highlightsByQuestion[currentQuestionIndex] ?? []}
                    onHighlightsChange={(next) =>
                      setHighlightsByQuestion((prev) => ({ ...prev, [currentQuestionIndex]: next }))
                    }
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
                    className="mt-4 max-h-80 w-full rounded-xl border border-line object-contain"
                  />
                )}

                <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-ink/40 sm:mt-6">
                  Варианты ответов <span className="normal-case text-ink/35">(можно выбрать несколько)</span>
                </h3>
                <div className="mt-3 space-y-3">
                  {question.options.map((opt) => {
                    const isSelected = currentAnswer
                      ? currentAnswer.selected.includes(opt.id)
                      : pendingSelection.includes(opt.id)
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

                    const optionKey = `${currentQuestionIndex}:${opt.id}`

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
                          onHighlightsChange={(next) =>
                            setHighlightsByOption((prev) => ({ ...prev, [optionKey]: next }))
                          }
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
                    className="mt-4 rounded-lg bg-pine-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-pine-700 disabled:opacity-40"
                  >
                    Ответить
                  </button>
                )}

                {!currentAnswer && completed && (
                  <div className="mt-6 flex items-start gap-3 rounded-xl bg-paper p-5">
                    <Circle size={20} className="mt-0.5 shrink-0 text-ink/35" />
                    <div className="text-sm">
                      <p className="font-bold text-ink/70">Без ответа — 0 из {question.points ?? 1} баллов</p>
                      <p className="mt-1 text-ink/55">Верные варианты отмечены зелёным.</p>
                      {question.explanation && (
                        <p className="mt-1 whitespace-pre-line text-ink/70">{question.explanation}</p>
                      )}
                    </div>
                  </div>
                )}

                {currentAnswer && (
                  <div
                    className={`mt-6 flex items-start gap-3 rounded-xl p-5 ${
                      currentAnswer.status === 'correct'
                        ? 'bg-pine-50/70'
                        : currentAnswer.status === 'partial'
                          ? 'bg-amber-50'
                          : 'bg-red-50'
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
                        {currentAnswer.status === 'correct'
                          ? 'Правильно!'
                          : currentAnswer.status === 'partial'
                            ? 'Частично верно'
                            : 'Неправильно'}{' '}
                        — {currentAnswer.score} из {currentAnswer.max} баллов
                      </p>
                      {question.explanation && (
                        <p className="mt-1 whitespace-pre-line text-ink/70">{question.explanation}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-2.5 border-t border-line pt-5 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-6">
                  <button
                    onClick={() => goToStep(currentStepIndex - 1)}
                    disabled={currentStepIndex === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:border-ink/30 disabled:opacity-40 sm:w-auto sm:justify-start"
                  >
                    <ArrowLeft size={15} /> Назад
                  </button>
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                    {!completed && (
                      <button
                        onClick={handleSkip}
                        className="w-full rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:border-ink/30 sm:w-auto"
                      >
                        Пропустить
                      </button>
                    )}
                    <button
                      onClick={handleNext}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-pine-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-pine-700 sm:w-auto sm:justify-start"
                    >
                      {currentStepIndex === steps.length - 1 ? (completed ? 'К результату' : 'Завершить') : 'Далее'}{' '}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
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
