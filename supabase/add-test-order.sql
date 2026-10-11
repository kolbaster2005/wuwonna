-- Добавляет порядок пробников (sort_order), который выставляется в админке
-- перетаскиванием (/admin/probniki). Не трогает уже существующие данные:
-- текущим пробникам проставляется порядок как сейчас на сайте (новые годы
-- первыми), дальше меняешь его мышкой.
-- Выполнить в Supabase: SQL Editor -> New query -> вставить -> Run.

alter table practice_tests add column if not exists sort_order int;

update practice_tests p
set sort_order = o.position
from (
  select id, row_number() over (order by year desc nulls last, created_at) - 1 as position
  from practice_tests
) o
where p.id = o.id and p.sort_order is null;

alter table practice_tests alter column sort_order set default 0;
alter table practice_tests alter column sort_order set not null;
