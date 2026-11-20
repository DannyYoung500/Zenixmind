-- Improve query planning for user-scoped tables without changing data access boundaries.
-- Cache Supabase auth helper results per statement and index frequently filtered FK columns.

create index if not exists attachments_user_id_idx
  on public.attachments (user_id);

create index if not exists library_items_user_id_idx
  on public.library_items (user_id);

create index if not exists messages_user_id_idx
  on public.messages (user_id);

drop policy if exists "Users manage own conversations" on public.conversations;
create policy "Users manage own conversations"
  on public.conversations
  for all
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users manage own messages" on public.messages;
create policy "Users manage own messages"
  on public.messages
  for all
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "Users manage own attachments" on public.attachments;
create policy "Users manage own attachments"
  on public.attachments
  for all
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "library_items_select_own" on public.library_items;
create policy "library_items_select_own"
  on public.library_items
  for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "library_items_insert_own" on public.library_items;
create policy "library_items_insert_own"
  on public.library_items
  for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "library_items_delete_own" on public.library_items;
create policy "library_items_delete_own"
  on public.library_items
  for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists "owners_can_update_ai_models" on public.ai_model_registry;
create policy "owners_can_update_ai_models"
  on public.ai_model_registry
  for update
  to authenticated
  using (
    lower(coalesce(((select auth.jwt()) ->> 'email'), '')) = any (
      array[
        'danielngozi924@gmail.com',
        'dannyyoungofficial1@gmail.com',
        'zenixmindai@gmail.com',
        'dannyyoungofficail2@gmail.com'
      ]::text[]
    )
  )
  with check (
    lower(coalesce(((select auth.jwt()) ->> 'email'), '')) = any (
      array[
        'danielngozi924@gmail.com',
        'dannyyoungofficial1@gmail.com',
        'zenixmindai@gmail.com',
        'dannyyoungofficail2@gmail.com'
      ]::text[]
    )
  );
