-- Языковые версии пробников (RU / DE / EN).
--
-- Каждая языковая версия пробника — отдельная строка practice_tests со своими
-- вопросами и текстами. Версии одного пробника связаны общим
-- translation_group. Все текущие пробники становятся русскими версиями своих
-- групп (translation_group = id), живые данные не меняются.
--
-- Сюда же переезжают понятные адреса пробников (раньше TEST_SLUGS в
-- src/seo/content.js) и свои заголовки для поиска (TEST_SEO_OVERRIDES).
-- ВАЖНО: выполнить ДО выкладки сайта, который читает слаги из базы — иначе
-- адреса пробников временно станут вида /probniki/<id>.
--
-- Выполнить в Supabase: SQL Editor -> New query -> вставить -> Run.
-- Можно запускать повторно.

-- --- Колонки ---

alter table practice_tests add column if not exists lang text not null default 'ru'
  check (lang in ('ru', 'de', 'en'));
alter table practice_tests add column if not exists translation_group uuid;
update practice_tests set translation_group = id where translation_group is null;
alter table practice_tests alter column translation_group set default gen_random_uuid();
alter table practice_tests alter column translation_group set not null;
alter table practice_tests add column if not exists slug text;
alter table practice_tests add column if not exists seo_title text;
alter table practice_tests add column if not exists seo_description text;

create unique index if not exists practice_tests_lang_slug on practice_tests (lang, slug);
create unique index if not exists practice_tests_group_lang on practice_tests (translation_group, lang);

alter table categories add column if not exists name_de text;
alter table categories add column if not exists name_en text;

-- --- Слаги (бывший TEST_SLUGS) ---

update practice_tests t set slug = v.slug
from (values
  ('5d1b0666-184a-4bf8-a56e-cf1813273597', 'wiso-probnik-2026-oficialnyj'), -- Официальный пробник WiSo 2026/2027
  ('3fbee26e-b52d-44bc-9fa7-2bd18d0d72a5', 'wiso-probnik-2026-s-razborom'), -- Пробник 2026 (с разбором)
  ('98788230-f0ec-45d3-9904-9a9c5d88d16e', 'wiso-probnik-set-1'), -- Пробник Set 1
  ('fea4f351-cd3a-415e-a2e1-4d9520263ee8', 'wiso-probnik-set-2'), -- Пробник Set 2
  ('fcf1b101-bbd4-41fa-803b-6229a911ff5f', 'kniga-wu-glava-1-1'), -- Глава 1.1
  ('7d2c31fa-27dc-413a-8168-2225bcd452a6', 'kniga-wu-glava-1-2'), -- Глава 1.2
  ('79ca2285-ab2f-4156-8211-fea9ff6fb4cc', 'kniga-wu-glava-1-3'), -- Глава 1.3
  ('8b8f915f-cd1a-4801-aaf0-817ae7ffcc81', 'kniga-wu-glava-1-4'), -- Глава 1.4
  ('603f1b53-621b-4626-98a1-c310f64228c8', 'kniga-wu-glava-1-5'), -- Глава 1.5
  ('1c941b41-fc8b-4bdc-a13e-5c74258049fa', 'kniga-wu-glava-2-1'), -- Глава 2.1
  ('d546a137-311e-4841-9f56-c60e5a1962eb', 'kniga-wu-glava-2-2'), -- Глава 2.2
  ('2f9c1c85-9a75-4e7d-a90d-61c671519914', 'kniga-wu-glava-2-3'), -- Глава 2.3
  ('146b3aa1-451e-4dad-aa84-9c14322d7f57', 'kniga-wu-glava-2-4'), -- Глава 2.4
  ('4677645e-a17a-4dcc-8803-f5db29d671e2', 'kniga-wu-glava-2-5'), -- Глава 2.5
  ('d462202e-60be-40d0-8db8-99c8fc692788', 'kniga-wu-glava-2-6'), -- Глава 2.6
  ('cb0febff-5e6f-495b-a913-8cd96c74163e', 'kniga-wu-glava-3-1'), -- Глава 3.1
  ('b6089fc1-ba66-4dcc-8c0a-ec3a59c640dc', 'kniga-wu-glava-3-2-chast-1'), -- Глава 3.2 часть 1
  ('cd1d8389-1bce-42ce-918a-5182eff2b298', 'kniga-wu-glava-3-2-chast-2'), -- Глава 3.2 часть 2
  ('160cee67-a251-4193-b3d3-8a0d6b5c683c', 'kniga-wu-glava-3-3-chast-1'), -- Глава 3.3 часть 1
  ('da6fc434-0814-44a2-ac11-89d30afbadb0', 'kniga-wu-glava-3-3-chast-2'), -- Глава 3.3 часть 2
  ('7ddccbb2-f73d-4af3-8409-d61154bcb884', 'kniga-wu-glava-3-4-chast-1'), -- Глава 3.4 часть 1
  ('e61245cd-f347-480f-9d19-a0c7509c214c', 'kniga-wu-glava-3-4-chast-2'), -- Глава 3.4 часть 2
  ('b21795e0-e6d5-481c-86f4-98722e86bd77', 'kniga-wu-glava-3-4-chast-3'), -- Глава 3.4 часть 3
  ('283481c6-20a6-451a-9519-087b0adb2d4a', 'kniga-wu-glava-3-5-chast-1'), -- Глава 3.5 часть 1
  ('3baa7d6e-5976-44e7-9b7a-2eb7db021197', 'kniga-wu-glava-3-5-chast-2'), -- Глава 3.5 часть 2
  ('66bb8a9b-e636-470b-9545-95c2e77384cb', 'kniga-wu-glava-3-5-chast-3'), -- Глава 3.5 часть 3
  ('f5902579-85c0-42aa-a671-8517464d7433', 'kniga-wu-glava-3-5-chast-4'), -- Глава 3.5 часть 4
  ('56b604ea-d958-4069-8620-5a2f1366b46c', 'kniga-wu-glava-4-1'), -- Глава 4.1
  ('0174eb7a-52e5-4743-b6e1-cd52314c60be', 'kniga-wu-glava-4-2'), -- Глава 4.2
  ('71012839-ee39-4cf6-9c6a-2d4d246cc612', 'kniga-wu-glava-4-3'), -- Глава 4.3
  ('81c09969-2826-4b8d-80ae-736bb610053a', 'kniga-wu-glava-4-4-1'), -- Глава 4.4.1
  ('7b42a2f9-9335-4818-9ed4-52a090fbf154', 'kniga-wu-glava-4-4-2')  -- Глава 4.4.2
) as v(id, slug)
where t.id = v.id::uuid and t.slug is null;

