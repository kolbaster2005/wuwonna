// Тексты для поиска (Google, его нейросеть и другие ИИ-ассистенты): заголовки
// и описания страниц, частые вопросы об экзамене, описание проекта.
//
// Файл — чистый JS без React и без импортов: его читает и сайт (компонент
// RouteSeo, страницы «Об экзамене» и «О проекте»), и скрипт
// scripts/prerender.mjs, который при сборке кладёт эти тексты в готовый HTML
// каждой страницы. Поменял здесь — поменялось и на сайте, и для поисковиков.
//
// Тексты — по языкам: PAGES[lang][ключ маршрута], EXAM_FAQ[lang] и т.д.
// (ключи маршрутов — в src/i18n/routes.js). Нет текста на языке — берётся
// русский (inLang).
//
// Разметка внутри строк: **жирный**, [ссылка] — ссылка на официальную
// страницу WU о поступлении (OFFICIAL_WU_URL).

export const SITE = {
  url: 'https://wuwonna.at',
  name: 'WU WONNA',
  // Как ещё пишут название — чтобы поисковик связал все варианты с проектом.
  alternateNames: ['wuwonna', 'WU Wonna', 'WUWONNA', 'wuwonna.at'],
  youtube: 'https://www.youtube.com/@wuwonna',
  telegram: 'https://t.me/wuwonna',
  logo: '/logo.png',
}

// og:locale по языку страницы.
export const OG_LOCALES = { ru: 'ru_RU', de: 'de_AT', en: 'en_US' }

export const LANGUAGE_NAMES = { ru: 'Русский', de: 'Deutsch', en: 'English' }

// Текст на языке страницы, а если его нет — русский.
export function inLang(byLang, lang) {
  return byLang[lang] ?? byLang.ru
}

// Одно предложение «кто мы» — одинаково везде (сайт, разметка, соцсети),
// чтобы нейросеть однозначно понимала, что такое WU WONNA.
export const SITE_SUMMARY = {
  ru: 'WU WONNA (wuwonna.at) — русскоязычная онлайн-платформа для подготовки к вступительному экзамену в Венский экономический университет WU Wien (WiSo Aufnahmeprüfung): пробники в формате реального экзамена, тесты по каждой главе официальной книги WU и разбор ответов.',
  de: 'WU WONNA (wuwonna.at) ist eine russischsprachige Online-Plattform zur Vorbereitung auf die Aufnahmeprüfung der Wirtschaftsuniversität Wien (WiSo-Aufnahmeverfahren): Probetests im Format der echten Prüfung, Übungstests zu jedem Kapitel des offiziellen WU-Buchs und Erklärungen zu allen Antworten.',
}

// Заголовок (<title>) и описание каждой открытой страницы. Ключевые слова —
// и на языке страницы, и по-немецки: так ищут и те, и другие.
export const PAGES = {
  ru: {
    home: {
      title: 'WU WONNA — подготовка к вступительному экзамену WU Wien (WiSo Aufnahmeprüfung) 2026/27',
      description:
        'Подготовка к вступительному экзамену WU Wien (WiSo Aufnahmeprüfung) онлайн: официальный пробник WU 2026/27 с разбором, тесты по всем главам книги, таймер как на экзамене, прогресс и словарь.',
    },
    tests: {
      title: 'Пробники 2026 к вступительному экзамену WU Wien (WiSo Aufnahmeprüfung) | WU WONNA',
      description:
        'Пробники к вступительному экзамену WU Wien: официальный пробник WiSo 2026/27, пробники Set 1 и Set 2 по экономике и математике, тесты по каждой подглаве книги WU с подробными разборами.',
    },
    examInfo: {
      title: 'Вступительный экзамен WU Wien (WiSo Aufnahmeprüfung): формат, регистрация, проходной балл | WU WONNA',
      description:
        'Всё о вступительном экзамене WU Wien (WiSo Aufnahmeprüfung): три части экзамена, формат Multiple Choice, 2 часа, проходной балл 2026 (≈ 89), регистрация, OSA и сбор 50 €.',
    },
    about: {
      title: 'О проекте WU WONNA — подготовка к поступлению в WU Wien',
      description: SITE_SUMMARY.ru,
    },
    pro: {
      title: 'WU WONNA PRO — все пробники к экзамену WU Wien навсегда',
      description:
        'PRO-доступ WU WONNA: все тесты по главам книги WU и все пробники к WiSo Aufnahmeprüfung с разборами — один раз и навсегда.',
    },
  },
}

