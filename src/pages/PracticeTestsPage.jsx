import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ShieldCheck, CalendarDays, Search, ClipboardList } from 'lucide-react'
import { fetchTests, fetchCategories, fetchAttempts } from '../lib/data'
import { statsByTest } from '../lib/progress'
import { useAuth } from '../lib/authContext'
import { ORIGINALITY_OPTIONS } from '../lib/originality'
import TestCard from '../components/TestCard'
import FilterSelect from '../components/FilterSelect'
import PageHeader from '../components/PageHeader'
import Tabs from '../components/Tabs'
import { useI18n } from '../i18n'

// Вкладки (slug категории), где полоска фильтров не нужна — там пробники и так
// разложены по главам.
const TABS_WITHOUT_FILTERS = ['основы-экономики']

export default function PracticeTestsPage() {
  const { t } = useI18n()
  const [categories, setCategories] = useState([])
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  // Результаты по тестам (лучший %, число попыток) — чтобы пометить
  // пройденные карточки. Те же данные, что и в «Моём прогрессе».
  const { user, loading: authLoading } = useAuth()
  const [resultsByTest, setResultsByTest] = useState({})

  const [originality, setOriginality] = useState('')
  const [year, setYear] = useState('')
  const [search, setSearch] = useState('')

  // Активная вкладка живёт в URL (?tab=<slug категории>) — так ссылку на
  // конкретную вкладку можно отправить, и она переживает перезагрузку.
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = categories.find((c) => c.slug === searchParams.get('tab')) ?? categories[0] ?? null

  function load() {
    return Promise.all([fetchCategories(), fetchTests()]).then(([cats, allTests]) => {
      setCategories(cats)
      setTests(allTests)
      setLoading(false)
    })
  }

  useEffect(() => {
    load().catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (authLoading) return
    let alive = true
    fetchAttempts(user?.id)
      .then((attempts) => alive && setResultsByTest(statsByTest(attempts)))
      .catch((err) => console.error('fetchAttempts error:', err))
    return () => {
      alive = false
    }
  }, [authLoading, user?.id])

  const showFilters = !TABS_WITHOUT_FILTERS.includes(activeCategory?.slug)

  // При смене вкладки фильтры сбрасываются — иначе запрос из одной вкладки
  // молча фильтровал бы другую, где полоски фильтров может и не быть.
  function selectTab(category) {
    setSearchParams({ tab: category.slug }, { replace: true })
    setOriginality('')
    setYear('')
    setSearch('')
  }

  const testsInTab = useMemo(
    () => (activeCategory ? tests.filter((t) => t.category_id === activeCategory.id) : tests),
    [tests, activeCategory],
  )
  const years = useMemo(() => [...new Set(testsInTab.map((t) => String(t.year)))], [testsInTab])

  const filtered = testsInTab.filter((t) => {
    if (!showFilters) return true
    if (originality && t.originality !== originality) return false
    if (year && String(t.year) !== year) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Подзаголовки внутри вкладки ("Глава 1", "Глава 2"...) — по полю section.
  // Разделы идут в порядке первого появления в списке (то есть в порядке,
  // выставленном перетаскиванием в админке), пробники без раздела — своей
  // группой без подзаголовка.
  const sections = []
  filtered.forEach((test) => {
    const title = test.section?.trim() || null
    let group = sections.find((s) => s.title === title)
    if (!group) {
      group = { title, tests: [] }
      sections.push(group)
    }
    group.tests.push(test)
  })

  return (
    <main className="page">
      <PageHeader
        icon={ClipboardList}
        title={t('tests.title')}
        subtitle={t('tests.subtitle')}
      >
        {categories.length > 0 && (
          <Tabs
            className="mt-6"
            items={categories.map((c) => ({ id: c.id, label: c.name }))}
            value={activeCategory?.id}
            onChange={(id) => selectTab(categories.find((c) => c.id === id))}
          />
        )}
      </PageHeader>

      {showFilters && (
      <div className="card flex flex-col gap-2.5 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
        <FilterSelect
          icon={ShieldCheck}
          label={t('tests.filters.originality')}
          options={ORIGINALITY_OPTIONS.map((o) => ({ value: o.value, label: t(`originality.${o.value}`) }))}
          value={originality}
          onChange={setOriginality}
        />
        <FilterSelect icon={CalendarDays} label={t('tests.filters.year')} options={years} value={year} onChange={setYear} />

        <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 py-2.5 sm:px-4 sm:py-3">
          <Search size={17} className="shrink-0 text-ink/40" strokeWidth={2} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('tests.filters.search')}
            className="w-full bg-transparent text-sm font-medium text-ink placeholder:text-ink/40 focus:outline-none"
          />
        </div>
      </div>
      )}

      {loading ? (
        <div className="mt-10 text-center text-sm text-ink/40">{t('tests.loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-line-strong py-16 text-center text-sm text-ink/50">
          {testsInTab.length === 0
            ? t('tests.emptyTab')
            : t('tests.nothingFound')}
        </div>
      ) : (
        <div className={`space-y-10 sm:space-y-12 ${showFilters ? 'mt-6 sm:mt-8' : ''}`}>
          {sections.map((section) => (
            <section key={section.title ?? '__none'}>
              {section.title && (
                <h2 className="mb-4 text-xl font-extrabold tracking-tight sm:mb-5 sm:text-2xl">
                  {section.title}
                </h2>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {section.tests.map((test) => (
                  <TestCard key={test.id} test={test} result={resultsByTest[test.id]} onPinChange={load} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  )
}
