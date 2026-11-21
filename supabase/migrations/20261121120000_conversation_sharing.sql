create table if not exists public.conversation_shares (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  share_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists conversation_shares_user_conversation_idx
  on public.conversation_shares (user_id, conversation_id)
  where revoked_at is null;

alter table public.conversation_shares enable row level security;

grant select, insert, update, delete on public.conversation_shares to authenticated;

drop policy if exists conversation_shares_owner_select on public.conversation_shares;
create policy conversation_shares_owner_select
  on public.conversation_shares for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists conversation_shares_owner_insert on public.conversation_shares;
create policy conversation_shares_owner_insert
  on public.conversation_shares for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists conversation_shares_owner_update on public.conversation_shares;
create policy conversation_shares_owner_update
  on public.conversation_shares for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists conversation_shares_owner_delete on public.conversation_shares;
create policy conversation_shares_owner_delete
  on public.conversation_shares for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.get_shared_conversation(p_share_token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'conversation', jsonb_build_object(
      'title', c.title,
      'model', c.model,
      'created_at', c.created_at
    ),
    'messages', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'role', m.role,
          'content', m.content,
          'created_at', m.created_at
        ) order by m.created_at asc
      )
      from public.messages m
      where m.conversation_id = c.id
        and m.user_id = s.user_id
        and m.role in ('user', 'assistant')
    ), '[]'::jsonb)
  )
  from public.conversation_shares s
  join public.conversations c
    on c.id = s.conversation_id
   and c.user_id = s.user_id
  where s.share_token = p_share_token
    and s.revoked_at is null
  limit 1;
$$;

revoke all on function public.get_shared_conversation(uuid) from public;
grant execute on function public.get_shared_conversation(uuid) to anon, authenticated;