// Части экзамена — показываются на «Об экзамене» и попадают в HTML для поиска.
export const EXAM_PARTS = {
  ru: [
    {
      number: '01',
      title: 'Понимание основ экономики',
      description:
        'Все задания этого раздела составляются строго на основе официальной книги по экономике, которую WU рекомендует использовать для подготовки к экзамену. Поэтому знакомство с книгой и подготовку по ней рекомендуется начинать заранее. Книга состоит из четырёх разделов, и в экзамене могут встретиться вопросы по материалу всех четырёх разделов. Заранее определить, какие именно вопросы и темы попадутся на экзамене, невозможно.',
    },
    {
      number: '02',
      title: 'Чтение немецкого текста',
      description:
        'В этой части вам будет предложен текст экономической направленности примерно уровня B2–C1. Ваша задача — внимательно прочитать текст и выполнить предложенные к нему задания.',
    },
    {
      number: '03',
      title: 'Математика',
      description:
        'Математическая часть также проводится в формате Multiple Choice. Вам не требуется записывать решения или расписывать ход вычислений. Для каждого задания уже представлены готовые варианты ответа — необходимо определить, какие из них являются правильными.',
    },
  ],
}

// Шаги поступления на 2026 год — кратко, по официальной странице WU.
// Каждый год меняются: обновить здесь.
export const REGISTRATION_STEPS = {
  ru: [
    {
      title: 'Регистрация онлайн',
      points: [
        'Заполни регистрационную форму на сайте WU.',
        'Подать можно, даже если ещё учишься в последнем классе.',
      ],
    },
    {
      title: 'Онлайн-самооценка (OSA)',
      points: [
        'Ссылка на OSA — в твоей регистрационной форме.',
        'Не оценивается и ни на что не влияет, но пройти её обязательно — полностью и вовремя.',
        'После прохождения в форме должна появиться зелёная галочка.',
        'Технические проблемы — пиши на aufnahmeverfahren@wu.ac.at с темой «OSA» и своим ID OSA.',
      ],
    },
    {
      title: 'Оплата сбора — 50 €',
      points: [
        'Онлайн-банкинг, EPS или карта (Visa, Mastercard, Amex, Diners).',
        'Сбор не возвращается — даже если не поступишь. Поэтому сначала пройди OSA, потом плати.',
        'Оплата засчитана, когда в форме появится зелёная галочка.',
        'Для граждан Украины в 2026 году сбор отменён.',
      ],
    },
    {
      title: 'Вступительный экзамен',
      points: [
        'Очно, в Messe Wien (VIECON). Другой даты нет.',
        'С собой: удостоверение личности с фото (оригинал), распечатанное приглашение, синяя или чёрная ручка, разрешённый калькулятор.',
      ],
    },
    {
      title: 'Результаты',
      points: ['Придут на почту и появятся в регистрационной форме.'],
    },
  ],
}

// Цифры 2026 года (источник — новость WU, ссылка на «Об экзамене»).
export const EXAM_STATS_2026 = {
  passingScore: '≈ 89',
  places: '2 703',
  participants: '6 370',
}

