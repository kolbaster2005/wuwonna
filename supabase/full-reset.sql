-- ПОЛНЫЙ СБРОС. Сносит все таблицы приложения (пробники, вопросы, тексты,
-- категории, прогресс, личный словарь) и создаёт их заново под актуальную
-- структуру. Дальше этот же файл сразу создаёт "Пробник 2026" со всеми
-- 26 вопросами, разложенными по трём категориям (Понимание экономики /
-- Понимание немецкого текста / Математика) и правильными ответами.
--
-- Про аутентификацию (Supabase Auth): её сюда не входит — таблица
-- auth.users управляется самим Supabase, а не этой схемой, дропать её
-- через SQL не нужно и не стоит. Если хочешь удалить своих
-- зарегистрированных пользователей — это делается вручную в дэшборде:
-- Authentication -> Users -> выделить -> Delete. Полностью безопасно и
-- никак не связано с таблицами ниже.
--
-- Выполнить в Supabase: SQL Editor -> New query -> вставить весь файл -> Run.

drop table if exists passages;
drop table if exists questions;
drop table if exists practice_tests;
drop table if exists user_progress;
drop table if exists user_vocabulary;
drop table if exists categories;

-- --- Категории пробников ---
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- --- Пробники ---
create table practice_tests (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete cascade,
  title text not null,
  description text,
  long_description text,
  originality text default 'official', -- 'official' | 'unofficial'
  is_pinned boolean not null default false,
  is_pro boolean not null default false, -- только для подписки PRO
  pdf_url text, -- PDF пробника (base64), отдаётся по кнопке "Скачать"
  questions_count int not null default 0,
  duration_minutes int not null default 0,
  year int,
  sort_order int not null default 0, -- порядок в списке, меняется перетаскиванием в админке
  section text, -- подзаголовок внутри вкладки, например "Глава 1"
  created_at timestamptz not null default now()
);

-- --- Вопросы ---
create table questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references practice_tests(id) on delete cascade,
  prompt text not null,
  options jsonb not null,
  correct_option_ids jsonb not null,
  explanation text,
  category text,
  image_url text,
  points numeric not null default 1, -- баллы за вопрос (частичная оценка)
  sort_order int not null default 0
);

-- --- Тексты и вступления ---
create table passages (
  id uuid primary key default gen_random_uuid(),
  test_id uuid references practice_tests(id) on delete cascade,
  category text not null,
  type text not null default 'intro' check (type in ('intro', 'pinned')),
  title text,
  content text not null,
  anchor_question_id uuid references questions(id) on delete set null,
  sort_order int not null default 0
);

-- --- Прогресс и личный словарь (на будущее, вместе с аутентификацией) ---
create table user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  test_id uuid references practice_tests(id) on delete cascade,
  score numeric,
  max_score numeric,
  questions_count int,
  answered_count int,
  duration_seconds int,
  answers jsonb, -- [{question_id, score, max}]
  completed_at timestamptz default now()
);

create table user_vocabulary (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  word text not null,
  context text,
  added_at timestamptz not null default now()
);

-- --- RLS ---
alter table categories enable row level security;
alter table practice_tests enable row level security;
alter table questions enable row level security;
alter table passages enable row level security;
alter table user_progress enable row level security;
alter table user_vocabulary enable row level security;

create policy "categories are publicly readable" on categories for select using (true);
create policy "practice_tests are publicly readable" on practice_tests for select using (true);
create policy "questions are publicly readable" on questions for select using (true);
create policy "passages are publicly readable" on passages for select using (true);

-- Временно, без ролей: запись разрешена всем с anon-ключом — чтобы можно было
-- наполнять контент до регистрации. ОБЯЗАТЕЛЬНО закрыть потом через
-- supabase/admin-policies.sql (запись только для админа).
create policy "anyone can manage categories (temporary, no auth yet)" on categories for all using (true) with check (true);
create policy "anyone can manage practice_tests (temporary, no auth yet)" on practice_tests for all using (true) with check (true);
create policy "anyone can manage questions (temporary, no auth yet)" on questions for all using (true) with check (true);
create policy "anyone can manage passages (temporary, no auth yet)" on passages for all using (true) with check (true);

create policy "users read their own progress" on user_progress for select using (auth.uid() = user_id);
create policy "users insert their own progress" on user_progress for insert with check (auth.uid() = user_id);
create policy "users read their own vocabulary" on user_vocabulary for select using (auth.uid() = user_id);
create policy "users manage their own vocabulary" on user_vocabulary for insert with check (auth.uid() = user_id);
create policy "users delete their own vocabulary" on user_vocabulary for delete using (auth.uid() = user_id);

-- --- Данные: категория + "Пробник 2026" ---
insert into categories (name, slug) values ('Пробники', 'probniki');

with cat as (select id from categories where slug = 'probniki')
insert into practice_tests (category_id, title, description, long_description, originality, is_pinned, duration_minutes, year)
select cat.id,
  'Пробник 2026',
  'Экономика, понимание немецкого текста и математика — 26 вопросов.',
  'Пробник 2026 года: разделы «Понимание экономики», «Понимание немецкого текста» и «Математика». В части вопросов может быть несколько правильных ответов.',
  'official',
  true,
  90,
  2026
from cat;
