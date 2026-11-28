create table public.automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  prompt text not null check (char_length(btrim(prompt)) between 1 and 4000),
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'once')),
  cron_expression text,
  run_at text,
  timezone text not null default 'UTC',
  schedule_name text not null,
  schedule_id text,
  enabled boolean not null default true,
  web_search boolean not null default false,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint automations_id_user_id_unique unique (id, user_id)
);

create table public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  queue_message_id text not null unique,
  trigger_type text not null check (trigger_type in ('scheduled', 'manual')),
  status text not null check (status in ('running', 'completed', 'failed')),
  output text,
  error text,
  scheduled_at timestamptz,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now(),
  constraint automation_runs_owner_fkey
    foreign key (automation_id, user_id)
    references public.automations (id, user_id)
    on delete cascade
);

alter table public.automations enable row level security;
alter table public.automation_runs enable row level security;

create policy "Users manage their own automations"
  on public.automations
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users read their own automation runs"
  on public.automation_runs
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.automations to authenticated;
grant select on public.automation_runs to authenticated;

create index automations_owner_enabled_created_idx
  on public.automations (user_id, enabled, created_at desc);

create index automation_runs_owner_automation_created_idx
  on public.automation_runs (user_id, automation_id, created_at desc);
