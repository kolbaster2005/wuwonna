import TestTakingPage from './TestTakingPage'

// Результат пройденного пробника: тот же экран, что сразу после теста, с
// разбором ответов сохранённой попытки (?attempt=<id>, без него — последней).
export default function TestResultPage() {
  return <TestTakingPage review />
}