// Частые вопросы. Короткие прямые ответы — именно такие куски текста
// нейросети берут в свои ответы. Показываются на «Об экзамене» и уходят в
// разметку FAQPage.
export const EXAM_FAQ = {
  ru: [
    {
      question: 'Что такое WiSo Aufnahmeprüfung?',
      answer:
        'Это вступительный экзамен Венского экономического университета (WU Wien, Wirtschaftsuniversität Wien) на бакалавриат Wirtschafts- und Sozialwissenschaften (WiSo). Он входит в Aufnahmeverfahren — процедуру поступления, в которой места распределяются по результатам экзамена.',
    },
    {
      question: 'Из каких частей состоит экзамен WU?',
      answer:
        'Из трёх частей: понимание основ экономики (по официальной книге WU), чтение немецкого текста экономической тематики уровня B2–C1 и математика. Все задания — в формате Multiple Choice.',
    },
    {
      question: 'Сколько длится экзамен и как он проходит?',
      answer:
        'Экзамен длится 2 часа без перерыва. Он проводится один раз в год очно, в большом экзаменационном центре; выбрать другую дату нельзя. С собой можно взять калькулятор и письменные принадлежности.',
    },
    {
      question: 'Какой проходной балл на экзамене WU?',
      answer: `В 2026 году проходной балл был примерно ${EXAM_STATS_2026.passingScore}. На ${EXAM_STATS_2026.places} мест претендовали ${EXAM_STATS_2026.participants} участников. Проходной балл каждый год свой — он зависит от числа мест и результатов участников.`,
    },
    {
      question: 'Сколько стоит участие в экзамене WU?',
      answer:
        'В 2026 году сервисный сбор за участие составлял 50 €. Сбор не возвращается, даже если не поступишь. Перед оплатой нужно пройти онлайн-самооценку (OSA).',
    },
    {
      question: 'Как подготовиться к WiSo Aufnahmeprüfung?',
      answer:
        'Вопросы по экономике составляются по официальной книге WU, поэтому начинать стоит с неё — главу за главой. На WU WONNA к каждой подглаве книги есть тест с разбором ответов, а полный пробник в формате экзамена (официальный пробник WU 2026/27, Set 1 и Set 2) помогает проверить себя по времени и по всем частям сразу.',
    },
    {
      question: 'WU WONNA — это официальный сайт WU?',
      answer:
        'Нет. WU WONNA — независимый проект, он не связан с Венским экономическим университетом (WU Wien) и не является его официальным представителем. Официальная информация о поступлении — только на сайте wu.ac.at.',
    },
    {
      question: 'Что такое WU WONNA?',
      answer: `${SITE_SUMMARY.ru} Название — это WU + английское «wanna» («хочу»): «хочу в WU». У проекта есть YouTube-канал и Telegram-канал @wuwonna.`,
    },
  ],
}

// Остальные тексты страницы «Об экзамене» (вкладки, заголовки, абзацы).
export const EXAM_INFO = {
  ru: {
    title: 'Об экзамене',
    subtitle: 'Как устроен вступительный экзамен WU и как на него зарегистрироваться',
    h1: 'Об экзамене WU Wien (WiSo Aufnahmeprüfung)',
    tabs: {
      general: 'Общая информация',
      stats: 'Статистика и проходной балл 2026',
      registration: 'Процесс регистрации',
      materials: 'Полезные материалы',
    },
    summaryHeading: 'Краткая информация',
    facts: [
      'Продолжительность экзамена: **2 часа**',
      'Экзамен WISO состоит из трёх частей: понимание основ экономики, чтение немецкого текста и математика.',
      'Все задания представлены в формате **Multiple Choice** — нужно выбрать правильный вариант или варианты ответа из предложенных.',
    ],
    howItGoesHeading: 'Как проходит экзамен',
    howItGoes: `Экзамен WISO проводится один раз в год в очном формате. Дату проведения самостоятельно выбрать нельзя.

Все участники экзамена собираются в большом экзаменационном центре. Каждый студент работает за отдельной партой.

С собой на экзамен разрешается взять калькулятор и письменные принадлежности. Все необходимые материалы для выполнения заданий выдаются непосредственно на месте проведения экзамена. На случай необходимости на столе также будет предоставлена ручка.

Экзамен длится 2 часа без перерыва.`,
    registrationHeading: 'Регистрация и стоимость',
    registration: [
      'Подробнее о процессе регистрации на экзамен можно узнать на [официальном сайте WU].',
      'На момент 2026 года сервисный сбор за участие в экзамене составляет **50 €**.',
      'Сервисный сбор не возвращается, даже если участник не сдаёт экзамен.',
    ],
    partsHeading: 'Части экзамена',
    faqHeading: 'Частые вопросы',
    statsHeading: 'Статистика и проходной балл 2026 года',
    stats: {
      passingScore: 'Примерный проходной балл',
      places: 'Кол-во мест',
      participants: 'Кол-во сдающих',
    },
    source: 'Источник:',
    materialsHeading: 'Полезные материалы',
    socialHeading: 'Соцсети',
    links: {
      official: 'Официальный сайт WU',
      scoring: 'Презентация о том, как считаются баллы за ответы',
      youtube: 'YouTube-канал WU WONNA',
      telegram: 'Telegram-канал WU WONNA',
    },
    registrationIntro: 'Кратко по шагам на 2026 год. Подробности — на [официальном сайте WU].',
    step: 'Шаг {number}',
  },
}

