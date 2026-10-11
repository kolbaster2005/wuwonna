-- Добавляет то, чего не было в full-reset.sql — не трогает уже
-- существующие данные (Пробник 2026 и его вопросы останутся на месте).
-- Выполнить в Supabase: SQL Editor -> New query -> вставить -> Run.

-- Баллы за вопрос (нужны для частичной системы оценки). По умолчанию 1 —
-- можно менять по каждому вопросу через админку.
alter table questions add column if not exists points numeric not null default 1;

-- Файл PDF самого пробника — загружается через админку, отдаётся студенту
-- по кнопке "Скачать пробник в PDF" на странице пробника.
alter table practice_tests add column if not exists pdf_url text;
