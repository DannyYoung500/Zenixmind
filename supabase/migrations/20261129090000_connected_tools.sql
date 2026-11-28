create table public.user_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('github')),
  provider_user_id text not null,
  provider_username text not null,
  display_name text,
  avatar_url text,
  scopes text[] not null default '{}',
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_integrations_user_provider_unique unique (user_id, provider)
);

create table public.user_integration_secrets (
  integration_id uuid primary key references public.user_integrations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  encrypted_access_token text not null,
  token_type text not null default 'bearer',
  updated_at timestamptz not null default now()
);

create table public.integration_oauth_states (
  state_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('github')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.user_integrations enable row level security;
alter table public.user_integration_secrets enable row level security;
alter table public.integration_oauth_states enable row level security;

create policy "Users read their own connected tools"
  on public.user_integrations
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.user_integrations from anon, authenticated;
grant select on public.user_integrations to authenticated;

revoke all on public.user_integration_secrets from anon, authenticated;
revoke all on public.integration_oauth_states from anon, authenticated;

create index user_integrations_owner_idx on public.user_integrations (user_id, connected_at desc);
create index integration_oauth_states_expiry_idx on public.integration_oauth_states (expires_at);
