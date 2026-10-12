// Перевод строк интерфейса без React — его используют и хуки из index.jsx, и
// scripts/prerender.mjs (готовый HTML должен совпадать с тем, что видит
// человек).
//
// Строка словаря:
//   'Пройти ещё раз'                 — как есть;
//   '{score} из {max} баллов'        — с подстановками: t(key, { score, max });
//   { one, few, many, other }        — множественное число по params.count
//                                       (Intl.PluralRules; для DE/EN хватает one/other).
// Жирный внутри строки — **...**, его рисует InlineMarkdown.

import ru from './ru.js'
import de from './de.js'
import en from './en.js'
import { DEFAULT_LANG } from './routes.js'

export const DICTIONARIES = { ru, de, en }

// Локали для дат и чисел.
export const LOCALES = { ru: 'ru-RU', de: 'de-AT', en: 'en-GB' }

const PLURAL_FORMS = ['zero', 'one', 'two', 'few', 'many', 'other']

// Объект словаря — это набор форм множественного числа, а не раздел.
export function isPluralEntry(value) {
  return (
    value != null &&
    typeof value === 'object' &&
    'other' in value &&
    Object.keys(value).every((form) => PLURAL_FORMS.includes(form))
  )
}

function lookup(dictionary, key) {
  let value = dictionary
  for (const part of key.split('.')) {
    if (value == null || typeof value !== 'object') return undefined
    value = value[part]
  }
  return typeof value === 'string' || isPluralEntry(value) ? value : undefined
}

export function hasKey(key, lang = DEFAULT_LANG) {
  return typeof key === 'string' && lookup(DICTIONARIES[lang] ?? {}, key) !== undefined
}

const pluralRules = {}

function pick(entry, lang, count) {
  if (typeof entry === 'string') return entry
  const rules = (pluralRules[lang] ??= new Intl.PluralRules(LOCALES[lang] ?? lang))
  return entry[rules.select(Number(count ?? 0))] ?? entry.other
}

function interpolate(text, params) {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (match, name) => (params[name] == null ? match : String(params[name])))
}

// Нет ключа в DE/EN — берём русскую строку (и предупреждаем в dev), нет и
// её — возвращаем сам ключ, чтобы пропуск был виден на странице.
export function translate(lang, key, params) {
  let entry = lookup(DICTIONARIES[lang] ?? {}, key)
  let entryLang = lang
  if (entry === undefined && lang !== DEFAULT_LANG) {
    entry = lookup(DICTIONARIES[DEFAULT_LANG], key)
    entryLang = DEFAULT_LANG
    if (entry !== undefined && import.meta.env?.DEV) console.warn(`i18n: нет ключа «${key}» в ${lang}.js`)
  }
  if (entry === undefined) {
    if (import.meta.env?.DEV) console.warn(`i18n: нет ключа «${key}»`)
    return key
  }
  return interpolate(pick(entry, entryLang, params?.count), params)
}

// Текст ошибки: модули из lib/ бросают Error с ключом словаря
// (new Error('errors.notAllowed')), а сообщения Supabase и сети — как есть.
export function translateError(lang, error) {
  const message = error?.message ?? String(error ?? '')
  return hasKey(message) ? translate(lang, message) : message
}

export function formatDate(value, options, lang = DEFAULT_LANG) {
  return new Intl.DateTimeFormat(LOCALES[lang], options).format(new Date(value))
}

export function formatNumber(value, options, lang = DEFAULT_LANG) {
  return new Intl.NumberFormat(LOCALES[lang], options).format(value)
}
