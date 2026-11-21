create index if not exists user_sessions_revoked_by_idx
  on public.user_sessions (revoked_by);

drop policy if exists user_sessions_owner_or_self_select on public.user_sessions;
create policy user_sessions_owner_or_self_select
  on public.user_sessions for select to authenticated
  using (
    (select auth.uid()) = user_id
    or lower(coalesce(((select auth.jwt()) ->> 'email'), '')) in (
      'danielngozi924@gmail.com',
      'dannyyoungofficial1@gmail.com',
      'zenixmindai@gmail.com',
      'dannyyoungofficail2@gmail.com'
    )
  );

drop policy if exists user_sessions_self_or_owner_update on public.user_sessions;
create policy user_sessions_self_or_owner_update
  on public.user_sessions for update to authenticated
  using (
    (select auth.uid()) = user_id
    or lower(coalesce(((select auth.jwt()) ->> 'email'), '')) in (
      'danielngozi924@gmail.com',
      'dannyyoungofficial1@gmail.com',
      'zenixmindai@gmail.com',
      'dannyyoungofficail2@gmail.com'
    )
  )
  with check (
    (select auth.uid()) = user_id
    or lower(coalesce(((select auth.jwt()) ->> 'email'), '')) in (
      'danielngozi924@gmail.com',
      'dannyyoungofficial1@gmail.com',
      'zenixmindai@gmail.com',
      'dannyyoungofficail2@gmail.com'
    )
  );
