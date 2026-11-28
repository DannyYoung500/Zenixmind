alter table public.library_items
  add constraint library_items_id_user_id_unique unique (id, user_id);

create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  library_item_id uuid not null,
  created_at timestamptz not null default now(),
  constraint project_files_project_owner_fkey
    foreign key (project_id, user_id)
    references public.projects (id, user_id)
    on delete cascade,
  constraint project_files_library_owner_fkey
    foreign key (library_item_id, user_id)
    references public.library_items (id, user_id)
    on delete cascade,
  constraint project_files_project_item_unique unique (project_id, library_item_id)
);

alter table public.project_files enable row level security;

create policy "Users manage their own project files"
  on public.project_files
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index project_files_owner_project_created_idx
  on public.project_files (user_id, project_id, created_at desc);
