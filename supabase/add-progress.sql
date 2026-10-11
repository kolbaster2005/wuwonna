-- Результаты пройденных тестов для страницы «Мой прогресс». Каждое нажатие
-- «Завершить» в тесте — одна строка (попытка) в user_progress. Таблица уже
-- есть из full-reset.sql — здесь она дополняется нужными колонками, уже
-- существующие строки не трогаются.
-- Выполнить в Supabase: SQL Editor -> New query -> вставить -> Run.
-- Можно запускать повторно.

-- Баллы бывают дробными (частичная оценка) — int не подходит.
alter table user_progress alter column score type numeric using score::numeric;

alter table user_progress add column if not exists max_score numeric;         -- максимум баллов за тест
alter table user_progress add column if not exists questions_count int;       -- вопросов в тесте
alter table user_progress add column if not exists answered_count int;        -- на сколько ответил
alter table user_progress add column if not exists duration_seconds int;      -- время по таймеру
alter table user_progress add column if not exists answers jsonb;             -- [{question_id, score, max}]

create index if not exists user_progress_user_completed_idx
  on user_progress (user_id, completed_at desc);

-- Чтение и запись своих попыток уже разрешены в full-reset.sql
-- ("users read/insert their own progress") — здесь ничего добавлять не нужно.
