-- CHENEB TACOS: secure staff accounts and RPCs.
-- Run this file once in Supabase Dashboard > SQL Editor.
-- Do not put a service_role key in the frontend.

create extension if not exists pgcrypto;

create table if not exists public.staff_accounts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  employee_code text not null unique check (char_length(trim(employee_code)) between 2 and 80),
  staff_role text not null check (staff_role in ('manager', 'cashier', 'kitchen', 'waiter', 'delivery')),
  pin_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists staff_accounts_name_idx
  on public.staff_accounts (lower(full_name));

create index if not exists staff_accounts_active_idx
  on public.staff_accounts (is_active);

alter table public.staff_accounts enable row level security;
revoke all on public.staff_accounts from anon, authenticated;

create or replace function public.staff_accounts_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists staff_accounts_updated_at on public.staff_accounts;
create trigger staff_accounts_updated_at
before update on public.staff_accounts
for each row execute function public.staff_accounts_set_updated_at();

-- Initial login RPC. The PIN is compared against a bcrypt hash and is never returned.
create or replace function public.verify_cashier_pin(p_employee_name text, p_pin text)
returns table (
  staff_id uuid,
  full_name text,
  employee_code text,
  staff_role text
)
language sql
security definer
set search_path = public, extensions
as $$
  select id, full_name, employee_code, staff_role
  from public.staff_accounts
  where is_active
    and lower(trim(full_name)) = lower(trim(p_employee_name))
    and p_pin ~ '^[0-9]{4}$'
    and pin_hash = crypt(p_pin, pin_hash)
  limit 1;
$$;

-- Manager-only Edge Functions call these RPCs after validating the signed session.
create or replace function public.list_staff_accounts()
returns table (
  id uuid,
  full_name text,
  employee_code text,
  staff_role text,
  is_active boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select id, full_name, employee_code, staff_role, is_active, created_at
  from public.staff_accounts
  order by created_at asc;
$$;

create or replace function public.create_staff_account(
  p_full_name text,
  p_employee_code text,
  p_role text,
  p_pin text
)
returns table (
  id uuid,
  full_name text,
  employee_code text,
  staff_role text,
  is_active boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  created public.staff_accounts;
begin
  if p_role not in ('manager', 'cashier', 'kitchen', 'waiter', 'delivery')
     or p_pin !~ '^[0-9]{4}$'
     or char_length(trim(p_full_name)) not between 2 and 120
     or char_length(trim(p_employee_code)) not between 2 and 80 then
    raise exception 'invalid staff account data' using errcode = '22023';
  end if;

  insert into public.staff_accounts (full_name, employee_code, staff_role, pin_hash)
  values (trim(p_full_name), trim(p_employee_code), p_role, crypt(p_pin, gen_salt('bf', 12)))
  returning * into created;

  return query select created.id, created.full_name, created.employee_code,
    created.staff_role, created.is_active, created.created_at;
end;
$$;

create or replace function public.set_staff_account_active(
  p_staff_id uuid,
  p_is_active boolean
)
returns table (
  id uuid,
  full_name text,
  employee_code text,
  staff_role text,
  is_active boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.staff_accounts;
begin
  update public.staff_accounts
  set is_active = p_is_active
  where id = p_staff_id
  returning * into updated;

  if not found then
    raise exception 'staff account not found' using errcode = 'P0002';
  end if;

  return query select updated.id, updated.full_name, updated.employee_code,
    updated.staff_role, updated.is_active, updated.created_at;
end;
$$;

revoke all on function public.verify_cashier_pin(text, text) from public, anon, authenticated;
revoke all on function public.list_staff_accounts() from public, anon, authenticated;
revoke all on function public.create_staff_account(text, text, text, text) from public, anon, authenticated;
revoke all on function public.set_staff_account_active(uuid, boolean) from public, anon, authenticated;
grant execute on function public.verify_cashier_pin(text, text) to service_role;
grant execute on function public.list_staff_accounts() to service_role;
grant execute on function public.create_staff_account(text, text, text, text) to service_role;
grant execute on function public.set_staff_account_active(uuid, boolean) to service_role;

-- BOOTSTRAP ONE MANAGER ACCOUNT MANUALLY, using a PIN chosen privately by the owner.
-- Replace the three values below in the Supabase SQL Editor, then run the INSERT once.
-- Never commit the real PIN or run this with a shared/default PIN.
--
-- insert into public.staff_accounts (full_name, employee_code, staff_role, pin_hash)
-- values (
--   'اسم المدير',
--   'manager-001',
--   'manager',
--   crypt('YOUR_PRIVATE_4_DIGIT_PIN', gen_salt('bf', 12))
-- );
