-- Незавершённые попытки (черновики): начал пробник, не закончил — ответы,
-- текущий вопрос и время на таймере сохраняются, и тест можно продолжить
-- позже с любого устройства. Одна запись на человека и языковую версию
-- пробника; после «Завершить» запись удаляется (попытка уходит в user_progress).
-- Пока скрипт не выполнен, черновики хранятся только в браузере.
-- Выполнить в Supabase: SQL Editor -> New query -> вставить -> Run.
-- Можно запускать повторно.

create table if not exists user_test_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id uuid not null references practice_tests(id) on delete cascade,
  translation_group uuid,
  answers jsonb not null default '[]',      -- [{question_id, selected, score, max}]
  current_step int not null default 0,      -- на каком шаге остановился
  elapsed_seconds int not null default 0,   -- время по таймеру
  questions_count int,
  updated_at timestamptz not null default now(),
  unique (user_id, test_id)
);

alter table user_test_drafts enable row level security;

drop policy if exists "users manage their own test drafts" on user_test_drafts;
create policy "users manage their own test drafts" on user_test_drafts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
