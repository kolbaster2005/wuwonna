// Тексты для поиска (Google, его нейросеть и другие ИИ-ассистенты): заголовки
// и описания страниц, частые вопросы об экзамене, описание проекта.
//
// Файл — чистый JS без React (импорт только из такого же чистого
// src/i18n/routes.js): его читает и сайт (компонент
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

import { localPath } from '../i18n/routes.js'

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
  de: 'WU WONNA (wuwonna.at) ist eine Online-Plattform (auf Deutsch, Englisch und Russisch) zur Vorbereitung auf die Aufnahmeprüfung der Wirtschaftsuniversität Wien (WiSo-Aufnahmeverfahren): Probetests im Format der echten Prüfung, Übungstests zu jedem Kapitel des offiziellen WU-Buchs und Erklärungen zu allen Antworten.',
  en: 'WU WONNA (wuwonna.at) is an online platform (in English, German and Russian) to prepare for the entrance exam of the Vienna University of Economics and Business (WU Wien, WiSo Aufnahmeprüfung): mock exams in the real exam format, practice tests for every chapter of the official WU study script, and explanations for every answer.',
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
    admissionGuide: {
      title: 'Как поступить в WU Wien (ВУ) на WiSo: вступительный экзамен 2026/27 пошагово | WU WONNA',
      description:
        'Поступление в WU Wien на бакалавриат WiSo: регистрация, OSA, сбор 50 €, вступительный экзамен (Aufnahmeprüfung) — 3 части, 2 часа, проходной балл 2026 ≈ 89. Бесплатный пробник онлайн.',
    },
    pro: {
      title: 'WU WONNA PRO — все пробники к экзамену WU Wien навсегда',
      description:
        'PRO-доступ WU WONNA: все тесты по главам книги WU и все пробники к WiSo Aufnahmeprüfung с разборами — один раз и навсегда.',
    },
  },
  de: {
    home: {
      title: 'WU WONNA – Vorbereitung auf die Aufnahmeprüfung der WU Wien (WiSo) 2026/27',
      description:
        'Online-Vorbereitung auf die Aufnahmeprüfung der WU Wien (WiSo-Aufnahmeverfahren): offizieller Probetest 2026/27 mit Lösungen, Übungstests zu allen Kapiteln, Timer wie in der Prüfung, Fortschritt und Vokabelheft.',
    },
    tests: {
      title: 'Probetests 2026 für die Aufnahmeprüfung der WU Wien (WiSo) | WU WONNA',
      description:
        'Probetests und Übungstests für die WiSo-Aufnahmeprüfung der WU Wien: offizieller Probetest 2026/27, Probeprüfungen Set 1 und Set 2 sowie Übungstests zu jedem Kapitel des WU-Skripts – mit Erklärungen.',
    },
    examInfo: {
      title: 'Aufnahmeprüfung WU Wien (WiSo): Ablauf, Anmeldung, Mindestpunktzahl | WU WONNA',
      description:
        'Alles zur WiSo-Aufnahmeprüfung der WU Wien: drei Prüfungsteile, Multiple Choice, 2 Stunden, Mindestpunktzahl 2026 (ca. 89), Anmeldung, OSA und Servicebeitrag 50 €.',
    },
    admissionGuide: {
      title: 'WiSo Aufnahmeprüfung WU Wien 2026/27 – Vorbereitung, Probetest & Ablauf | WU WONNA',
      description:
        'Vorbereitung auf die WiSo-Aufnahmeprüfung der WU Wien: Ablauf, drei Prüfungsteile, Anmeldung, OSA, Kosten und Cut-off 2026 – plus kostenloser Probetest online mit Lösungen.',
    },
    about: {
      title: 'Über WU WONNA – Vorbereitung auf das Studium an der WU Wien',
      description:
        'WU WONNA ist eine Online-Plattform zur Vorbereitung auf die Aufnahmeprüfung der WU Wien: Probetests im Prüfungsformat, Übungstests zu jedem Kapitel des WU-Skripts und Erklärungen zu allen Antworten.',
    },
    pro: {
      title: 'WU WONNA PRO – alle Probetests für die WU-Aufnahmeprüfung für immer',
      description:
        'PRO-Zugang bei WU WONNA: alle Übungstests zu den Kapiteln des WU-Skripts und alle Probetests für die WiSo-Aufnahmeprüfung mit Erklärungen – einmal zahlen, für immer nutzen.',
    },
  },
  en: {
    home: {
      title: 'WU WONNA – WU Vienna Entrance Exam Preparation (WiSo Admission Test) 2026/27',
      description:
        'Prepare online for the WU Vienna entrance exam (WiSo admission test): the official 2026/27 practice test with explanations, tests for every chapter, an exam-style timer, progress tracking and vocabulary.',
    },
    tests: {
      title: 'WU Vienna Practice Tests 2026 – WiSo Admission Test Mock Exams | WU WONNA',
      description:
        'Practice tests for the WU Vienna WiSo entrance exam: the official 2026/27 practice test, mock exams Set 1 and Set 2, and a test for every chapter of the WU study script – with explanations.',
    },
    examInfo: {
      title: 'WU Vienna Entrance Exam (WiSo): Format, Registration, Cut-off Score | WU WONNA',
      description:
        'Everything about the WU Vienna WiSo entrance exam: three parts, multiple choice, 2 hours, 2026 cut-off (≈ 89), registration, OSA and the €50 fee.',
    },
    admissionGuide: {
      title: 'How to Get into WU Vienna (WiSo): Entrance Exam 2026/27 & Free Practice Test | WU WONNA',
      description:
        'How to get into WU Vienna (WiSo bachelor): admission steps, OSA, €50 fee, the three parts of the entrance exam, 2026 cut-off (≈ 89) – and a free online practice test with explanations.',
    },
    about: {
      title: 'About WU WONNA – WU Vienna Entrance Exam Preparation',
      description:
        'WU WONNA is an online platform to prepare for the WU Vienna entrance exam: mock exams in the real format, tests for every chapter of the WU study script, and explanations for every answer.',
    },
    pro: {
      title: 'WU WONNA PRO – All WU Vienna Practice Tests for Life',
      description:
        'WU WONNA PRO: every chapter test and every mock exam for the WU Vienna WiSo admission test, with explanations – pay once, use for life.',
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
  de: [
    {
      number: '01',
      title: 'Wirtschaftliche Grundlagen',
      description:
        'Alle Aufgaben dieses Teils basieren auf dem offiziellen Wirtschaftsskript, das die WU zur Vorbereitung empfiehlt. Fang deshalb früh an, mit dem Buch zu arbeiten. Es hat vier Teile, und Fragen können zum Stoff aller vier Teile kommen. Welche Themen in der Prüfung drankommen, lässt sich nicht vorhersagen.',
    },
    {
      number: '02',
      title: 'Textverständnis (Deutsch)',
      description:
        'In diesem Teil bekommst du einen Wirtschaftstext auf etwa Niveau B2–C1. Deine Aufgabe: den Text aufmerksam lesen und die Fragen dazu beantworten.',
    },
    {
      number: '03',
      title: 'Mathematik',
      description:
        'Auch der Mathematikteil ist Multiple Choice. Du musst keinen Rechenweg aufschreiben: Zu jeder Aufgabe gibt es vorgegebene Antworten, und du bestimmst, welche davon richtig sind.',
    },
  ],
  en: [
    {
      number: '01',
      title: 'Economics basics',
      description:
        'All questions in this part are based strictly on the official economics book that WU recommends for preparation, so start working with it early. The book has four parts, and questions can come from any of them. There is no way to predict which topics will come up in the exam.',
    },
    {
      number: '02',
      title: 'German reading comprehension',
      description:
        'In this part you get an economics text at roughly B2–C1 level. Your task is to read it carefully and answer the questions about it.',
    },
    {
      number: '03',
      title: 'Mathematics',
      description:
        'The maths part is multiple choice too. You don’t write down any working: each question comes with answer options, and you decide which of them are correct.',
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
  de: [
    {
      title: 'Online-Registrierung',
      points: [
        'Fülle das Registrierungsformular auf der Website der WU aus.',
        'Das geht auch, wenn du noch in der Maturaklasse bist.',
      ],
    },
    {
      title: 'Online-Self-Assessment (OSA)',
      points: [
        'Den Link zum OSA findest du in deinem Registrierungsformular.',
        'Es wird nicht bewertet und hat keinen Einfluss – du musst es aber vollständig und rechtzeitig absolvieren.',
        'Danach erscheint im Formular ein grüner Haken.',
        'Bei technischen Problemen: Mail an aufnahmeverfahren@wu.ac.at mit dem Betreff „OSA“ und deiner OSA-ID.',
      ],
    },
    {
      title: 'Servicebeitrag – 50 €',
      points: [
        'Onlinebanking, EPS oder Karte (Visa, Mastercard, Amex, Diners).',
        'Keine Rückerstattung – auch wenn du nicht aufgenommen wirst. Deshalb zuerst das OSA, dann zahlen.',
        'Die Zahlung ist erfasst, wenn im Formular ein grüner Haken erscheint.',
        'Für ukrainische Staatsbürger:innen entfällt der Beitrag 2026.',
      ],
    },
    {
      title: 'Aufnahmeprüfung',
      points: [
        'Vor Ort in der Messe Wien (VIECON). Einen Ersatztermin gibt es nicht.',
        'Mitbringen: amtlicher Lichtbildausweis (Original), ausgedruckte Einladung, blauer oder schwarzer Kugelschreiber, zugelassener Taschenrechner.',
      ],
    },
    {
      title: 'Ergebnis',
      points: ['Kommt per E-Mail und erscheint im Registrierungsformular.'],
    },
  ],
  en: [
    {
      title: 'Register online',
      points: [
        'Fill in the registration form on the WU website.',
        'You can apply even while you’re still in your final school year.',
      ],
    },
    {
      title: 'Online Self-Assessment (OSA)',
      points: [
        'The OSA link is in your registration form.',
        'It isn’t graded and doesn’t affect anything – but you must complete it fully and on time.',
        'Once done, a green tick appears in the form.',
        'Technical problems: email aufnahmeverfahren@wu.ac.at with the subject “OSA” and your OSA ID.',
      ],
    },
    {
      title: 'Pay the fee – €50',
      points: [
        'Online banking, EPS or card (Visa, Mastercard, Amex, Diners).',
        'The fee isn’t refunded – even if you’re not admitted. So do the OSA first, then pay.',
        'Payment is confirmed when a green tick appears in the form.',
        'In 2026 the fee was waived for Ukrainian citizens.',
      ],
    },
    {
      title: 'Entrance exam',
      points: [
        'In person at Messe Wien (VIECON). There is no alternative date.',
        'Bring: official photo ID (original), the printed invitation, a blue or black pen and an approved calculator.',
      ],
    },
    {
      title: 'Results',
      points: ['Sent by email and shown in your registration form.'],
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
  de: [
    {
      question: 'Was ist die WiSo-Aufnahmeprüfung?',
      answer:
        'Die Aufnahmeprüfung der Wirtschaftsuniversität Wien (WU Wien) für das Bachelorstudium Wirtschafts- und Sozialwissenschaften (WiSo). Sie ist Teil des Aufnahmeverfahrens, in dem die Studienplätze nach dem Prüfungsergebnis vergeben werden.',
    },
    {
      question: 'Aus welchen Teilen besteht die WU-Aufnahmeprüfung?',
      answer:
        'Aus drei Teilen: wirtschaftliche Grundlagen (nach dem offiziellen WU-Skript), Textverständnis mit einem deutschsprachigen Wirtschaftstext auf Niveau B2–C1 und Mathematik. Alle Aufgaben sind Multiple Choice.',
    },
    {
      question: 'Wie lange dauert die Prüfung und wie läuft sie ab?',
      answer:
        'Die Prüfung dauert 2 Stunden ohne Pause. Sie findet einmal im Jahr vor Ort in einem großen Prüfungszentrum statt; einen anderen Termin gibt es nicht. Taschenrechner und Schreibzeug darfst du mitnehmen.',
    },
    {
      question: 'Wie hoch ist die Mindestpunktzahl bei der WU-Aufnahmeprüfung?',
      answer: `2026 lag die Mindestpunktzahl bei etwa ${EXAM_STATS_2026.passingScore.replace('≈ ', '')}. Um ${EXAM_STATS_2026.places} Plätze bewarben sich ${EXAM_STATS_2026.participants} Personen. Die Grenze ändert sich jedes Jahr – sie hängt von der Zahl der Plätze und den Ergebnissen ab.`,
    },
    {
      question: 'Was kostet die Teilnahme an der WU-Aufnahmeprüfung?',
      answer:
        '2026 betrug der Servicebeitrag 50 €. Er wird nicht zurückerstattet, auch wenn du nicht aufgenommen wirst. Vor der Zahlung musst du das Online-Self-Assessment (OSA) absolvieren.',
    },
    {
      question: 'Wie bereite ich mich auf die WiSo-Aufnahmeprüfung vor?',
      answer:
        'Die Wirtschaftsfragen basieren auf dem offiziellen WU-Skript – fang also damit an, Kapitel für Kapitel. Auf WU WONNA gibt es zu jedem Unterkapitel einen Übungstest mit Erklärungen, und komplette Probetests im Prüfungsformat (offizieller Probetest 2026/27, Set 1 und Set 2) zeigen dir, wo du zeitlich und in allen Teilen stehst.',
    },
    {
      question: 'Ist WU WONNA die offizielle Website der WU?',
      answer:
        'Nein. WU WONNA ist ein unabhängiges Projekt, steht in keiner Verbindung zur Wirtschaftsuniversität Wien (WU Wien) und vertritt sie nicht. Offizielle Informationen zur Aufnahme gibt es nur auf wu.ac.at.',
    },
    {
      question: 'Was ist WU WONNA?',
      answer: `${SITE_SUMMARY.de} Der Name steht für WU + englisch „wanna“ („will“): „Ich will an die WU“. Es gibt auch einen YouTube- und einen Telegram-Kanal @wuwonna.`,
    },
  ],
  en: [
    {
      question: 'What is the WiSo Aufnahmeprüfung?',
      answer:
        'It is the entrance exam of the Vienna University of Economics and Business (WU Wien, Wirtschaftsuniversität Wien) for the Business, Economics and Social Sciences bachelor (WiSo). It is part of the admission procedure (Aufnahmeverfahren), in which places are awarded based on exam results.',
    },
    {
      question: 'What parts does the WU entrance exam have?',
      answer:
        'Three parts: economics basics (based on the official WU study script), German reading comprehension of an economics text at B2–C1 level, and mathematics. All questions are multiple choice.',
    },
    {
      question: 'How long is the exam and how does it work?',
      answer:
        'The exam lasts 2 hours without a break. It is held once a year in person at a large exam venue; you can’t choose another date. You may bring a calculator and writing materials.',
    },
    {
      question: 'What is the cut-off score for the WU entrance exam?',
      answer: `In 2026 the cut-off was around ${EXAM_STATS_2026.passingScore.replace('≈ ', '')} points. ${EXAM_STATS_2026.participants.replace(' ', ',')} people competed for ${EXAM_STATS_2026.places.replace(' ', ',')} places. The cut-off changes every year depending on the number of places and the results.`,
    },
    {
      question: 'How much does the WU entrance exam cost?',
      answer:
        'In 2026 the service fee was €50. It isn’t refunded, even if you are not admitted. You must complete the Online Self-Assessment (OSA) before paying.',
    },
    {
      question: 'How do I prepare for the WiSo entrance exam?',
      answer:
        'The economics questions are based on the official WU study script, so start there, chapter by chapter. WU WONNA has a practice test with explanations for every sub-chapter, and full mock exams in the real format (the official 2026/27 practice test, Set 1 and Set 2) show where you stand on time and across all parts.',
    },
    {
      question: 'Is WU WONNA the official WU website?',
      answer:
        'No. WU WONNA is an independent project, not affiliated with or representing the Vienna University of Economics and Business (WU Wien). Official admission information is available only at wu.ac.at.',
    },
    {
      question: 'What is WU WONNA?',
      answer: `${SITE_SUMMARY.en} The name is WU + “wanna”: “I wanna get into WU”. There is also a YouTube channel and a Telegram channel, @wuwonna.`,
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
  de: {
    title: 'Zur Aufnahmeprüfung',
    subtitle: 'Wie die Aufnahmeprüfung der WU abläuft und wie du dich anmeldest',
    h1: 'Aufnahmeprüfung der WU Wien (WiSo)',
    tabs: {
      general: 'Überblick',
      stats: 'Statistik und Mindestpunktzahl 2026',
      registration: 'Anmeldung',
      materials: 'Nützliche Links',
    },
    summaryHeading: 'Kurz und knapp',
    facts: [
      'Prüfungsdauer: **2 Stunden**',
      'Die WiSo-Prüfung hat drei Teile: wirtschaftliche Grundlagen, deutsches Textverständnis und Mathematik.',
      'Alle Aufgaben sind **Multiple Choice** – du wählst die richtige Antwort oder die richtigen Antworten aus den vorgegebenen aus.',
    ],
    howItGoesHeading: 'So läuft die Prüfung ab',
    howItGoes: `Die WiSo-Prüfung findet einmal im Jahr vor Ort statt. Den Termin kannst du nicht selbst wählen.

Alle Teilnehmer:innen schreiben gleichzeitig in einem großen Prüfungszentrum, jede:r an einem eigenen Tisch.

Mitnehmen darfst du einen Taschenrechner und Schreibzeug. Alle Unterlagen für die Aufgaben bekommst du vor Ort; zur Sicherheit liegt auch ein Kugelschreiber am Tisch.

Die Prüfung dauert 2 Stunden ohne Pause.`,
    registrationHeading: 'Anmeldung und Kosten',
    registration: [
      'Alles zur Anmeldung findest du auf der [offiziellen Website der WU].',
      'Stand 2026 beträgt der Servicebeitrag für die Prüfung **50 €**.',
      'Der Servicebeitrag wird nicht zurückerstattet, auch wenn man die Prüfung nicht besteht.',
    ],
    partsHeading: 'Die Prüfungsteile',
    faqHeading: 'Häufige Fragen',
    statsHeading: 'Statistik und Mindestpunktzahl 2026',
    stats: {
      passingScore: 'Ungefähre Mindestpunktzahl',
      places: 'Studienplätze',
      participants: 'Teilnehmer:innen',
    },
    source: 'Quelle:',
    materialsHeading: 'Nützliche Links',
    socialHeading: 'Social Media',
    links: {
      official: 'Offizielle Website der WU',
      scoring: 'Präsentation: wie die Punkte (Teilpunkte) berechnet werden',
      youtube: 'YouTube-Kanal von WU WONNA',
      telegram: 'Telegram-Kanal von WU WONNA',
    },
    registrationIntro: 'Die Schritte für 2026 im Überblick. Details auf der [offiziellen Website der WU].',
    step: 'Schritt {number}',
  },
  en: {
    title: 'The entrance exam',
    subtitle: 'How the WU entrance exam works and how to register',
    h1: 'WU Vienna entrance exam (WiSo admission test)',
    tabs: {
      general: 'Overview',
      stats: '2026 statistics and cut-off',
      registration: 'Registration',
      materials: 'Useful links',
    },
    summaryHeading: 'Key facts',
    facts: [
      'Exam duration: **2 hours**',
      'The WiSo exam has three parts: economics basics, German reading comprehension and mathematics.',
      'All questions are **multiple choice** – you pick the correct option or options from those given.',
    ],
    howItGoesHeading: 'How the exam works',
    howItGoes: `The WiSo exam is held once a year in person. You can’t choose the date yourself.

All candidates sit the exam together in a large exam venue, each at their own desk.

You may bring a calculator and writing materials. Everything you need for the tasks is handed out on site, and there is also a pen on the desk just in case.

The exam lasts 2 hours without a break.`,
    registrationHeading: 'Registration and cost',
    registration: [
      'Full details on registering for the exam are on the [official WU website].',
      'As of 2026, the service fee for the exam is **€50**.',
      'The service fee isn’t refunded, even if you don’t pass the exam.',
    ],
    partsHeading: 'Parts of the exam',
    faqHeading: 'FAQ',
    statsHeading: '2026 statistics and cut-off score',
    stats: {
      passingScore: 'Approximate cut-off score',
      places: 'Places',
      participants: 'Candidates',
    },
    source: 'Source:',
    materialsHeading: 'Useful links',
    socialHeading: 'Social media',
    links: {
      official: 'Official WU website',
      scoring: 'Presentation: how answers are scored (partial credit)',
      youtube: 'WU WONNA on YouTube',
      telegram: 'WU WONNA on Telegram',
    },
    registrationIntro: 'The steps for 2026 in brief. Details on the [official WU website].',
    step: 'Step {number}',
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
  de: {
    title: 'Über uns',
    subtitle: 'Wer wir sind und warum es WU WONNA gibt',
    h1: 'Über WU WONNA',
    heading: 'Die ganze Vorbereitung auf die WU-Aufnahmeprüfung an einem Ort',
    paragraphs: [
      'WU WONNA (wuwonna.at) ist eine Online-Plattform zur Vorbereitung auf die Aufnahmeprüfung der Wirtschaftsuniversität Wien (WU Wien) – das WiSo-Aufnahmeverfahren. Wir haben Probetests im Format der echten Prüfung, Übungstests zu jedem Kapitel des offiziellen WU-Skripts mit Erklärungen, Übersetzung und ein eigenes Vokabelheft zusammengebracht, damit du Material nicht auf verschiedenen Seiten suchen musst.',
      'Der Name steht für WU und englisch „wanna“ („will“): „Ich will an die WU“. Neben der Website betreiben wir einen YouTube- und einen Telegram-Kanal – dort geht es darum, wie die Prüfung aufgebaut ist, wie man sich vorbereitet und wie die Aufnahme abläuft.',
      'Die Plattform wächst ständig: Wir ergänzen neue Probetests und Materialien, verbessern die Werkzeuge und machen die Vorbereitung so bequem und strukturiert wie möglich.',
    ],
    features: [
      {
        title: 'Probetests',
        description: 'Tests im Format der echten Prüfung – mit Timer, Teilpunkten und einer Erklärung zu jeder Antwort.',
      },
      {
        title: 'Übersetzung und Vokabeln',
        description: 'Markiere ein unbekanntes Wort direkt in der Aufgabe – übersetze es und speichere es mit Beispiel in deinen Vokabeln.',
      },
      {
        title: 'Fortschritt pro Kapitel',
        description: 'Du siehst, wie viel Prozent jedes Kapitels du schon kannst und welche Unterkapitel du wiederholen solltest.',
      },
    ],
    socialHeading: 'Social Media',
    startTitle: 'Womit anfangen',
    startText: 'Mach den ersten Probetest – danach siehst du, welche Themen du noch üben solltest.',
    startCta: 'Zu den Probetests',
  },
  en: {
    title: 'About',
    subtitle: 'Who we are and why we built WU WONNA',
    h1: 'About WU WONNA',
    heading: 'All your WU entrance exam preparation in one place',
    paragraphs: [
      'WU WONNA (wuwonna.at) is an online platform to prepare for the entrance exam of the Vienna University of Economics and Business (WU Wien, Wirtschaftsuniversität Wien) – the WiSo admission test. We brought together mock exams in the real format, practice tests for every chapter of the official WU study script with explanations, translation and a personal vocabulary list, so you don’t have to hunt for materials across different sites.',
      'The name is WU + “wanna”: “I wanna get into WU”. Besides the site, we run a YouTube channel and a Telegram channel about how the exam is structured, how to prepare and how admission works.',
      'The platform keeps growing: we add new practice tests and materials, improve the tools and try to make preparation convenient and structured.',
    ],
    features: [
      {
        title: 'Practice tests',
        description: 'Tests in the real exam format – with a timer, partial credit and an explanation for every answer.',
      },
      {
        title: 'Translation and vocabulary',
        description: 'Select an unfamiliar word right in the question – translate it and save it with an example to your vocabulary.',
      },
      {
        title: 'Progress by chapter',
        description: 'See what percentage of each chapter you’ve mastered and which sub-chapters are worth revising.',
      },
    ],
    socialHeading: 'Social media',
    startTitle: 'Where to start',
    startText: 'Take your first practice test – afterwards you’ll see which topics to work on.',
    startCta: 'Practice tests',
  },
}

// Адрес страницы пробника: по slug из базы (practice_tests.slug), без него —
// по id. lang — язык страницы; по умолчанию язык самой версии. Русская
// версия, показанная на немецкой странице (нет перевода), открывается по
// /de/probetests/<русский slug>. Менять уже выданный slug не стоит: старые
// ссылки и позиции в поиске пропадут.
export function testPath(test, lang = test.lang ?? 'ru') {
  return localPath('test', { slug: test.slug || test.id }, lang)
}

export function testExamPath(test, lang = test.lang ?? 'ru') {
  return localPath('testExam', { slug: test.slug || test.id }, lang)
}

// Результат попытки (разбор ответов). attemptId не указан — последняя попытка.
export function testResultPath(test, attemptId, lang = test.lang ?? 'ru') {
  return localPath('testResult', { slug: test.slug || test.id, attempt: attemptId }, lang)
}

// Шаблон заголовка, если у версии нет своего seo_title.
const TEST_SEO_TEMPLATES = {
  ru: (test) =>
    `${test.title} — ${test.section ? `тест по книге WU, ${test.section}` : 'пробник к экзамену WU Wien'} (WiSo Aufnahmeprüfung) | WU WONNA`,
  de: (test) =>
    `${test.title} – ${test.section ? `Übungstest zum WU-Skript, ${test.section}` : 'Probetest zur Aufnahmeprüfung der WU Wien'} (WiSo) | WU WONNA`,
  en: (test) =>
    `${test.title} – ${test.section ? `WU study script practice test, ${test.section}` : 'WU Vienna entrance exam practice test'} (WiSo) | WU WONNA`,
}

// Заголовок и описание страницы одного пробника: свои seo_title и
// seo_description из базы, если заполнены, иначе — по шаблону языка версии.
export function testSeo(test) {
  const lang = test.lang ?? 'ru'
  const description = (test.description || test.long_description || inLang(SITE_SUMMARY, lang))
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return {
    title: test.seo_title || inLang(TEST_SEO_TEMPLATES, lang)(test),
    description: test.seo_description || (description.length > 200 ? `${description.slice(0, 197).trimEnd()}…` : description),
    path: testPath(test),
    lang,
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

// Бесплатный официальный пробник, на который ведут кнопки гайда по
// поступлению. На других языках ссылка по id: страница пробника сама
// перейдёт на версию этого языка (или покажет русскую, если перевода нет).
export const FREE_PROBNIK = { id: '5d1b0666-184a-4bf8-a56e-cf1813273597', slug: 'wiso-probnik-2026-oficialnyj' }

export function freeProbnikPath(lang) {
  return localPath('test', { slug: lang === 'ru' ? FREE_PROBNIK.slug : FREE_PROBNIK.id }, lang)
}

// «Как поступить в WU» (ключ маршрута admissionGuide) на каждом языке: одна
// тема («как поступить в WU и сдать WiSo Aufnahmeprüfung»), связанная через
// hreflang — Google сам покажет человеку версию на его языке. Заголовок и
// описание — в PAGES[lang].admissionGuide.
//
// Раздел страницы: { heading, text?, items?, ordered? } — абзац и/или список.
export const ADMISSION_GUIDE = {
  ru: {
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

  de: {
    h1: 'WiSo Aufnahmeprüfung an der WU Wien – Vorbereitung und kostenloser Probetest',
    lead: 'Alles Wichtige zum Aufnahmeverfahren für das Bachelorstudium Wirtschafts- und Sozialwissenschaften (WiSo) an der Wirtschaftsuniversität Wien – kurz und übersichtlich. Auf WU WONNA kannst du dich mit Probetests im Prüfungsformat und Übungstests zu jedem Kapitel des WU-Skripts vorbereiten.',
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
    more: 'Mehr zur Aufnahmeprüfung',
    faqHeading: 'Häufige Fragen',
    officialLink: 'Offizielle WU-Seite zum Aufnahmeverfahren',
  },

  en: {
    h1: 'WU Vienna WiSo entrance exam (Aufnahmeprüfung) – how to prepare, plus a free practice test',
    lead: 'A short guide to the admission procedure for the Business, Economics and Social Sciences bachelor (WiSo) at the Vienna University of Economics and Business (WU Wien). On WU WONNA you can practise with mock exams in the real format and tests for every chapter of the official WU study script. Note: the exam itself is in German.',
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
    more: 'More about the exam',
    faqHeading: 'FAQ',
    officialLink: 'Official WU admission page',
  },
}
