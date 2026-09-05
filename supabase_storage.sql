-- CHENEB TACOS — product image storage
-- Run in Supabase SQL Editor before using the product image uploader.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "product_images_public_read" on storage.objects;
drop policy if exists "product_images_public_upload" on storage.objects;
drop policy if exists "product_images_public_update" on storage.objects;
drop policy if exists "product_images_public_delete" on storage.objects;

-- Public URLs are required to display product photos on the customer menu.
create policy "product_images_public_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'product-images');

-- The current app uses an in-app manager PIN rather than Supabase Auth.
-- Restrict this to authenticated staff after staff accounts are migrated to Auth.
create policy "product_images_public_upload"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'product-images'
  and (storage.extension(name) in ('jpg', 'jpeg', 'png', 'webp'))
);

create policy "product_images_public_update"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

create policy "product_images_public_delete"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'product-images');
