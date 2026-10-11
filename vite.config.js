import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages ничего не знает о маршрутах приложения: при открытии/обновлении
// любой страницы, кроме главной (например /exam-prep-app/probniki), он ищет
// такой файл, не находит и отдаёт 404.html. Кладём туда копию index.html —
// тогда загружается само приложение, а роутер уже показывает нужную страницу.
function spaFallback404() {
  let outDir
  return {
    name: 'spa-fallback-404',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react(), tailwindcss(), spaFallback404()],
  // Сайт живёт на своём домене wuwonna.at (GitHub Pages + public/CNAME), то
  // есть в корне — поэтому base '/' и в разработке, и в сборке. Если когда-то
  // понадобится адрес вида <логин>.github.io/<репозиторий>/ без домена —
  // поставить base: '/<репозиторий>/' для сборки. Роутер (main.jsx) и пути к
  // картинкам берут его из import.meta.env.BASE_URL сами.
  base: '/',
}))
