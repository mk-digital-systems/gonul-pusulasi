-- Gönül Pusulası / Faz 3 ön görüşme mesajlaşması
-- Kabul edilen tanışma başvurularına ait 96 saatlik, katılımcıya özel mesaj akışı.

begin;

create table public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index conversation_messages_conversation_created_idx
  on public.conversation_messages (conversation_id, created_at, id);

create function public.validate_conversation_message_sender()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.conversations conversation
    where conversation.id = new.conversation_id
      and new.sender_id in (conversation.user_a_id, conversation.user_b_id)
  ) then
    raise exception using errcode = 'check_violation', message = 'Mesaj gönderen görüşmenin katılımcısı olmalıdır.';
  end if;

  return new;
end;
$$;

create trigger validate_conversation_message_sender_before_write
before insert or update on public.conversation_messages
for each row execute function public.validate_conversation_message_sender();

create function public.log_conversation_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.account_events (subject_user_id, event_type, metadata)
    values
      (
        new.user_a_id,
        'conversation.status_changed',
        jsonb_build_object(
          'conversation_id', new.id,
          'from', old.status,
          'to', new.status
        )
      ),
      (
        new.user_b_id,
        'conversation.status_changed',
        jsonb_build_object(
          'conversation_id', new.id,
          'from', old.status,
          'to', new.status
        )
      );
  end if;

  return new;
end;
$$;

create trigger log_conversation_status_change_after_update
after update of status on public.conversations
for each row execute function public.log_conversation_status_change();

