-- Закрывает запись в контент (пробники, вопросы, тексты, категории, книгу)
-- для всех, кроме админа. Заменяет и временные открытые политики из
-- full-reset.sql / add-book.sql, и "любой вошедший" из auth-policies.sql.
-- Чтение контента остаётся открытым для всех, личные данные учеников
-- (user_progress, user_vocabulary, book_highlights) — как и раньше, только свои.
--
-- Выполнить в Supabase: SQL Editor -> New query -> вставить весь файл -> Run.
-- Можно запускать повторно — результат будет тот же.
--
-- После запуска ВЫЙДИ И ВОЙДИ на сайте заново: роль попадает в токен входа
-- только при новом входе. До этого админка тебя не пустит, а запись в базу
-- будет отклоняться.

-- --- Шаг 1. Роль admin переезжает в app_metadata ---
-- Раньше роль лежала в user_metadata — его пользователь может переписать сам
-- через API, то есть любой мог объявить себя админом. app_metadata меняется
-- только отсюда, из SQL. Тем, у кого роль была в user_metadata, она
-- переносится в app_metadata, а из user_metadata удаляется.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb,
    raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) - 'role'
where raw_user_meta_data ->> 'role' = 'admin';

-- --- Шаг 2. Запись в контент — только админу ---
-- Удаляем ВСЕ политики записи на таблицах контента (как бы они ни
-- назывались — в том числе созданные вручную в дэшборде), политики чтения
-- (SELECT) не трогаем, и создаём одну: писать может только role = admin.
do $$
declare
  t text;
  p record;
begin
  foreach t in array array[
    'categories', 'practice_tests', 'questions', 'passages',
    'book_chapters', 'book_subchapters', 'book_pages'
  ] loop
    for p in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = t and cmd <> 'SELECT'
    loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;

    execute format(
      'create policy %I on public.%I for all to authenticated '
      || 'using ((auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'') '
      || 'with check ((auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'')',
      'only admins can manage ' || t, t
    );
  end loop;
end $$;

-- --- Проверка ---
-- Покажет, у кого теперь роль admin. Там должен быть только ты. Если в
-- списке есть кто-то чужой — забрать роль:
--   update auth.users set raw_app_meta_data = raw_app_meta_data - 'role'
--   where email = 'чужой@email';
select email, raw_app_meta_data ->> 'role' as role
from auth.users
where raw_app_meta_data ->> 'role' = 'admin';
