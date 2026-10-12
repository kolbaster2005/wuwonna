import { Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import PracticeTestsPage from './pages/PracticeTestsPage'
import TestDetailPage from './pages/TestDetailPage'
import TestTakingPage from './pages/TestTakingPage'
import ExamInfoPage from './pages/ExamInfoPage'
import AboutPage from './pages/AboutPage'
import VocabularyPage from './pages/VocabularyPage'
import ProgressPage from './pages/ProgressPage'
import ProPage from './pages/ProPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import LandingPage from './pages/LandingPage'
import RequireAuth from './components/RequireAuth'
import { RouteSeo } from './components/Seo'
import { LANDINGS } from './seo/content'
import { ENABLED_LANGS, ROUTES } from './i18n/routes'
import AdminLayout from './pages/admin/AdminLayout'
import AdminTestsListPage from './pages/admin/AdminTestsListPage'
import AdminTestFormPage from './pages/admin/AdminTestFormPage'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminBookPage from './pages/admin/AdminBookPage'
import AdminBookChapterPage from './pages/admin/AdminBookChapterPage'
import AdminBookSubchapterPage from './pages/admin/AdminBookSubchapterPage'

// Страница для каждого ключа маршрута (src/i18n/routes.js). Маршруты
// создаются на каждом языке из ROUTES — сами страницы не дублируются, язык
// они берут из адреса (useI18n).
//
// Режим тренировки пока скрыт. Чтобы вернуть: импорт TrainingPage из
// './pages/TrainingPage', маршрут /trenirovka и входы на него (кнопка на
// «Пробниках», футер, плитка на главной, PRO).
// Книга пока скрыта с сайта. Чтобы вернуть: импорт BookPage из
// './pages/BookPage', маршрут /kniga и пункт в навигации Header.jsx.
// Наполнять её можно в /admin/kniga.
const PAGES = {
  home: HomePage,
  tests: PracticeTestsPage,
  test: TestDetailPage,
  testExam: TestTakingPage,
  vocabulary: VocabularyPage,
  progress: ProgressPage,
  pro: ProPage,
  examInfo: ExamInfoPage,
  about: AboutPage,
  login: LoginPage,
}

const pageRoutes = ENABLED_LANGS.flatMap((lang) =>
  Object.entries(PAGES).map(([key, Page]) => (
    <Route key={`${lang}:${key}`} path={ROUTES[key][lang]} element={<Page />} />
  )),
)

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <RouteSeo />
      <Header />
      {/* Область страницы — не ниже экрана за вычетом шапки (4.5rem + 1px: py-4 +
          аватарка/«Войти» h-10 + граница), поэтому футер всегда ниже первого экрана. */}
      <div className="min-h-[calc(100svh-4.5rem-1px)] flex-1">
        <Routes>
          {pageRoutes}
          {/* Посадочные страницы под поисковые запросы (RU/DE/EN) — тексты в src/seo/content.js */}
          {Object.keys(LANDINGS).map((path) => (
            <Route key={path} path={path} element={<LandingPage path={path} />} />
          ))}

          <Route element={<RequireAuth />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="probniki" replace />} />
              <Route path="probniki" element={<AdminTestsListPage />} />
              <Route path="probniki/new" element={<AdminTestFormPage />} />
              <Route path="probniki/:testId" element={<AdminTestFormPage />} />
              <Route path="kniga" element={<AdminBookPage />} />
              <Route path="kniga/:chapterId" element={<AdminBookChapterPage />} />
              <Route path="kniga/:chapterId/:subchapterId" element={<AdminBookSubchapterPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="users" element={<AdminUsersPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}
