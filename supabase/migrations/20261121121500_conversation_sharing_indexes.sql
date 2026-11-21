create unique index if not exists conversation_shares_one_active_per_conversation_idx
  on public.conversation_shares (user_id, conversation_id)
  where revoked_at is null;

create index if not exists conversation_shares_conversation_id_idx
  on public.conversation_shares (conversation_id);

comment on function public.get_shared_conversation(uuid) is
  'Intentionally callable without sign-in: returns only a conversation explicitly published through an unguessable UUID share token.';