// Тексты страницы «О проекте».
export const ABOUT = {
  ru: {
    title: 'О проекте',
    subtitle: 'Кто мы и зачем сделали WU WONNA',
    h1: 'О проекте WU WONNA',
    heading: 'Вся подготовка к экзамену WU — в одном месте',
    paragraphs: [
      'WU WONNA (wuwonna.at) — русскоязычная онлайн-платформа для подготовки к вступительному экзамену в Венский экономический университет WU Wien (Wirtschaftsuniversität Wien) — WiSo Aufnahmeprüfung. Мы собрали пробники в формате реального экзамена, тесты по каждой главе официальной книги WU с разбором ответов, перевод и личный словарь, чтобы не искать материалы по разным сайтам и источникам.',
      'Название — это WU и английское «wanna» («хочу»): «хочу в WU». Кроме сайта, мы ведём YouTube-канал и Telegram-канал WU WONNA — рассказываем, как устроен экзамен, как к нему готовиться и как проходит поступление.',
      'Платформа постоянно развивается: мы добавляем новые пробники и материалы, улучшаем инструменты и стараемся сделать подготовку удобной и системной.',
    ],
    // Что есть на платформе — только то, что реально работает на сайте сейчас.
    features: [
      {
        title: 'Пробники',
        description: 'Тесты в формате реального экзамена — с таймером, частичными баллами и разбором каждого ответа.',
      },
      {
        title: 'Перевод и словарь',
        description: 'Выдели незнакомое слово прямо в задании — переведи его и сохрани в личный словарь с примером.',
      },
      {
        title: 'Прогресс по главам',
        description: 'Видно, сколько процентов каждой главы уже освоено и какие подглавы стоит повторить.',
      },
    ],
    socialHeading: 'Мы в соцсетях',
    startTitle: 'С чего начать',
    startText: 'Пройди первый пробник — после него будет видно, какие темы подтянуть.',
    startCta: 'К пробникам',
  },
}

// Понятные адреса пробников: /probniki/wiso-probnik-2026-oficialnyj вместо
// /probniki/5d1b0666-…. Ключ — id пробника в базе. Новый пробник без строки
// здесь просто открывается по id — ничего не ломается; чтобы дать ему
// красивый адрес, добавь строку (латиница, цифры и дефисы). Менять уже
// выданный адрес не стоит: старые ссылки и позиции в поиске пропадут.
export const TEST_SLUGS = {
  '5d1b0666-184a-4bf8-a56e-cf1813273597': 'wiso-probnik-2026-oficialnyj', // Официальный пробник WiSo 2026/2027
  '3fbee26e-b52d-44bc-9fa7-2bd18d0d72a5': 'wiso-probnik-2026-s-razborom', // Пробник 2026 (с разбором)
  '98788230-f0ec-45d3-9904-9a9c5d88d16e': 'wiso-probnik-set-1', // Пробник Set 1
  'fea4f351-cd3a-415e-a2e1-4d9520263ee8': 'wiso-probnik-set-2', // Пробник Set 2
  'fcf1b101-bbd4-41fa-803b-6229a911ff5f': 'kniga-wu-glava-1-1', // Глава 1.1
  '7d2c31fa-27dc-413a-8168-2225bcd452a6': 'kniga-wu-glava-1-2', // Глава 1.2
  '79ca2285-ab2f-4156-8211-fea9ff6fb4cc': 'kniga-wu-glava-1-3', // Глава 1.3
  '8b8f915f-cd1a-4801-aaf0-817ae7ffcc81': 'kniga-wu-glava-1-4', // Глава 1.4
  '603f1b53-621b-4626-98a1-c310f64228c8': 'kniga-wu-glava-1-5', // Глава 1.5
  '1c941b41-fc8b-4bdc-a13e-5c74258049fa': 'kniga-wu-glava-2-1', // Глава 2.1
  'd546a137-311e-4841-9f56-c60e5a1962eb': 'kniga-wu-glava-2-2', // Глава 2.2
  '2f9c1c85-9a75-4e7d-a90d-61c671519914': 'kniga-wu-glava-2-3', // Глава 2.3
  '146b3aa1-451e-4dad-aa84-9c14322d7f57': 'kniga-wu-glava-2-4', // Глава 2.4
  '4677645e-a17a-4dcc-8803-f5db29d671e2': 'kniga-wu-glava-2-5', // Глава 2.5
  'd462202e-60be-40d0-8db8-99c8fc692788': 'kniga-wu-glava-2-6', // Глава 2.6
  'cb0febff-5e6f-495b-a913-8cd96c74163e': 'kniga-wu-glava-3-1', // Глава 3.1
  'b6089fc1-ba66-4dcc-8c0a-ec3a59c640dc': 'kniga-wu-glava-3-2-chast-1', // Глава 3.2 часть 1
  'cd1d8389-1bce-42ce-918a-5182eff2b298': 'kniga-wu-glava-3-2-chast-2', // Глава 3.2 часть 2
  '160cee67-a251-4193-b3d3-8a0d6b5c683c': 'kniga-wu-glava-3-3-chast-1', // Глава 3.3 часть 1
  'da6fc434-0814-44a2-ac11-89d30afbadb0': 'kniga-wu-glava-3-3-chast-2', // Глава 3.3 часть 2
  '7ddccbb2-f73d-4af3-8409-d61154bcb884': 'kniga-wu-glava-3-4-chast-1', // Глава 3.4 часть 1
  'e61245cd-f347-480f-9d19-a0c7509c214c': 'kniga-wu-glava-3-4-chast-2', // Глава 3.4 часть 2
  'b21795e0-e6d5-481c-86f4-98722e86bd77': 'kniga-wu-glava-3-4-chast-3', // Глава 3.4 часть 3
  '283481c6-20a6-451a-9519-087b0adb2d4a': 'kniga-wu-glava-3-5-chast-1', // Глава 3.5 часть 1
  '3baa7d6e-5976-44e7-9b7a-2eb7db021197': 'kniga-wu-glava-3-5-chast-2', // Глава 3.5 часть 2
  '66bb8a9b-e636-470b-9545-95c2e77384cb': 'kniga-wu-glava-3-5-chast-3', // Глава 3.5 часть 3
  'f5902579-85c0-42aa-a671-8517464d7433': 'kniga-wu-glava-3-5-chast-4', // Глава 3.5 часть 4
  '56b604ea-d958-4069-8620-5a2f1366b46c': 'kniga-wu-glava-4-1', // Глава 4.1
  '0174eb7a-52e5-4743-b6e1-cd52314c60be': 'kniga-wu-glava-4-2', // Глава 4.2
  '71012839-ee39-4cf6-9c6a-2d4d246cc612': 'kniga-wu-glava-4-3', // Глава 4.3
  '81c09969-2826-4b8d-80ae-736bb610053a': 'kniga-wu-glava-4-4-1', // Глава 4.4.1
  '7b42a2f9-9335-4818-9ed4-52a090fbf154': 'kniga-wu-glava-4-4-2', // Глава 4.4.2
}

