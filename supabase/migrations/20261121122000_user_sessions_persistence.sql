create table if not exists public.user_sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text not null,
  user_name text not null default 'User',
  role text not null default 'Free',
  ip_address text,
  user_agent text,
  device_type text,
  browser text,
  os text,
  location text not null default 'Unknown',
  country_code text not null default '',
  started_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  is_current boolean not null default false,
  status text not null default 'active' check (status in ('active', 'revoked', 'suspicious')),
  risk_score integer not null default 5 check (risk_score between 0 and 100),
  risk_flags jsonb not null default '[]'::jsonb,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  revocation_reason text
);

create index if not exists user_sessions_user_last_active_idx
  on public.user_sessions (user_id, last_active_at desc);

create index if not exists user_sessions_status_current_idx
  on public.user_sessions (status, is_current, last_active_at desc);

alter table public.user_sessions enable row level security;
grant select, insert, update on public.user_sessions to authenticated;

drop policy if exists user_sessions_owner_or_self_select on public.user_sessions;
create policy user_sessions_owner_or_self_select
  on public.user_sessions for select to authenticated
  using (
    (select auth.uid()) = user_id
    or lower(coalesce((select auth.jwt() ->> 'email'), '')) in (
      'danielngozi924@gmail.com',
      'dannyyoungofficial1@gmail.com',
      'zenixmindai@gmail.com',
      'dannyyoungofficail2@gmail.com'
    )
  );

drop policy if exists user_sessions_self_insert on public.user_sessions;
create policy user_sessions_self_insert
  on public.user_sessions for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists user_sessions_self_or_owner_update on public.user_sessions;
create policy user_sessions_self_or_owner_update
  on public.user_sessions for update to authenticated
  using (
    (select auth.uid()) = user_id
    or lower(coalesce((select auth.jwt() ->> 'email'), '')) in (
      'danielngozi924@gmail.com',
      'dannyyoungofficial1@gmail.com',
      'zenixmindai@gmail.com',
      'dannyyoungofficail2@gmail.com'
    )
  )
  with check (
    (select auth.uid()) = user_id
    or lower(coalesce((select auth.jwt() ->> 'email'), '')) in (
      'danielngozi924@gmail.com',
      'dannyyoungofficial1@gmail.com',
      'zenixmindai@gmail.com',
      'dannyyoungofficail2@gmail.com'
    )
  );
