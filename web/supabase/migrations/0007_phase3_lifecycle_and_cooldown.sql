-- Gönül Pusulası / Faz 3 görüşme yaşam döngüsü
-- 96 saatlik mesajlaşma, 24 saatlik karar penceresi ve kontrollü sonlandırma.

begin;

alter table public.conversations
  add column decision_expires_at timestamptz,
  add column activated_at timestamptz,
  add column ended_reason text,
  add column ended_by_user_id uuid references auth.users(id) on delete set null;

update public.conversations
set decision_expires_at = pre_meeting_expires_at + interval '24 hours',
    activated_at = case when status = 'active' then now() else activated_at end;

alter table public.conversations
  alter column decision_expires_at set not null,
  alter column decision_expires_at set default (now() + interval '120 hours'),
  add constraint conversations_decision_after_pre_meeting
    check (decision_expires_at > pre_meeting_expires_at),
  add constraint conversations_ended_reason_allowed
    check (
      ended_reason is null
      or ended_reason in ('pre_meeting_timeout', 'user_ended', 'superseded_by_active_match')
    ),
  add constraint conversations_ended_by_participant
    check (
      ended_by_user_id is null
      or ended_by_user_id in (user_a_id, user_b_id)
    );

create table public.user_match_cooldowns (
  user_id uuid primary key references auth.users(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  reason text not null check (reason in ('active_match_ended')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  check (ends_at > starts_at)
);

create index user_match_cooldowns_active_idx
  on public.user_match_cooldowns (ends_at);

create function public.enforce_conversation_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Eski Faz 3 fonksiyonları 96. saatte görüşmeyi kapatmaya çalışır. Karar
  -- penceresi sürüyorsa bu geçişi bastır; 120. saatte kapanmasına izin ver.
  if old.status = 'pre_meeting'
    and new.status = 'ended'
    and new.ended_reason is null
    and old.pre_meeting_expires_at <= now()
    and old.decision_expires_at > now() then
    return old;
  end if;

  if old.status = 'pre_meeting'
    and new.status = 'ended'
    and new.ended_reason is null
    and old.decision_expires_at <= now() then
    new.ended_reason := 'pre_meeting_timeout';
  end if;

  if new.status = 'active' and old.status is distinct from 'active' then
    new.activated_at := coalesce(new.activated_at, now());
    new.ended_at := null;
    new.ended_reason := null;
    new.ended_by_user_id := null;
  end if;

  if new.status = 'ended' and old.status is distinct from 'ended' then
    new.ended_at := coalesce(new.ended_at, now());
  end if;

  return new;
end;
$$;

create trigger enforce_conversation_lifecycle_before_status
before update of status on public.conversations
for each row execute function public.enforce_conversation_lifecycle();

create or replace function public.block_open_conversation_for_active_user()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('pre_meeting', 'active') and exists (
    select 1
    from public.conversations conversation
    where conversation.id <> new.id
      and conversation.status = 'active'
      and (
        new.user_a_id in (conversation.user_a_id, conversation.user_b_id)
        or new.user_b_id in (conversation.user_a_id, conversation.user_b_id)
      )
  ) then
    raise exception using errcode = 'check_violation', message = 'Aktif tanışması olan kullanıcı yeni görüşme açamaz.';
  end if;

  if new.status in ('pre_meeting', 'active') and exists (
    select 1
    from public.user_match_cooldowns cooldown
    where cooldown.ends_at > now()
      and cooldown.user_id in (new.user_a_id, new.user_b_id)
  ) then
    raise exception using errcode = 'check_violation', message = 'Tanışma sonrası 24 saatlik bekleme sürüyor.';
  end if;

  return new;
end;
$$;

create function public.get_my_match_cooldown()
returns table (
  conversation_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  reason text
)
language sql
stable
security definer
set search_path = ''
as $$
  select cooldown.conversation_id, cooldown.starts_at, cooldown.ends_at, cooldown.reason
  from public.user_match_cooldowns cooldown
  where cooldown.user_id = auth.uid()
    and cooldown.ends_at > now();
$$;

create function public.end_active_conversation(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_cooldown_ends_at timestamptz := now() + interval '24 hours';
begin
  if v_user_id is null then
    raise exception using errcode = 'insufficient_privilege', message = 'Oturum gerekli.';
  end if;

  select * into v_conversation
  from public.conversations conversation
  where conversation.id = p_conversation_id
  for update;

  if not found
    or v_user_id not in (v_conversation.user_a_id, v_conversation.user_b_id) then
    raise exception using errcode = 'insufficient_privilege', message = 'Bu tanışmayı sonlandıramazsınız.';
  end if;

  if v_conversation.status <> 'active' then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Yalnızca aktif tanışma sonlandırılabilir.';
  end if;

  update public.conversations
  set status = 'ended',
      ended_at = now(),
      ended_reason = 'user_ended',
      ended_by_user_id = v_user_id
  where id = p_conversation_id;

  insert into public.user_match_cooldowns (
    user_id, conversation_id, reason, starts_at, ends_at
  ) values
    (
      v_conversation.user_a_id,
      p_conversation_id,
      'active_match_ended',
      now(),
      v_cooldown_ends_at
    ),
    (
      v_conversation.user_b_id,
      p_conversation_id,
      'active_match_ended',
      now(),
      v_cooldown_ends_at
    )
  on conflict (user_id) do update
  set conversation_id = excluded.conversation_id,
      reason = excluded.reason,
      starts_at = excluded.starts_at,
      ends_at = greatest(public.user_match_cooldowns.ends_at, excluded.ends_at);

  insert into public.account_events (actor_user_id, subject_user_id, event_type, metadata)
  values
    (
      v_user_id,
      v_conversation.user_a_id,
      'conversation.ended_by_user',
      jsonb_build_object('conversation_id', p_conversation_id, 'cooldown_ends_at', v_cooldown_ends_at)
    ),
    (
      v_user_id,
      v_conversation.user_b_id,
      'conversation.ended_by_user',
      jsonb_build_object('conversation_id', p_conversation_id, 'cooldown_ends_at', v_cooldown_ends_at)
    );
end;
$$;

create function public.block_introduction_request_for_unavailable_user()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'pending' and exists (
    select 1
    from public.conversations conversation
    where conversation.status = 'active'
      and (
        new.sender_id in (conversation.user_a_id, conversation.user_b_id)
        or new.recipient_id in (conversation.user_a_id, conversation.user_b_id)
      )
  ) then
    raise exception using errcode = 'check_violation', message = 'Aktif tanışması olan kullanıcı yeni başvuru açamaz.';
  end if;

  if new.status = 'pending' and exists (
    select 1
    from public.user_match_cooldowns cooldown
    where cooldown.ends_at > now()
      and cooldown.user_id in (new.sender_id, new.recipient_id)
  ) then
    raise exception using errcode = 'check_violation', message = 'Tanışma sonrası 24 saatlik bekleme sürüyor.';
  end if;

  return new;
end;
$$;

create trigger block_introduction_request_for_unavailable_user_before_write
before insert or update of status, sender_id, recipient_id on public.introduction_requests
for each row execute function public.block_introduction_request_for_unavailable_user();

alter table public.user_match_cooldowns enable row level security;

create policy user_match_cooldowns_read_own
on public.user_match_cooldowns for select to authenticated
using (user_id = auth.uid());

revoke all on table public.user_match_cooldowns from anon, authenticated;
grant select on table public.user_match_cooldowns to authenticated;

revoke execute on function public.enforce_conversation_lifecycle() from public, anon, authenticated;
revoke execute on function public.block_introduction_request_for_unavailable_user() from public, anon, authenticated;
revoke execute on function public.get_my_match_cooldown() from public, anon;
revoke execute on function public.end_active_conversation(uuid) from public, anon;

grant execute on function public.get_my_match_cooldown() to authenticated;
grant execute on function public.end_active_conversation(uuid) to authenticated;

-- Function overrides and grants continue below.

create or replace function public.get_my_conversations()
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
    case
      when conversation.status = 'pre_meeting'
        and conversation.pre_meeting_expires_at <= now()
        and conversation.decision_expires_at > now()
        then 'decision_window'
      else conversation.status::text
    end,
    conversation.started_at,
    conversation.pre_meeting_expires_at,
    conversation.ended_at,
    case
      when conversation.status not in ('pre_meeting', 'active') or last_message.body is null then null
      when char_length(last_message.body) <= 120 then last_message.body
      else left(last_message.body, 117) || '...'
    end,
    case
      when conversation.status in ('pre_meeting', 'active') then last_message.created_at
      else null
    end,
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

create or replace function public.get_conversation_details(p_conversation_id uuid)
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
    case
      when conversation.status = 'pre_meeting'
        and conversation.pre_meeting_expires_at <= now()
        and conversation.decision_expires_at > now()
        then 'decision_window'
      else conversation.status::text
    end,
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

create or replace function public.get_conversation_progress(p_conversation_id uuid)
returns table (
  conversation_id uuid,
  conversation_status text,
  my_confirmed boolean,
  mutual_confirmed boolean
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
    case
      when conversation.status = 'pre_meeting'
        and conversation.pre_meeting_expires_at <= now()
        and conversation.decision_expires_at > now()
        then 'decision_window'
      else conversation.status::text
    end,
    exists (
      select 1
      from public.conversation_continue_confirmations confirmation
      where confirmation.conversation_id = conversation.id
        and confirmation.user_id = v_user_id
    ),
    (
      select count(*) = 2
      from public.conversation_continue_confirmations confirmation
      where confirmation.conversation_id = conversation.id
    )
  from public.conversations conversation
  where conversation.id = p_conversation_id
    and v_user_id in (conversation.user_a_id, conversation.user_b_id);
end;
$$;

create or replace function public.get_conversation_messages(
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

  if v_conversation.status = 'ended'
    or (
      v_conversation.status = 'pre_meeting'
      and v_conversation.decision_expires_at <= now()
    ) then
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

create or replace function public.send_conversation_message(
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

  if v_conversation.status = 'ended'
    or (
      v_conversation.status = 'pre_meeting'
      and v_conversation.pre_meeting_expires_at <= now()
    ) then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Görüşme mesajlaşmaya kapalı.';
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

create or replace function public.confirm_conversation_progress(p_conversation_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_other_user_id uuid;
  v_confirmation_count integer;
  v_closed_request record;
begin
  if v_user_id is null then
    raise exception using errcode = 'insufficient_privilege', message = 'Oturum gerekli.';
  end if;

  select * into v_conversation
  from public.conversations conversation
  where conversation.id = p_conversation_id
  for update;

  if not found
    or v_user_id not in (v_conversation.user_a_id, v_conversation.user_b_id) then
    raise exception using errcode = 'insufficient_privilege', message = 'Bu görüşme için karar veremezsiniz.';
  end if;

  if v_conversation.status = 'active' then
    return 'active';
  end if;

  if v_conversation.status <> 'pre_meeting'
    or v_conversation.decision_expires_at <= now() then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Devam kararı için açık bir karar penceresi gerekli.';
  end if;

  v_other_user_id := case
    when v_conversation.user_a_id = v_user_id then v_conversation.user_b_id
    else v_conversation.user_a_id
  end;

  insert into public.conversation_continue_confirmations (conversation_id, user_id)
  values (p_conversation_id, v_user_id)
  on conflict (conversation_id, user_id) do nothing;

  if found then
    insert into public.account_events (actor_user_id, subject_user_id, event_type, metadata)
    values (
      v_user_id,
      v_other_user_id,
      'conversation.continue_confirmed',
      jsonb_build_object('conversation_id', p_conversation_id)
    );
  end if;

  select count(*) into v_confirmation_count
  from public.conversation_continue_confirmations confirmation
  where confirmation.conversation_id = p_conversation_id;

  if v_confirmation_count < 2 then
    return 'pre_meeting';
  end if;

  perform account.user_id
  from public.accounts account
  where account.user_id in (v_conversation.user_a_id, v_conversation.user_b_id)
  order by account.user_id
  for update;

  if exists (
    select 1
    from public.accounts account
    where account.user_id in (v_conversation.user_a_id, v_conversation.user_b_id)
      and (account.status <> 'active' or account.onboarding_completed_at is null)
  ) then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'İki hesabın da etkin olması gerekir.';
  end if;

  if exists (
    select 1
    from public.conversations conversation
    where conversation.id <> p_conversation_id
      and conversation.status = 'active'
      and (
        v_conversation.user_a_id in (conversation.user_a_id, conversation.user_b_id)
        or v_conversation.user_b_id in (conversation.user_a_id, conversation.user_b_id)
      )
  ) then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Kullanıcılardan birinin zaten aktif tanışması var.';
  end if;

  update public.conversations conversation
  set status = 'ended',
      ended_at = now(),
      ended_reason = 'superseded_by_active_match'
  where conversation.id <> p_conversation_id
    and conversation.status = 'pre_meeting'
    and (
      v_conversation.user_a_id in (conversation.user_a_id, conversation.user_b_id)
      or v_conversation.user_b_id in (conversation.user_a_id, conversation.user_b_id)
    );

  for v_closed_request in
    update public.introduction_requests request
    set status = 'expired', responded_at = now()
    where request.status = 'pending'
      and (
        v_conversation.user_a_id in (request.sender_id, request.recipient_id)
        or v_conversation.user_b_id in (request.sender_id, request.recipient_id)
      )
    returning request.id, request.sender_id, request.recipient_id
  loop
    insert into public.account_events (subject_user_id, event_type, metadata)
    values
      (
        v_closed_request.sender_id,
        'introduction.closed_for_active_match',
        jsonb_build_object('request_id', v_closed_request.id, 'conversation_id', p_conversation_id)
      ),
      (
        v_closed_request.recipient_id,
        'introduction.closed_for_active_match',
        jsonb_build_object('request_id', v_closed_request.id, 'conversation_id', p_conversation_id)
      );
  end loop;

  update public.conversations
  set status = 'active',
      activated_at = now(),
      ended_at = null,
      ended_reason = null,
      ended_by_user_id = null
  where id = p_conversation_id;

  insert into public.account_events (subject_user_id, event_type, metadata)
  values
    (
      v_conversation.user_a_id,
      'conversation.activated',
      jsonb_build_object('conversation_id', p_conversation_id, 'other_user_id', v_conversation.user_b_id)
    ),
    (
      v_conversation.user_b_id,
      'conversation.activated',
      jsonb_build_object('conversation_id', p_conversation_id, 'other_user_id', v_conversation.user_a_id)
    );

  return 'active';
end;
$$;

-- 0006 keşif fonksiyonunu iç uygulama ayrıntısı olarak sakla; yeni dış RPC
-- hem görüntüleyenin hem adayın 24 saatlik bekleme durumunu uygular.
alter function public.get_my_discovery_candidates(integer)
  rename to get_discovery_candidates_before_cooldown;

revoke execute on function public.get_discovery_candidates_before_cooldown(integer)
  from public, anon, authenticated;

create function public.get_my_discovery_candidates(p_limit integer default 10)
returns table (
  user_id uuid,
  display_name text,
  age integer,
  city_name text,
  relationship_goal text,
  compatibility_band text,
  shared_points text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    candidate.user_id,
    candidate.display_name,
    candidate.age,
    candidate.city_name,
    candidate.relationship_goal,
    candidate.compatibility_band,
    candidate.shared_points
  from public.get_discovery_candidates_before_cooldown(p_limit) candidate
  where auth.uid() is not null
    and not exists (
      select 1
      from public.user_match_cooldowns cooldown
      where cooldown.user_id = auth.uid()
        and cooldown.ends_at > now()
    )
    and not exists (
      select 1
      from public.user_match_cooldowns cooldown
      where cooldown.user_id = candidate.user_id
        and cooldown.ends_at > now()
    );
$$;

revoke execute on function public.get_my_discovery_candidates(integer) from public, anon;
grant execute on function public.get_my_discovery_candidates(integer) to authenticated;

-- Canlı projedeki önceki OUT kolon metadata'sı farklı olabilir. PostgreSQL
-- CREATE OR REPLACE ile OUT satır tipini değiştirmediği için güvenle yeniden oluştur.
drop function public.get_candidate_door_questions(uuid);

create function public.get_candidate_door_questions(p_candidate_id uuid)
returns table (
  candidate_display_name text,
  question_code text,
  prompt text,
  display_order smallint
)
language sql
stable
security definer
set search_path = ''
as $$
  select profile.display_name, selected.question_code, question.prompt, selected.display_order
  from public.user_door_questions selected
  join public.profiles profile on profile.user_id = selected.user_id
  join public.door_question_catalog question on question.code = selected.question_code
  where selected.user_id = p_candidate_id
    and question.is_active
    and auth.uid() is not null
    and exists (
      select 1
      from public.get_my_discovery_candidates(25) candidate
      where candidate.user_id = p_candidate_id
    )
  order by selected.display_order;
$$;

revoke execute on function public.get_candidate_door_questions(uuid) from public, anon;
grant execute on function public.get_candidate_door_questions(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