const TEST_ID_BY_SLUG = Object.fromEntries(Object.entries(TEST_SLUGS).map(([id, slug]) => [slug, id]))

// Адрес страницы пробника (по slug, если он есть).
export function testPath(testOrId) {
  const id = typeof testOrId === 'string' ? testOrId : testOrId.id
  return `/probniki/${TEST_SLUGS[id] ?? id}`
}

// Из адреса /probniki/:testId — id пробника в базе (там может быть и slug,
// и старый id).
export function testIdFromParam(param) {
  return TEST_ID_BY_SLUG[param] ?? param
}

// Свои заголовок и описание для поиска — для главных пробников. Остальные
// собираются автоматически в testSeo.
const TEST_SEO_OVERRIDES = {
  '5d1b0666-184a-4bf8-a56e-cf1813273597': {
    title: 'Официальный пробник WU WiSo 2026/27 онлайн — вступительный экзамен (Aufnahmeprüfung) | WU WONNA',
    description:
      'Официальный пробник вступительного экзамена WU Wien (WiSo Aufnahmeprüfung) 2026/27 онлайн: 26 заданий, 120 минут, таймер как на экзамене и разбор каждого ответа. Бесплатно.',
  },
  '3fbee26e-b52d-44bc-9fa7-2bd18d0d72a5': {
    title: 'Пробник WU 2026 с разбором ответов — экономика и математика (WiSo Aufnahmeprüfung) | WU WONNA',
    description:
      'Пробник к вступительному экзамену WU Wien 2026/27 с подробным разбором каждого варианта: основы экономики по книге WU и математика. Онлайн, с таймером, бесплатно.',
  },
  '98788230-f0ec-45d3-9904-9a9c5d88d16e': {
    title: 'Пробник WiSo Set 1 — тренировочный вариант экзамена WU Wien | WU WONNA',
  },
  'fea4f351-cd3a-415e-a2e1-4d9520263ee8': {
    title: 'Пробник WiSo Set 2 — сложный вариант экзамена WU Wien | WU WONNA',
  },
}

// Заголовок и описание страницы одного пробника.
export function testSeo(test) {
  const kind = test.section ? `тест по книге WU, ${test.section}` : 'пробник к экзамену WU Wien'
  const description = (test.description || test.long_description || SITE_SUMMARY.ru).replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
  return {
    title: `${test.title} — ${kind} (WiSo Aufnahmeprüfung) | WU WONNA`,
    description: description.length > 200 ? `${description.slice(0, 197).trimEnd()}…` : description,
    ...TEST_SEO_OVERRIDES[test.id],
    path: testPath(test),
  }
}

