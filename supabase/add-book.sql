-- Заменяет плоскую структуру книги (одна глава = весь текст) на
-- иерархическую: Глава -> Подглава -> Страницы. Если ты уже выполнял
-- предыдущую версию add-book.sql — это безопасно, старые таблицы дропаются
-- и создаются заново (реальный контент туда ещё не заносили, ждали PDF).
--
-- Выполнить в Supabase: SQL Editor -> New query -> вставить весь файл -> Run.

drop table if exists book_highlights;
drop table if exists book_pages;
drop table if exists book_subchapters;
drop table if exists book_chapters;

-- Глава верхнего уровня, например "1. Warum wir wirtschaften und was
-- Wirtschaften bedeutet". content — необязательный вступительный текст
-- ДО первой подглавы (в примере — абзац сразу под заголовком главы).
create table book_chapters (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Подглава, например "1.1 Jeder Mensch ist Teil der Wirtschaft".
create table book_subchapters (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid references book_chapters(id) on delete cascade,
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Страница внутри подглавы — так длинные подглавы (например, на 11
-- печатных страниц) разбиваются на порции для чтения с перелистыванием,
-- а не одним длинным полотном текста. У страницы может быть фото и/или
-- ссылка на видео.
create table book_pages (
  id uuid primary key default gen_random_uuid(),
  subchapter_id uuid references book_subchapters(id) on delete cascade,
  content text not null,
  image_url text,
  video_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Выделения и заметки читателя — привязаны к конкретной странице и к
-- аккаунту (auth.uid()), у каждого пользователя свои.
create table book_highlights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  page_id uuid references book_pages(id) on delete cascade,
  start_offset int not null,
  end_offset int not null,
  note text,
  created_at timestamptz not null default now()
);

alter table book_chapters enable row level security;
alter table book_subchapters enable row level security;
alter table book_pages enable row level security;
alter table book_highlights enable row level security;

-- Книгу читают все — это открытый учебник.
create policy "book_chapters are publicly readable" on book_chapters for select using (true);
create policy "book_subchapters are publicly readable" on book_subchapters for select using (true);
create policy "book_pages are publicly readable" on book_pages for select using (true);

-- Временно, без ролей (как и остальной контент): писать может кто угодно
-- с anon-ключом. Закрывается вместе с остальным контентом через
-- supabase/admin-policies.sql (запускать после этого файла).
create policy "anyone can manage book_chapters (temporary, no auth yet)" on book_chapters for all using (true) with check (true);
create policy "anyone can manage book_subchapters (temporary, no auth yet)" on book_subchapters for all using (true) with check (true);
create policy "anyone can manage book_pages (temporary, no auth yet)" on book_pages for all using (true) with check (true);

-- Выделения и заметки — строго свои.
create policy "users read their own highlights" on book_highlights for select using (auth.uid() = user_id);
create policy "users insert their own highlights" on book_highlights for insert with check (auth.uid() = user_id);
create policy "users update their own highlights" on book_highlights for update using (auth.uid() = user_id);
create policy "users delete their own highlights" on book_highlights for delete using (auth.uid() = user_id);