-- --- Заголовки для поиска (бывший TEST_SEO_OVERRIDES) ---

update practice_tests set
  seo_title = 'Официальный пробник WU WiSo 2026/27 онлайн — вступительный экзамен (Aufnahmeprüfung) | WU WONNA',
  seo_description = 'Официальный пробник вступительного экзамена WU Wien (WiSo Aufnahmeprüfung) 2026/27 онлайн: 26 заданий, 120 минут, таймер как на экзамене и разбор каждого ответа. Бесплатно.'
where id = '5d1b0666-184a-4bf8-a56e-cf1813273597' and seo_title is null;

update practice_tests set
  seo_title = 'Пробник WU 2026 с разбором ответов — экономика и математика (WiSo Aufnahmeprüfung) | WU WONNA',
  seo_description = 'Пробник к вступительному экзамену WU Wien 2026/27 с подробным разбором каждого варианта: основы экономики по книге WU и математика. Онлайн, с таймером, бесплатно.'
where id = '3fbee26e-b52d-44bc-9fa7-2bd18d0d72a5' and seo_title is null;

update practice_tests set
  seo_title = 'Пробник WiSo Set 1 — тренировочный вариант экзамена WU Wien | WU WONNA'
where id = '98788230-f0ec-45d3-9904-9a9c5d88d16e' and seo_title is null;

update practice_tests set
  seo_title = 'Пробник WiSo Set 2 — сложный вариант экзамена WU Wien | WU WONNA'
where id = 'fea4f351-cd3a-415e-a2e1-4d9520263ee8' and seo_title is null;

-- --- Копия пробника на другой язык: тест + вопросы + тексты ---
-- Вызов из админки: supabase.rpc('create_test_translation', { source_test_id, target_lang }).
-- Работает с правами вызвавшего (без security definer): записать может только
-- админ — действуют политики из admin-policies.sql.
-- Копия создаётся с текстами исходной версии и тем же слагом — дальше её
-- переводят в админке. Добавишь колонки в questions или passages — добавь
-- их и сюда.

create or replace function create_test_translation(source_test_id uuid, target_lang text)
returns uuid language plpgsql as $$
declare
  source practice_tests;
  new_test_id uuid;
  question record;
  new_question_id uuid;
  question_id_map jsonb := '{}';
begin
  select * into source from practice_tests where id = source_test_id;
  if not found then raise exception 'test % not found', source_test_id; end if;
  if exists (select 1 from practice_tests
             where translation_group = source.translation_group and lang = target_lang) then
    raise exception 'version % already exists', target_lang;
  end if;

  insert into practice_tests (category_id, title, description, long_description, originality,
    is_pinned, is_pro, pdf_url, duration_minutes, year, sort_order, section,
    lang, translation_group, slug)
  values (source.category_id, source.title, source.description, source.long_description,
    source.originality, source.is_pinned, source.is_pro, source.pdf_url, source.duration_minutes,
    source.year, source.sort_order, source.section,
    target_lang, source.translation_group, source.slug)
  returning id into new_test_id;

  for question in select * from questions where test_id = source_test_id order by sort_order loop
    insert into questions (test_id, prompt, options, correct_option_ids, explanation,
      category, image_url, points, sort_order)
    values (new_test_id, question.prompt, question.options, question.correct_option_ids,
      question.explanation, question.category, question.image_url, question.points, question.sort_order)
    returning id into new_question_id;
    question_id_map := question_id_map || jsonb_build_object(question.id::text, new_question_id);
  end loop;

  -- anchor_question_id пересаживаем на копии вопросов
  insert into passages (test_id, category, type, title, content, anchor_question_id, sort_order)
  select new_test_id, p.category, p.type, p.title, p.content,
    (question_id_map ->> p.anchor_question_id::text)::uuid, p.sort_order
  from passages p where p.test_id = source_test_id;

  return new_test_id;
end $$;