// Отказ от связи с WU — в футере сайта, в готовом HTML и на языковых
// страницах. Нужен и юридически (не выдаём себя за университет), и для
// поисковиков: так нейросеть не путает проект с официальным сайтом WU.
export const DISCLAIMER = {
  ru: 'WU WONNA — независимый проект. Мы не связаны с Венским экономическим университетом (WU Wien, Wirtschaftsuniversität Wien) и не являемся его официальным представителем. Официальная информация о поступлении — только на сайте wu.ac.at.',
  de: 'WU WONNA ist ein unabhängiges, inoffizielles Projekt und steht in keiner Verbindung zur Wirtschaftsuniversität Wien (WU Wien). Offizielle Informationen zum Aufnahmeverfahren gibt es ausschließlich auf wu.ac.at.',
  en: 'WU WONNA is an independent, unofficial project and is not affiliated with, endorsed by or connected to the Vienna University of Economics and Business (WU Wien). Official admission information is available only at wu.ac.at.',
}

export const OFFICIAL_WU_URL =
  'https://www.wu.ac.at/studium/bachelor/wirtschafts-und-sozialwissenschaften/ueberblick/aufnahmeverfahren'

// Бесплатный пробник, на который ведут кнопки посадочных страниц.
export const FREE_PROBNIK_PATH = '/probniki/wiso-probnik-2026-oficialnyj'

