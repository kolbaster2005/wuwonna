import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// При переходе на другую страницу — в самый верх. Сам роутер прокрутку не
// сбрасывает, и новая страница открывалась на той же высоте, что и прошлая.
// Не трогаем:
//   • «назад» / «вперёд» в браузере (POP) — там браузер возвращает туда, где был;
//   • смену только ?tab= на той же странице — вкладки не должны дёргать экран.
// behavior: 'instant' — иначе сработает плавная прокрутка из index.css.
export default function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    if (navigationType === 'POP') return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    // только смена адреса страницы: тип перехода меняется и при смене ?tab=
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return null
}
