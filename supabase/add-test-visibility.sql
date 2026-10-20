-- Скрытые пробники: видны только в админке. Пользователям (гостям, обычным
-- и PRO) скрытый пробник не показывается нигде — ни в списках, ни на главной,
-- ни по прямой ссылке; поисковикам тоже (нет готового HTML и записи в sitemap).
-- Признак общий для всех языковых версий пробника — как PRO.
-- Выполнить в Supabase: SQL Editor -> New query -> вставить -> Run.
-- Можно запускать повторно.

alter table practice_tests add column if not exists is_hidden boolean not null default false;

-- Копия пробника на другой язык — теперь копирует и признак «скрыт».
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
    is_pinned, is_pro, is_hidden, pdf_url, download_url, duration_minutes, year, sort_order, section,
    lang, translation_group, slug)
  values (source.category_id, source.title, source.description, source.long_description,
    source.originality, source.is_pinned, source.is_pro, source.is_hidden, source.pdf_url, source.download_url, source.duration_minutes,
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