create function public.get_my_conversations()
returns table (
  conversation_id uuid,
  other_user_id uuid,
  other_display_name text,
  conversation_status text,
  started_at timestamptz,
  pre_meeting_expires_at timestamptz,
  ended_at timestamptz,
  last_message_preview text,
  last_message_at timestamptz,
  message_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using errcode = 'insufficient_privilege', message = 'Oturum gerekli.';
  end if;

  update public.conversations conversation
  set status = 'ended', ended_at = now()
  where conversation.status = 'pre_meeting'
    and conversation.pre_meeting_expires_at <= now()
    and v_user_id in (conversation.user_a_id, conversation.user_b_id);

  return query
  select
    conversation.id,
    other_profile.user_id,
    other_profile.display_name,
    conversation.status::text,
    conversation.started_at,
    conversation.pre_meeting_expires_at,
    conversation.ended_at,
    case
      when conversation.status <> 'pre_meeting' or last_message.body is null then null
      when char_length(last_message.body) <= 120 then last_message.body
      else left(last_message.body, 117) || '...'
    end,
    case when conversation.status = 'pre_meeting' then last_message.created_at else null end,
    coalesce(message_totals.message_count, 0)::bigint
  from public.conversations conversation
  join public.profiles other_profile
    on other_profile.user_id = case
      when conversation.user_a_id = v_user_id then conversation.user_b_id
      else conversation.user_a_id
    end
  left join lateral (
    select message.body, message.created_at
    from public.conversation_messages message
    where message.conversation_id = conversation.id
    order by message.created_at desc, message.id desc
    limit 1
  ) last_message on true
  left join lateral (
    select count(*) as message_count
    from public.conversation_messages message
    where message.conversation_id = conversation.id
  ) message_totals on true
  where v_user_id in (conversation.user_a_id, conversation.user_b_id)
  order by coalesce(last_message.created_at, conversation.started_at) desc;
end;
$$;

create function public.get_conversation_details(p_conversation_id uuid)
returns table (
  conversation_id uuid,
  other_user_id uuid,
  other_display_name text,
  conversation_status text,
  started_at timestamptz,
  pre_meeting_expires_at timestamptz,
  ended_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using errcode = 'insufficient_privilege', message = 'Oturum gerekli.';
  end if;

  update public.conversations conversation
  set status = 'ended', ended_at = now()
  where conversation.id = p_conversation_id
    and conversation.status = 'pre_meeting'
    and conversation.pre_meeting_expires_at <= now()
    and v_user_id in (conversation.user_a_id, conversation.user_b_id);

  return query
  select
    conversation.id,
    other_profile.user_id,
    other_profile.display_name,
    conversation.status::text,
    conversation.started_at,
    conversation.pre_meeting_expires_at,
    conversation.ended_at
  from public.conversations conversation
  join public.profiles other_profile
    on other_profile.user_id = case
      when conversation.user_a_id = v_user_id then conversation.user_b_id
      else conversation.user_a_id
    end
  where conversation.id = p_conversation_id
    and v_user_id in (conversation.user_a_id, conversation.user_b_id);
end;
$$;

create function public.get_conversation_messages(
  p_conversation_id uuid,
  p_limit integer default 100
)
returns table (
  message_id uuid,
  sender_id uuid,
  body text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation public.conversations%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode = 'insufficient_privilege', message = 'Oturum gerekli.';
  end if;

  select * into v_conversation
  from public.conversations conversation
  where conversation.id = p_conversation_id
    and v_user_id in (conversation.user_a_id, conversation.user_b_id);

  if not found then
    raise exception using errcode = 'insufficient_privilege', message = 'Bu görüşmeye erişemezsiniz.';
  end if;

  if v_conversation.status <> 'pre_meeting'
    or v_conversation.pre_meeting_expires_at <= now() then
    return;
  end if;

  return query
  select selected.id, selected.sender_id, selected.body, selected.created_at
  from (
    select message.id, message.sender_id, message.body, message.created_at
    from public.conversation_messages message
    where message.conversation_id = p_conversation_id
    order by message.created_at desc, message.id desc
    limit greatest(1, least(coalesce(p_limit, 100), 200))
  ) selected
  order by selected.created_at, selected.id;
end;
$$;

create function public.send_conversation_message(
  p_conversation_id uuid,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_body text := btrim(p_body);
  v_message_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = 'insufficient_privilege', message = 'Oturum gerekli.';
  end if;

  if v_body is null or char_length(v_body) not between 1 and 2000 then
    raise exception using errcode = 'check_violation', message = 'Mesaj 1–2000 karakter olmalıdır.';
  end if;

  select * into v_conversation
  from public.conversations conversation
  where conversation.id = p_conversation_id
  for update;

  if not found
    or v_user_id not in (v_conversation.user_a_id, v_conversation.user_b_id) then
    raise exception using errcode = 'insufficient_privilege', message = 'Bu görüşmeye mesaj gönderemezsiniz.';
  end if;

  if v_conversation.status <> 'pre_meeting'
    or v_conversation.pre_meeting_expires_at <= now() then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Ön görüşme mesajlaşmaya kapalı.';
  end if;

  if exists (
    select 1
    from public.accounts account
    where account.user_id in (v_conversation.user_a_id, v_conversation.user_b_id)
      and account.status <> 'active'
  ) then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'İki hesabın da etkin olması gerekir.';
  end if;

  insert into public.conversation_messages (conversation_id, sender_id, body)
  values (p_conversation_id, v_user_id, v_body)
  returning id into v_message_id;

  return v_message_id;
end;
$$;

alter table public.conversation_messages enable row level security;

-- Mesaj tablosu Data API üzerinden doğrudan okunmaz veya değiştirilemez.
-- Katılımcı kontrolü yapan security-definer RPC'ler tek erişim yüzeyidir.
revoke all on table public.conversation_messages from anon, authenticated;

revoke execute on function public.validate_conversation_message_sender() from public, anon, authenticated;
revoke execute on function public.log_conversation_status_change() from public, anon, authenticated;

revoke execute on function public.get_my_conversations() from public, anon;
revoke execute on function public.get_conversation_details(uuid) from public, anon;
revoke execute on function public.get_conversation_messages(uuid, integer) from public, anon;
revoke execute on function public.send_conversation_message(uuid, text) from public, anon;

grant execute on function public.get_my_conversations() to authenticated;
grant execute on function public.get_conversation_details(uuid) to authenticated;
grant execute on function public.get_conversation_messages(uuid, integer) to authenticated;
grant execute on function public.send_conversation_message(uuid, text) to authenticated;

notify pgrst, 'reload schema';

commit;
