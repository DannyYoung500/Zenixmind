alter table public.library_items
  add column if not exists is_favorite boolean not null default false,
  add column if not exists deleted_at timestamptz;

create index if not exists library_items_owner_active_created_idx
  on public.library_items (user_id, created_at desc)
  where deleted_at is null;

create index if not exists library_items_owner_trash_idx
  on public.library_items (user_id, deleted_at desc)
  where deleted_at is not null;

create index if not exists library_items_owner_favorites_idx
  on public.library_items (user_id, created_at desc)
  where is_favorite = true and deleted_at is null;

drop policy if exists library_items_update_own on public.library_items;
create policy library_items_update_own
  on public.library_items
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

update storage.buckets
set public = false,
    file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg','image/png','image/webp','image/gif','image/avif',
      'video/mp4','video/webm','application/pdf',
      'text/plain','text/markdown','text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
where id = 'library';