import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DICTIONARIES, isPluralEntry, translate } from './translate.js'
import { ENABLED_LANGS, LANGS, localPath, langFromPath, matchRoute } from './routes.js'

// Словари: в de.js и en.js — все ключи из ru.js с теми же подстановками
// {…}. Проверяются языки, у которых включены адреса (ENABLED_LANGS): пока
// перевод не готов, его словарь может быть неполным.

// { 'header.nav.home': 'Главная', … } — формы множественного числа считаются
// одной строкой.
function flatten(dictionary, prefix = '') {
  return Object.entries(dictionary).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string' || isPluralEntry(value)) return [[path, value]]
    return flatten(value, path)
  })
}

function placeholders(entry) {
  const texts = typeof entry === 'string' ? [entry] : Object.values(entry)
  return [...new Set(texts.flatMap((text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1])))].sort()
}

const ru = new Map(flatten(DICTIONARIES.ru))

test('ru.js: только строки и формы множественного числа с формой other', () => {
  const check = (dictionary, prefix) => {
    for (const [key, value] of Object.entries(dictionary)) {
      const path = `${prefix}${key}`
      if (typeof value === 'string' || isPluralEntry(value)) continue
      assert.ok(value && typeof value === 'object', `${path}: неожиданное значение`)
      assert.ok(!('one' in value) || isPluralEntry(value), `${path}: формы множественного числа без other`)
      check(value, `${path}.`)
    }
  }
  check(DICTIONARIES.ru, '')
})

for (const lang of ENABLED_LANGS.filter((l) => l !== 'ru')) {
  const dictionary = new Map(flatten(DICTIONARIES[lang]))

  test(`${lang}.js: есть все ключи из ru.js`, () => {
    const missing = [...ru.keys()].filter((key) => !dictionary.has(key))
    assert.deepEqual(missing, [], `в ${lang}.js нет ключей`)
  })

  test(`${lang}.js: нет лишних ключей`, () => {
    const extra = [...dictionary.keys()].filter((key) => !ru.has(key))
    assert.deepEqual(extra, [], `в ${lang}.js ключи, которых нет в ru.js`)
  })

  test(`${lang}.js: те же подстановки {…}, что в ru.js`, () => {
    // {count} в формах множественного числа может не входить в текст
    // (например, 'слово' без числа) — его не сравниваем.
    const differ = [...dictionary]
      .filter(([key]) => ru.has(key))
      .filter(([key, value]) => {
        const own = placeholders(value).filter((p) => p !== 'count')
        const base = placeholders(ru.get(key)).filter((p) => p !== 'count')
        return own.join() !== base.join()
      })
      .map(([key]) => key)
    assert.deepEqual(differ, [], `подстановки не совпадают`)
  })
}

test('translate: подстановки и множественное число', () => {
  assert.equal(translate('ru', 'result.score', { score: 18, max: 26 }), '18 из 26 баллов')
  assert.equal(translate('ru', 'dashboard.words', { count: 1 }), '1 слово')
  assert.equal(translate('ru', 'dashboard.words', { count: 3 }), '3 слова')
  assert.equal(translate('ru', 'dashboard.words', { count: 11 }), '11 слов')
  assert.equal(translate('ru', 'dashboard.words', { count: 21 }), '21 слово')
  assert.equal(translate('ru', 'нет.такого.ключа'), 'нет.такого.ключа')
})

test('routes: адреса на каждом языке и обратно', () => {
  assert.equal(localPath('test', { slug: 'wiso-set-1' }), '/probniki/wiso-set-1')
  assert.equal(localPath('test', { slug: 'set-1' }, 'de'), '/de/probetests/set-1')
  assert.equal(localPath('tests', { tab: 'probniki' }), '/probniki?tab=probniki')
  assert.equal(localPath('tests', { tab: undefined }), '/probniki')
  for (const lang of ENABLED_LANGS) {
    assert.deepEqual(matchRoute(localPath('testExam', { slug: 'abc' }, lang)), {
      key: 'testExam',
      lang,
      params: { slug: 'abc' },
    })
    assert.equal(langFromPath(localPath('home', {}, lang)), lang)
  }
  assert.equal(langFromPath('/probniki'), 'ru')
  assert.ok(LANGS.includes('de') && LANGS.includes('en'))
})
