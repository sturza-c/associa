-- Public bucket for association logos.
-- Run once in Supabase SQL editor.

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

-- Anyone (auth or not) can read logos (the bucket is public).
-- Only authenticated users can upload, and only into a path matching
-- their association(s). Writes go through the admin client server-side
-- so we keep a permissive auth-only policy here as a safety net.

drop policy if exists "logos read public" on storage.objects;
create policy "logos read public" on storage.objects
  for select using (bucket_id = 'logos');

drop policy if exists "logos auth write" on storage.objects;
create policy "logos auth write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos');

drop policy if exists "logos auth update" on storage.objects;
create policy "logos auth update" on storage.objects
  for update to authenticated
  using (bucket_id = 'logos');

drop policy if exists "logos auth delete" on storage.objects;
create policy "logos auth delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos');
