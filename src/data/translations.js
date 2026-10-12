// Настоящий перевод через MyMemory Translation API — бесплатный, без
// ключей, вызывается прямо из браузера (CORS открыт). У анонимных
// запросов дневной лимит около 5000 слов — для личного использования
// с запасом. Если понадобится больше или стабильнее — можно завести
// бесплатный аккаунт на mymemory.translated.net и передавать email
// параметром `de=` (поднимает лимit), или переехать на другой сервис
// (DeepL, Yandex.Dictionary) — тогда меняется только эта функция.

const MYMEMORY_URL = 'https://api.mymemory.translated.net/get'

// Небольшой оффлайн-кэш для терминов, которые точно встречаются в
// вопросах — отвечает мгновенно, не тратя лимит API.
const glossary = {
  адресант: 'тот, кто отправляет сообщение (в отличие от «адресата» — получателя).',
  адресат: 'тот, кому адресовано сообщение; получатель.',
  пароним: 'слово, похожее по звучанию на другое, но отличающееся по значению.',
  ждала: 'форма глагола «ждать», прош. вр., ж. р.; нормативное ударение — на второй слог.',
}

function cleanKey(phrase) {
  return phrase.trim().toLowerCase().replace(/^[«"'(]+|[»"'.,!?;:)]+$/g, '')
}

// Грубое автоопределение языка — MyMemory требует явную пару языков, не
// умеет "autodetect". Немецкий определяем по умлаутам/ß и частым
// служебным словам (сейчас в тесте почти весь контент на немецком),
// иначе смотрим на кириллицу, дефолт — немецкий.
function detectSourceLang(text) {
  if (/[äöüßÄÖÜ]/.test(text)) return 'de'
  if (/[а-яёА-ЯЁ]/.test(text)) return 'ru'
  if (/\b(und|der|die|das|ist|nicht|mit|für|welche|welcher|Aussage|sind)\b/.test(text)) return 'de'
  return 'de'
}

// Переводим на язык интерфейса (uiLang). Если фрагмент уже на нём — на
// английский (немецкий интерфейс: немецкий текст -> английский).
// Ошибки — ключами словаря (errors.translate*), текст подставляет компонент.
export async function translateText(phrase, uiLang = 'ru') {
  // Глоссарий — русские пояснения, поэтому только для русского интерфейса.
  const cached = uiLang === 'ru' ? glossary[cleanKey(phrase)] : null
  if (cached) return cached

  const source = detectSourceLang(phrase)
  const target = source === uiLang ? 'en' : uiLang

  const url = `${MYMEMORY_URL}?q=${encodeURIComponent(phrase)}&langpair=${source}|${target}`

  let response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('errors.translateNetwork')
  }
  if (!response.ok) {
    throw new Error('errors.translateUnavailable')
  }

  const data = await response.json()
  const translated = data?.responseData?.translatedText
  if (!translated || data?.responseStatus === 403) {
    throw new Error('errors.translateFailed')
  }
  return translated
}
