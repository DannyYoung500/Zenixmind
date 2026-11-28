alter table public.projects
  add constraint projects_id_user_id_unique unique (id, user_id);

alter table public.conversations
  add column project_id uuid;

alter table public.conversations
  add constraint conversations_project_owner_fkey
  foreign key (project_id, user_id)
  references public.projects (id, user_id)
  on delete set null (project_id);

create index conversations_owner_project_updated_idx
  on public.conversations (user_id, project_id, updated_at desc);
