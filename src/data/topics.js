// Ограниченный список тем для режима тренировки — строго соответствует
// оглавлению книги "Wirtschaft verstehen" (главы 1-4; глава 5
// "Abschließende Bemerkungen und verwendete Quellen" содержательных тем не
// содержит и сюда не включена).
//
// Это JS-зеркало таблицы `topics` в Supabase (см.
// supabase/add-question-topics.sql) — используется как:
//   1) источник тем для локального режима (когда Supabase не настроен),
//   2) единственный источник правды о порядке/заголовках на фронтенде, если
//      когда-нибудь понадобится не ходить в БД за одним и тем же списком.
//
// Если меняешь список тем — поддерживай соответствие с SQL-файлом.

export const TOPICS = [
  { code: '1.1', chapter_number: 1, chapter_title: 'Warum wir wirtschaften und was Wirtschaften bedeutet', title: 'Jeder Mensch ist Teil der Wirtschaft', sort_order: 11 },
  { code: '1.2', chapter_number: 1, chapter_title: 'Warum wir wirtschaften und was Wirtschaften bedeutet', title: 'Arbeitsteilung und Spezialisierung kennzeichnen unsere Wirtschaft', sort_order: 12 },
  { code: '1.3', chapter_number: 1, chapter_title: 'Warum wir wirtschaften und was Wirtschaften bedeutet', title: 'Wirtschaften bedeutet Entscheidungen zu treffen, wofür die knappen Ressourcen eingesetzt werden', sort_order: 13 },
  { code: '1.4', chapter_number: 1, chapter_title: 'Warum wir wirtschaften und was Wirtschaften bedeutet', title: 'Der Wirtschaftskreislauf – am Wirtschaftsleben sind viele beteiligt', sort_order: 14 },
  { code: '1.5', chapter_number: 1, chapter_title: 'Warum wir wirtschaften und was Wirtschaften bedeutet', title: 'Geld als Tauschmittel im Wirtschaftskreislauf', sort_order: 15 },

  { code: '2.1', chapter_number: 2, chapter_title: 'Wirtschaft als Teil der Gesellschaft und Umwelt', title: 'Einbettung der Wirtschaft in Gesellschaft und Umwelt', sort_order: 21 },
  { code: '2.2', chapter_number: 2, chapter_title: 'Wirtschaft als Teil der Gesellschaft und Umwelt', title: 'Nachhaltigkeit', sort_order: 22 },
  { code: '2.3', chapter_number: 2, chapter_title: 'Wirtschaft als Teil der Gesellschaft und Umwelt', title: 'Entkopplung von Wirtschaftswachstum und Umweltschäden?', sort_order: 23 },
  { code: '2.4', chapter_number: 2, chapter_title: 'Wirtschaft als Teil der Gesellschaft und Umwelt', title: 'Wirtschaften innerhalb der Erdsystemgrenzen', sort_order: 24 },
  { code: '2.5', chapter_number: 2, chapter_title: 'Wirtschaft als Teil der Gesellschaft und Umwelt', title: 'Soziales Wohlbefinden als Ziel nachhaltigen Wirtschaftens', sort_order: 25 },
  { code: '2.6', chapter_number: 2, chapter_title: 'Wirtschaft als Teil der Gesellschaft und Umwelt', title: 'Gesellschaftliche Voraussetzungen für subjektives Wohlbefinden und Nachhaltigkeit', sort_order: 26 },

  { code: '3.1', chapter_number: 3, chapter_title: 'Was Wirtschaften für Unternehmen bedeutet', title: 'Was ist ein Unternehmen und welche Arten von Unternehmen gibt es?', sort_order: 31 },
  { code: '3.2', chapter_number: 3, chapter_title: 'Was Wirtschaften für Unternehmen bedeutet', title: 'Rechtsformen von Unternehmen', sort_order: 32 },
  { code: '3.3', chapter_number: 3, chapter_title: 'Was Wirtschaften für Unternehmen bedeutet', title: 'Wie Unternehmen finanzielle Mittel aufbringen', sort_order: 33 },
  { code: '3.4', chapter_number: 3, chapter_title: 'Was Wirtschaften für Unternehmen bedeutet', title: 'Welche Fragen das Rechnungswesen beantwortet', sort_order: 34 },
  { code: '3.5', chapter_number: 3, chapter_title: 'Was Wirtschaften für Unternehmen bedeutet', title: 'Marketing – kein Erfolg ohne Marktorientierung', sort_order: 35 },

  { code: '4.1', chapter_number: 4, chapter_title: 'Digitalisierung und Vernetzung von Wirtschaft und Gesellschaft', title: 'Digitale Transformation', sort_order: 41 },
  { code: '4.2', chapter_number: 4, chapter_title: 'Digitalisierung und Vernetzung von Wirtschaft und Gesellschaft', title: 'Neue Produkte, Dienstleistungen und Geschäftsmodelle', sort_order: 42 },
  { code: '4.3', chapter_number: 4, chapter_title: 'Digitalisierung und Vernetzung von Wirtschaft und Gesellschaft', title: 'Das Internet als Plattform für Unternehmen', sort_order: 43 },
  { code: '4.4.1', chapter_number: 4, chapter_title: 'Digitalisierung und Vernetzung von Wirtschaft und Gesellschaft', title: 'Perspektiven und Definition der Wirtschaftsinformatik', sort_order: 441 },
  { code: '4.4.2', chapter_number: 4, chapter_title: 'Digitalisierung und Vernetzung von Wirtschaft und Gesellschaft', title: 'Die Rolle von Anwendungs- und Informationssystemen', sort_order: 442 },
]

// Группирует плоский список тем по главам — удобно для рендера select-окна
// режима тренировки (заголовок главы + её подглавы).
export function groupTopicsByChapter(topics) {
  const byChapter = new Map()
  topics.forEach((t) => {
    if (!byChapter.has(t.chapter_number)) {
      byChapter.set(t.chapter_number, { chapter_number: t.chapter_number, chapter_title: t.chapter_title, topics: [] })
    }
    byChapter.get(t.chapter_number).topics.push(t)
  })
  return [...byChapter.values()].sort((a, b) => a.chapter_number - b.chapter_number)
}
