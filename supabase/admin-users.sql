-- Вкладка «Пользователи» в админке (/admin/users): список всех
-- зарегистрированных и выдача/отзыв PRO.
--
-- Сам сайт не может читать auth.users (это закрытая таблица Supabase), а
-- секретный service_role-ключ во фронтенд класть нельзя. Поэтому здесь две
-- функции с security definer — они выполняются с правами владельца базы,
-- но ПЕРВЫМ делом проверяют, что вызывает их админ (role = admin в
-- app_metadata, см. admin-policies.sql). Для всех остальных — ошибка.
--
-- Выполнить в Supabase: SQL Editor -> New query -> вставить весь файл -> Run.
-- Запускать после admin-policies.sql. Можно запускать повторно.

-- --- Список пользователей ---
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  plan text,
  role text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Только для админа' using errcode = '42501';
  end if;

  return query
    select
      u.id,
      u.email::text,
      u.created_at,
      u.last_sign_in_at,
      coalesce(u.raw_app_meta_data ->> 'plan', 'free'),
      u.raw_app_meta_data ->> 'role'
    from auth.users u
    order by u.created_at desc;
end;
$$;

-- --- Выдать / забрать PRO ---
-- new_plan: 'pro' или 'free'. Меняет только plan, роль и остальное в
-- app_metadata не трогает.
create or replace function public.admin_set_user_plan(target_user_id uuid, new_plan text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'Только для админа' using errcode = '42501';
  end if;
  if new_plan not in ('pro', 'free') then
    raise exception 'План должен быть pro или free, а не %', new_plan;
  end if;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('plan', new_plan)
  where id = target_user_id;

  if not found then
    raise exception 'Пользователь не найден';
  end if;
end;
$$;

-- Вызывать могут только вошедшие (а внутри функции — только админ).
revoke all on function public.admin_list_users() from public, anon;
revoke all on function public.admin_set_user_plan(uuid, text) from public, anon;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_user_plan(uuid, text) to authenticated;
