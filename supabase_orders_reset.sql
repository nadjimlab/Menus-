-- CHENEB TACOS — RESET orders table
-- IMPORTANT: Run the count query first. Continue only if it returns 0.

select count(*) as existing_orders from public.orders;

-- If existing_orders = 0, run the following reset statement,
-- then run the complete supabase_orders.sql file.
-- drop table if exists public.orders cascade;

-- If existing_orders is greater than 0, do NOT drop the table.
-- Export/back up the rows first and ask for a migration tailored to that schema.
