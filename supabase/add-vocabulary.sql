-- Личный словарь в аккаунте (раньше слова жили только в браузере). Таблица
-- user_vocabulary уже есть из full-reset.sql — здесь она дополняется полями,
-- которые есть у слова на сайте, и разрешением редактировать свои слова.
-- Уже существующие строки не трогаются.
-- Выполнить в Supabase: SQL Editor -> New query -> вставить -> Run.
-- Можно запускать повторно.

alter table user_vocabulary add column if not exists translation text;
alter table user_vocabulary add column if not exists example text;
alter table user_vocabulary add column if not exists category text;

-- Одно и то же слово у человека один раз (без учёта регистра).
create unique index if not exists user_vocabulary_user_word_idx
  on user_vocabulary (user_id, lower(word));

-- Чтение, добавление и удаление своих слов уже разрешены в full-reset.sql;
-- не хватало изменения (перевод, пример, категория).
drop policy if exists "users update their own vocabulary" on user_vocabulary;
create policy "users update their own vocabulary" on user_vocabulary
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