// Посадочные страницы под поисковые запросы на трёх языках — одна и та же
// тема («как поступить в WU и сдать WiSo Aufnahmeprüfung»), поэтому они
// связаны между собой через hreflang: Google сам покажет человеку версию на
// его языке. Добавляя язык — добавить страницу сюда и в LANDING_ALTERNATES.
//
// Раздел страницы: { heading, text?, items?, ordered? } — абзац и/или список.
export const LANDINGS = {
  '/postuplenie-v-wu': {
    lang: 'ru',
    locale: 'ru_RU',
    title: 'Как поступить в WU Wien (ВУ) на WiSo: вступительный экзамен 2026/27 пошагово | WU WONNA',
    description:
      'Поступление в WU Wien на бакалавриат WiSo: регистрация, OSA, сбор 50 €, вступительный экзамен (Aufnahmeprüfung) — 3 части, 2 часа, проходной балл 2026 ≈ 89. Бесплатный пробник онлайн.',
    h1: 'Как поступить в WU Wien на WiSo — вступительный экзамен 2026/27 пошагово',
    lead: 'Венский экономический университет (WU Wien, по-русски часто пишут просто «ВУ») принимает на бакалавриат Wirtschafts- und Sozialwissenschaften (WiSo, «ВиСо», «визо») через вступительный экзамен — Aufnahmeprüfung. Ниже — весь путь поступления коротко, а в конце — бесплатный пробник в формате реального экзамена.',
    sections: [
      {
        heading: 'Нужен ли экзамен для поступления в WU?',
        text: 'Да, на бакалавриат WiSo — нужен. Желающих больше, чем мест, поэтому WU проводит Aufnahmeverfahren: места распределяются по результатам вступительного экзамена (WiSo Aufnahmeprüfung). В 2026 году на 2 703 места претендовали 6 370 человек, а проходной балл был примерно 89.',
      },
      {
        heading: 'Поступление в WU: шаги',
        ordered: true,
        items: [
          'Онлайн-регистрация на сайте WU — подать можно, даже если ещё учишься в последнем классе.',
          'Онлайн-самооценка (OSA) — не оценивается, но пройти её нужно полностью и вовремя.',
          'Оплата сервисного сбора — 50 € (2026). Сбор не возвращается, поэтому сначала OSA, потом оплата.',
          'Вступительный экзамен — один раз в год, очно, в Messe Wien. Другой даты нет.',
          'Результаты — приходят на почту и появляются в регистрационной форме.',
        ],
      },
      {
        heading: 'Как устроен вступительный экзамен WiSo',
        items: [
          'Длительность — 2 часа без перерыва, все задания в формате Multiple Choice.',
          'Часть 1 — основы экономики: вопросы строго по официальной книге WU «Wirtschaft verstehen».',
          'Часть 2 — чтение немецкого текста экономической тематики (примерно B2–C1).',
          'Часть 3 — математика: готовые варианты ответа, решение расписывать не нужно.',
        ],
      },
      {
        heading: 'Как подготовиться к Aufnahmeprüfung',
        items: [
          'Читать книгу WU по главам и сразу проверять себя тестом по каждой подглаве.',
          'Решать пробники 2026 в формате реального экзамена — с таймером и частичными баллами.',
          'Разбирать ошибки: на WU WONNA к каждому вопросу есть объяснение.',
          'Выписывать незнакомые немецкие термины в личный словарь.',
        ],
      },
    ],
    faq: [
      {
        question: 'На каком языке вступительный экзамен в WU?',
        answer: 'На немецком. Все три части — экономика, текст и математика — проводятся на немецком языке.',
      },
      {
        question: 'Можно ли сдать экзамен WU в другую дату?',
        answer: 'Нет. Вступительный экзамен на WiSo проводится один раз в год очно, другой даты нет.',
      },
      {
        question: 'Где взять пробник к экзамену WU 2026?',
        answer:
          'На WU WONNA есть бесплатный пробник 2026 с разбором каждого ответа, а также пробники Set 1 и Set 2 и тесты по всем главам книги WU.',
      },
    ],
    cta: 'Пройти бесплатный пробник',
    more: 'Подробнее об экзамене',
    faqHeading: 'Частые вопросы',
    officialLink: 'Официальная страница WU о поступлении',
  },

  '/de': {
    lang: 'de',
    locale: 'de_AT',
    title: 'WiSo Aufnahmeprüfung WU Wien 2026/27 – Vorbereitung, Probetest & Ablauf | WU WONNA',
    description:
      'Vorbereitung auf die WiSo-Aufnahmeprüfung der WU Wien: Ablauf, drei Prüfungsteile, Anmeldung, OSA, Kosten und Cut-off 2026 – plus kostenloser Probetest online mit Lösungen.',
    h1: 'WiSo Aufnahmeprüfung an der WU Wien – Vorbereitung und kostenloser Probetest',
    lead: 'Alles Wichtige zum Aufnahmeverfahren für das Bachelorstudium Wirtschafts- und Sozialwissenschaften (WiSo) an der Wirtschaftsuniversität Wien – kurz und übersichtlich. Auf WU WONNA kannst du dich mit Probetests im Prüfungsformat und Übungstests zu jedem Kapitel des WU-Skripts vorbereiten. Hinweis: Die Website ist derzeit überwiegend auf Russisch.',
    sections: [
      {
        heading: 'Was ist die WiSo-Aufnahmeprüfung?',
        text: 'Die Aufnahmeprüfung ist Teil des Aufnahmeverfahrens für den Bachelor WiSo an der WU Wien. Weil es mehr Bewerber:innen als Studienplätze gibt, werden die Plätze nach dem Prüfungsergebnis vergeben. 2026 haben sich rund 6 370 Personen um 2 703 Plätze beworben; die Mindestpunktzahl lag bei ca. 89.',
      },
      {
        heading: 'Ablauf und Format',
        items: [
          'Dauer: 2 Stunden ohne Pause.',
          'Alle Aufgaben im Multiple-Choice-Format.',
          'Einmal pro Jahr vor Ort in der Messe Wien – es gibt keinen Ersatztermin.',
          'Mitnehmen: amtlicher Lichtbildausweis, ausgedruckte Einladung, Kugelschreiber, zugelassener Taschenrechner.',
        ],
      },
      {
        heading: 'Die drei Prüfungsteile',
        items: [
          'Wirtschaftliche Grundlagen – die Fragen basieren auf dem offiziellen WU-Skript „Wirtschaft verstehen“.',
          'Textverständnis – ein deutschsprachiger Wirtschaftstext (ca. Niveau B2–C1) mit Fragen dazu.',
          'Mathematik – Multiple Choice mit vorgegebenen Antworten, kein Rechenweg nötig.',
        ],
      },
      {
        heading: 'Anmeldung Schritt für Schritt',
        ordered: true,
        items: [
          'Online-Registrierung auf der Website der WU.',
          'Online-Self-Assessment (OSA) vollständig und fristgerecht absolvieren.',
          'Servicebeitrag bezahlen – 2026 waren es 50 €, keine Rückerstattung.',
          'Aufnahmeprüfung vor Ort.',
          'Ergebnis per E-Mail und im Registrierungsformular.',
        ],
      },
      {
        heading: 'Vorbereitung mit WU WONNA',
        items: [
          'Probetests 2026 im Format der echten Prüfung – mit Timer und Teilpunkten.',
          'Übungstests zu jedem Unterkapitel des WU-Skripts.',
          'Erklärungen zu jeder Antwort.',
          'Fortschritt pro Kapitel und persönliches Vokabelheft.',
        ],
      },
    ],
    faq: [
      {
        question: 'In welcher Sprache findet die WU-Aufnahmeprüfung statt?',
        answer: 'Auf Deutsch – alle drei Teile: Wirtschaft, Textverständnis und Mathematik.',
      },
      {
        question: 'Gibt es einen kostenlosen Probetest für die WiSo-Aufnahmeprüfung?',
        answer:
          'Ja. Auf WU WONNA gibt es einen kostenlosen Probetest 2026 mit Lösungen und Erklärungen sowie weitere Probetests und Kapiteltests.',
      },
    ],
    cta: 'Kostenlosen Probetest starten',
    more: 'Mehr zur Prüfung (Russisch)',
    faqHeading: 'Häufige Fragen',
    officialLink: 'Offizielle WU-Seite zum Aufnahmeverfahren',
  },

  '/en': {
    lang: 'en',
    locale: 'en_US',
    title: 'WU Vienna WiSo Entrance Exam 2026/27 – How to Prepare & Free Practice Test | WU WONNA',
    description:
      'How to get into WU Vienna (WiSo bachelor): admission steps, OSA, €50 fee, the three parts of the Aufnahmeprüfung, 2026 cut-off (≈ 89) – and a free online practice test with explanations.',
    h1: 'WU Vienna WiSo entrance exam (Aufnahmeprüfung) – how to prepare, plus a free practice test',
    lead: 'A short guide to the admission procedure for the Business, Economics and Social Sciences bachelor (WiSo) at the Vienna University of Economics and Business (WU Wien). On WU WONNA you can practise with mock exams in the real format and tests for every chapter of the official WU study script. Note: the site is currently mostly in Russian, and the exam itself is in German.',
    sections: [
      {
        heading: 'What is the WiSo entrance exam?',
        text: 'The Aufnahmeprüfung is part of WU’s admission procedure (Aufnahmeverfahren) for the WiSo bachelor. There are more applicants than places, so places are awarded based on exam results. In 2026, about 6,370 people applied for 2,703 places, and the cut-off was around 89 points.',
      },
      {
        heading: 'Format',
        items: [
          'Duration: 2 hours, no break.',
          'All questions are multiple choice.',
          'Held once a year, in person, at Messe Wien – there is no alternative date.',
          'The exam is in German.',
        ],
      },
      {
        heading: 'The three parts',
        items: [
          'Economics basics – questions are based on WU’s official study script “Wirtschaft verstehen”.',
          'German reading comprehension – an economics text at roughly B2–C1 level.',
          'Mathematics – multiple choice, no written working required.',
        ],
      },
      {
        heading: 'How to apply, step by step',
        ordered: true,
        items: [
          'Register online on the WU website.',
          'Complete the Online Self-Assessment (OSA) fully and on time.',
          'Pay the service fee – €50 in 2026, non-refundable.',
          'Sit the entrance exam in person.',
          'Get your result by email and in the registration form.',
        ],
      },
      {
        heading: 'Preparing with WU WONNA',
        items: [
          '2026 mock exams in the real exam format – with a timer and partial credit.',
          'Practice tests for every sub-chapter of the WU study script.',
          'An explanation for every answer.',
          'Progress per chapter and a personal vocabulary list.',
        ],
      },
    ],
    faq: [
      {
        question: 'Is the WU Vienna entrance exam in English?',
        answer: 'No. The WiSo entrance exam is held in German, including the economics and maths parts.',
      },
      {
        question: 'Is there a free practice test for the WU WiSo entrance exam?',
        answer: 'Yes. WU WONNA offers a free 2026 practice test with explanations, plus further mock exams and chapter tests.',
      },
    ],
    cta: 'Start the free practice test',
    more: 'More about the exam (Russian)',
    faqHeading: 'FAQ',
    officialLink: 'Official WU admission page',
  },
}

// Одна тема на трёх языках — для <link rel="alternate" hreflang> и sitemap.
// x-default — для всех остальных языков: английская версия.
export const LANDING_ALTERNATES = [
  { lang: 'ru', path: '/postuplenie-v-wu' },
  { lang: 'de', path: '/de' },
  { lang: 'en', path: '/en' },
  { lang: 'x-default', path: '/en' },
]
