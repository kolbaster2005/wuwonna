-- Добавляет флаг доступа к пробнику: только для подписки PRO или для всех.
-- Не трогает уже существующие данные — все текущие пробники остаются
-- доступными всем (is_pro = false), переключается кнопкой в админке
-- (/admin/probniki).
-- Выполнить в Supabase: SQL Editor -> New query -> вставить -> Run.

alter table practice_tests add column if not exists is_pro boolean not null default false;
