-- ZenixMind core conversation schema.
-- Run this as ONE migration in the connected Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  mime_type text,
  storage_path text,
  created_at timestamptz not null default now()
);

create index if not exists conversations_user_updated_idx on public.conversations(user_id, updated_at desc);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index if not exists attachments_conversation_idx on public.attachments(conversation_id);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.attachments enable row level security;

drop policy if exists "Users manage own conversations" on public.conversations;
create policy "Users manage own conversations" on public.conversations
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own messages" on public.messages;
create policy "Users manage own messages" on public.messages
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own attachments" on public.attachments;
create policy "Users manage own attachments" on public.attachments
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
