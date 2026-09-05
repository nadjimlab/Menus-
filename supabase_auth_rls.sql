-- CHENEB TACOS — Supabase Auth + RLS hardening
-- Prerequisite: enable Anonymous Sign-Ins for customer order tracking.
-- Create staff users in Authentication > Users, then set app_metadata.role to
-- exactly 'manager' or 'cashier' using a trusted server/admin workflow.
-- Never put a service_role key in the browser.

alter table public.orders
  add column if not exists customer_user_id uuid references auth.users(id);

create index if not exists orders_customer_user_id_idx
  on public.orders (customer_user_id);

alter table public.orders enable row level security;

-- Remove the unsafe compatibility policies.
drop policy if exists "orders_public_read" on public.orders;
drop policy if exists "orders_public_update" on public.orders;
drop policy if exists "orders_public_delete" on public.orders;
drop policy if exists "orders_public_insert" on public.orders;
drop policy if exists "orders_authenticated_all" on public.orders;
drop policy if exists "orders_customer_insert" on public.orders;
drop policy if exists "orders_customer_read" on public.orders;
drop policy if exists "orders_staff_read" on public.orders;
drop policy if exists "orders_staff_update" on public.orders;
drop policy if exists "orders_staff_delete" on public.orders;

-- Customers use Supabase anonymous authentication. They can create only their
-- own order and read only their own order/status.
create policy "orders_customer_insert"
on public.orders for insert
to authenticated
with check (
  customer_user_id = auth.uid()
  and id is not null
  and jsonb_typeof(customer_info) = 'object'
  and jsonb_typeof(items) = 'array'
  and total >= 0
);

create policy "orders_customer_read"
on public.orders for select
to authenticated
using (
  customer_user_id = auth.uid()
  or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('manager', 'cashier')
);

-- Only staff can mutate orders. Customers receive status changes through
-- Realtime but cannot change payment, status, totals, or delete records.
create policy "orders_staff_update"
on public.orders for update
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('manager', 'cashier'))
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('manager', 'cashier'));

create policy "orders_staff_delete"
on public.orders for delete
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'manager');

grant usage on schema public to anon, authenticated;
revoke all on public.orders from anon;
grant insert on public.orders to authenticated;
grant select on public.orders to authenticated;
grant update, delete on public.orders to authenticated;

-- Verify RLS and policy names.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'orders' and c.relkind = 'r';

select policyname, roles, cmd
from pg_policies
where schemaname = 'public' and tablename = 'orders'
order by policyname;
