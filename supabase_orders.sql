-- CHENEB TACOS — Supabase orders schema
-- Run this in Supabase Dashboard > SQL Editor.
-- This script is intended for the new/empty project described by the owner.
-- It removes the pre-created empty orders table so its schema is guaranteed.

drop table if exists public.orders cascade;

create table public.orders (
  id text primary key,
  created_at timestamptz not null default now(),
  customer_info jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'received'
    check (status in ('received', 'preparing', 'ready', 'completed', 'cancelled')),
  estimated_minutes integer not null default 15,
  is_paid boolean not null default false,
  payment_method text not null default 'unpaid'
    check (payment_method in ('unpaid', 'cash', 'baridimob', 'carte')),
  cash_received numeric(12,2),
  change_given numeric(12,2),
  paid_at timestamptz,
  status_updated_at timestamptz,
  source text not null default 'online'
    check (source in ('online', 'table', 'caisse')),
  notes text
);

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

create index if not exists orders_status_idx
  on public.orders (status);

create index if not exists orders_is_paid_idx
  on public.orders (is_paid);

-- Automatically maintain status_updated_at when the status changes.
create or replace function public.set_order_status_updated_at()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    new.status_updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists orders_status_updated_at on public.orders;
create trigger orders_status_updated_at
before insert or update of status on public.orders
for each row execute function public.set_order_status_updated_at();

-- Enable Row Level Security.
alter table public.orders enable row level security;

-- Remove old policies with these names so the script can be rerun.
drop policy if exists "orders_public_insert" on public.orders;
drop policy if exists "orders_public_read" on public.orders;
drop policy if exists "orders_public_update" on public.orders;
drop policy if exists "orders_public_delete" on public.orders;
drop policy if exists "orders_authenticated_all" on public.orders;

-- The public menu/customer needs to create an order without logging in.
create policy "orders_public_insert"
on public.orders
for insert
to anon, authenticated
with check (
  id is not null
  and jsonb_typeof(customer_info) = 'object'
  and jsonb_typeof(items) = 'array'
  and total >= 0
);

-- TEMPORARY compatibility policy for the current PIN-based dashboard.
-- The current app uses an in-app PIN, not Supabase Auth, so the dashboard
-- connects as anon. Replace these three policies with the authenticated
-- policy below after adding Supabase Auth to staff accounts.
create policy "orders_public_read"
on public.orders
for select
to anon, authenticated
using (true);

create policy "orders_public_update"
on public.orders
for update
to anon, authenticated
using (true)
with check (true);

create policy "orders_public_delete"
on public.orders
for delete
to anon, authenticated
using (true);

-- Required grants for the REST API and Realtime client.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.orders to anon, authenticated;

-- Add the table to Supabase Realtime only if it is not already enabled.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end
$$;

-- Verify the result.
select
  table_name,
  row_security
from information_schema.tables
where table_schema = 'public'
  and table_name = 'orders';
