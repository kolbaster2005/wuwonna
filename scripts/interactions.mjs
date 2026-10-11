// Проверка взаимодействий (не только вида): меню, модалки, вкладки, форма
// входа, прохождение теста с окном подтверждения. Нужен dev-сервер с базой.
//   node scripts/interactions.mjs http://localhost:5173
import { chromium } from 'playwright'

const baseUrl = process.argv[2] ?? 'http://localhost:5173'
const browser = await chromium.launch()
const results = []
const errors = []

async function check(name, fn) {
  try {
    await fn()
    results.push(`OK    ${name}`)
  } catch (err) {
    results.push(`FAIL  ${name}: ${err.message.split('\n')[0]}`)
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message)
}

// --- телефон: бургер-меню на весь экран ---
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' })

  await check('мобильное меню открывается на весь экран', async () => {
    await page.getByRole('button', { name: 'Открыть меню' }).click()
    const dialog = page.getByRole('dialog', { name: 'Меню' })
    await dialog.waitFor()
    const box = await dialog.boundingBox()
    expect(box.height >= 800 && box.width >= 380, `размер меню ${box.width}x${box.height}`)
    const overflow = await page.evaluate(() => document.body.style.overflow)
    expect(overflow === 'hidden', 'страница под меню прокручивается')
  })
  await check('мобильное меню закрывается по Esc', async () => {
    await page.keyboard.press('Escape')
    await page.getByRole('dialog', { name: 'Меню' }).waitFor({ state: 'detached' })
  })
  await check('пункт меню ведёт на страницу и закрывает меню', async () => {
    await page.getByRole('button', { name: 'Открыть меню' }).click()
    await page.getByRole('dialog', { name: 'Меню' }).getByRole('link', { name: 'Словарь' }).click()
    await page.waitForURL('**/slovar')
    expect((await page.getByRole('dialog', { name: 'Меню' }).count()) === 0, 'меню не закрылось')
  })
  await context.close()
}

// --- компьютер ---
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
page.on('pageerror', (e) => errors.push(e.message))

await check('вкладки «Об экзамене» переключают содержимое', async () => {
  await page.goto(`${baseUrl}/exam-info`, { waitUntil: 'networkidle' })
  await page.getByRole('tab', { name: /Статистика/ }).click()
  await page.getByText('Примерный проходной балл').waitFor()
  expect(page.url().includes('tab=stats'), 'вкладка не попала в адрес')
})

await check('вкладки «Пробники» переключают раздел', async () => {
  await page.goto(`${baseUrl}/probniki`, { waitUntil: 'networkidle' })
  await page.getByRole('tab', { name: 'Основы экономики' }).click()
  await page.getByRole('heading', { name: 'Глава 1', exact: true }).waitFor()
})

await check('закрытый пробник открывает PRO-модалку, Esc закрывает', async () => {
  const lockedButton = page.getByRole('button', { name: 'Открыть с PRO' }).first()
  await lockedButton.click()
  const dialog = page.getByRole('dialog')
  await dialog.waitFor()
  await dialog.getByText('Полный доступ к PRO').waitFor()
  await page.keyboard.press('Escape')
  await dialog.waitFor({ state: 'detached' })
})

await check('форма входа: переключение на регистрацию и валидация', async () => {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' })
  await page.getByRole('tab', { name: 'Регистрация' }).click()
  await page.getByRole('heading', { name: 'Создай аккаунт' }).waitFor()
  await page.getByRole('button', { name: 'Зарегистрироваться' }).click()
  // браузерная валидация: пустой email не отправляется
  const valid = await page.locator('#login-email').evaluate((el) => el.checkValidity())
  expect(!valid, 'пустой email прошёл проверку')
})

await check('тест: выбор ответа, «Ответить», окно подтверждения при завершении', async () => {
  await page.goto(`${baseUrl}/probniki`, { waitUntil: 'networkidle' })
  await page.getByRole('link', { name: 'Начать тест' }).first().click()
  await page.getByRole('button', { name: /Начать тест/ }).click()
  await page.waitForURL('**/exam')
  await page.locator('input[type="checkbox"]').first().check()
  await page.getByRole('button', { name: 'Ответить' }).click()
  await page.getByText(/из \d+(\.\d+)? баллов/).first().waitFor()
  // последняя кнопка в сетке вопросов -> последний вопрос -> «Завершить»
  await page.locator('aside, div').getByRole('button', { name: /^\d+$/ }).last().click()
  await page.getByRole('button', { name: /Завершить/ }).click()
  const confirm = page.getByRole('alertdialog')
  await confirm.waitFor()
  await confirm.getByRole('button', { name: 'Вернуться к вопросам' }).click()
  await confirm.waitFor({ state: 'detached' })
})

await check('страница 404 для несуществующего адреса', async () => {
  await page.goto(`${baseUrl}/no-such-page`, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Такой страницы нет' }).waitFor()
})

await context.close()
await browser.close()

console.log(results.join('\n'))
console.log(errors.length ? `\nОшибки страницы:\n${errors.join('\n')}` : '\nОшибок JavaScript на страницах нет')
