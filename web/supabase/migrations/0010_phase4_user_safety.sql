-- Gönül Pusulası / Faz 4 kullanıcı güvenliği temeli
-- Gizli engelleme, kullanıcı şikâyeti ve tüm etkileşim katmanlarında engel sınırı.
-- Şikâyet kaydı otomatik yaptırım veya hesap durumu değişikliği oluşturmaz.

begin;

alter table public.conversations
  drop constraint conversations_ended_reason_allowed,
  add constraint conversations_ended_reason_allowed
    check (
      ended_reason is null
      or ended_reason in (
        'pre_meeting_timeout',
        'user_ended',
        'superseded_by_active_match',
        'inactivity_ended',
        'user_blocked'
      )
    );

create table public.user_blocks (
  blocker_user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_user_id, blocked_user_id),
  check (blocker_user_id <> blocked_user_id)
);

create index user_blocks_blocked_user_idx
  on public.user_blocks (blocked_user_id, blocker_user_id);

create table public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid references auth.users(id) on delete set null,
  reported_user_id uuid references auth.users(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  category text not null check (
    category in (
      'unwanted_contact',
      'harassment',
      'scam',
      'inappropriate_content',
      'false_information',
      'other'
    )
  ),
  details text check (
    details is null
    or char_length(btrim(details)) between 10 and 1000
  ),
  status text not null default 'pending' check (
    status in ('pending', 'reviewing', 'resolved', 'dismissed')
  ),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check (
    reporter_user_id is null
    or reported_user_id is null
    or reporter_user_id <> reported_user_id
  )
);

create unique index user_reports_one_pending_per_conversation
  on public.user_reports (reporter_user_id, reported_user_id, conversation_id)
  where status in ('pending', 'reviewing')
    and reporter_user_id is not null
    and reported_user_id is not null
    and conversation_id is not null;

create index user_reports_moderation_queue_idx
  on public.user_reports (status, created_at);

create function public.block_introduction_for_blocked_pair()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'pending' and exists (
    select 1
    from public.user_blocks block
    where (block.blocker_user_id = new.sender_id and block.blocked_user_id = new.recipient_id)
       or (block.blocker_user_id = new.recipient_id and block.blocked_user_id = new.sender_id)
  ) then
    raise exception using errcode = 'check_violation', message = 'Engellenmiş kullanıcılar arasında tanışma başvurusu oluşturulamaz.';
  end if;

  return new;
end;
$$;

create trigger block_introduction_for_blocked_pair_before_write
before insert or update of status, sender_id, recipient_id on public.introduction_requests
for each row execute function public.block_introduction_for_blocked_pair();

create function public.block_conversation_for_blocked_pair()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('pre_meeting', 'active') and exists (
    select 1
    from public.user_blocks block
    where (block.blocker_user_id = new.user_a_id and block.blocked_user_id = new.user_b_id)
       or (block.blocker_user_id = new.user_b_id and block.blocked_user_id = new.user_a_id)
  ) then
    raise exception using errcode = 'check_violation', message = 'Engellenmiş kullanıcılar arasında görüşme açılamaz.';
  end if;

  return new;
end;
$$;

create trigger block_conversation_for_blocked_pair_before_write
before insert or update of status, user_a_id, user_b_id on public.conversations
for each row execute function public.block_conversation_for_blocked_pair();

create function public.block_message_for_blocked_pair()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.conversations conversation
    join public.user_blocks block
      on (block.blocker_user_id = conversation.user_a_id and block.blocked_user_id = conversation.user_b_id)
      or (block.blocker_user_id = conversation.user_b_id and block.blocked_user_id = conversation.user_a_id)
    where conversation.id = new.conversation_id
  ) then
    raise exception using errcode = 'check_violation', message = 'Engellenmiş kullanıcılar arasında mesaj gönderilemez.';
  end if;

  return new;
end;
$$;

create trigger block_message_for_blocked_pair_before_write
before insert or update on public.conversation_messages
for each row execute function public.block_message_for_blocked_pair();

create function public.block_user(p_blocked_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_user_a_id uuid;
  v_user_b_id uuid;
  v_inserted boolean := false;
begin
  if v_user_id is null then
    raise exception using errcode = 'insufficient_privilege', message = 'Oturum gerekli.';
  end if;

  if p_blocked_user_id is null or p_blocked_user_id = v_user_id then
    raise exception using errcode = 'check_violation', message = 'Geçersiz engelleme hedefi.';
  end if;

  if not exists (
    select 1 from public.accounts account where account.user_id = p_blocked_user_id
  ) then
    raise exception using errcode = 'foreign_key_violation', message = 'Kullanıcı bulunamadı.';
  end if;

  v_user_a_id := least(v_user_id, p_blocked_user_id);
  v_user_b_id := greatest(v_user_id, p_blocked_user_id);

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_a_id::text || ':' || v_user_b_id::text, 0)
  );

  -- Mesaj gönderimi aynı görüşme satırını kilitlediği için, engelleme tamamlanırken
  -- yeni bir mesajın araya girmesini önlemek üzere açık görüşmeleri önce kilitle.
  perform conversation.id
  from public.conversations conversation
  where conversation.user_a_id = v_user_a_id
    and conversation.user_b_id = v_user_b_id
    and conversation.status in ('pre_meeting', 'active')
  order by conversation.id
  for update;

  insert into public.user_blocks (blocker_user_id, blocked_user_id)
  values (v_user_id, p_blocked_user_id)
  on conflict (blocker_user_id, blocked_user_id) do nothing
  returning true into v_inserted;

  update public.introduction_requests request
  set status = 'expired', responded_at = now()
  where request.status = 'pending'
    and least(request.sender_id, request.recipient_id) = v_user_a_id
    and greatest(request.sender_id, request.recipient_id) = v_user_b_id;

  update public.conversations conversation
  set status = 'ended',
      ended_at = now(),
      ended_reason = 'user_blocked',
      ended_by_user_id = v_user_id
  where conversation.user_a_id = v_user_a_id
    and conversation.user_b_id = v_user_b_id
    and conversation.status in ('pre_meeting', 'active');

  if coalesce(v_inserted, false) then
    insert into public.account_events (actor_user_id, subject_user_id, event_type, metadata)
    values (
      v_user_id,
      v_user_id,
      'safety.user_blocked',
      jsonb_build_object('blocked_user_id', p_blocked_user_id)
    );
  end if;
end;
$$;

create function public.unblock_user(p_blocked_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_deleted boolean := false;
begin
  if v_user_id is null then
    raise exception using errcode = 'insufficient_privilege', message = 'Oturum gerekli.';
  end if;

  delete from public.user_blocks block
  where block.blocker_user_id = v_user_id
    and block.blocked_user_id = p_blocked_user_id
  returning true into v_deleted;

  if coalesce(v_deleted, false) then
    insert into public.account_events (actor_user_id, subject_user_id, event_type, metadata)
    values (
      v_user_id,
      v_user_id,
      'safety.user_unblocked',
      jsonb_build_object('unblocked_user_id', p_blocked_user_id)
    );
  end if;
end;
$$;

create function public.report_user(
  p_reported_user_id uuid,
  p_conversation_id uuid,
  p_category text,
  p_details text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_details text := nullif(btrim(p_details), '');
  v_report_id uuid;
begin
  if v_user_id is null then
    raise exception using errcode = 'insufficient_privilege', message = 'Oturum gerekli.';
  end if;

  if p_reported_user_id is null or p_reported_user_id = v_user_id then
    raise exception using errcode = 'check_violation', message = 'Geçersiz şikâyet hedefi.';
  end if;

  if p_category is null or p_category not in (
    'unwanted_contact',
    'harassment',
    'scam',
    'inappropriate_content',
    'false_information',
    'other'
  ) then
    raise exception using errcode = 'check_violation', message = 'Geçersiz şikâyet kategorisi.';
  end if;

  if v_details is not null and char_length(v_details) not between 10 and 1000 then
    raise exception using errcode = 'check_violation', message = 'Şikâyet açıklaması 10–1000 karakter olmalıdır.';
  end if;

  if not exists (
    select 1
    from public.conversations conversation
    where conversation.id = p_conversation_id
      and v_user_id in (conversation.user_a_id, conversation.user_b_id)
      and p_reported_user_id in (conversation.user_a_id, conversation.user_b_id)
  ) then
    raise exception using errcode = 'insufficient_privilege', message = 'Yalnızca katıldığınız görüşmedeki diğer kullanıcıyı şikâyet edebilirsiniz.';
  end if;

  insert into public.user_reports (
    reporter_user_id,
    reported_user_id,
    conversation_id,
    category,
    details
  ) values (
    v_user_id,
    p_reported_user_id,
    p_conversation_id,
    p_category,
    v_details
  )
  returning id into v_report_id;

  insert into public.account_events (actor_user_id, subject_user_id, event_type, metadata)
  values (
    v_user_id,
    v_user_id,
    'safety.report_created',
    jsonb_build_object(
      'report_id', v_report_id,
      'reported_user_id', p_reported_user_id,
      'conversation_id', p_conversation_id,
      'category', p_category
    )
  );

  return v_report_id;
end;
$$;

create function public.get_my_blocked_users()
returns table (
  blocked_user_id uuid,
  display_name text,
  blocked_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select block.blocked_user_id, profile.display_name, block.created_at
  from public.user_blocks block
  join public.profiles profile on profile.user_id = block.blocked_user_id
  where block.blocker_user_id = auth.uid()
  order by block.created_at desc;
$$;

alter table public.user_blocks enable row level security;
alter table public.user_reports enable row level security;

create policy user_blocks_read_own
on public.user_blocks for select to authenticated
using (blocker_user_id = auth.uid());

create policy user_reports_read_own
on public.user_reports for select to authenticated
using (reporter_user_id = auth.uid());

revoke all on table public.user_blocks from anon, authenticated;
revoke all on table public.user_reports from anon, authenticated;
grant select on table public.user_blocks to authenticated;
grant select on table public.user_reports to authenticated;

revoke execute on function public.block_introduction_for_blocked_pair()
  from public, anon, authenticated;
revoke execute on function public.block_conversation_for_blocked_pair()
  from public, anon, authenticated;
revoke execute on function public.block_message_for_blocked_pair()
  from public, anon, authenticated;
revoke execute on function public.block_user(uuid) from public, anon;
revoke execute on function public.unblock_user(uuid) from public, anon;
revoke execute on function public.report_user(uuid, uuid, text, text) from public, anon;
revoke execute on function public.get_my_blocked_users() from public, anon;

grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.unblock_user(uuid) to authenticated;
grant execute on function public.report_user(uuid, uuid, text, text) to authenticated;
grant execute on function public.get_my_blocked_users() to authenticated;

-- Mevcut keşif sonucuna iki yönlü engelleme filtresi ekle.
alter function public.get_my_discovery_candidates(integer)
  rename to get_discovery_candidates_before_blocks;

revoke execute on function public.get_discovery_candidates_before_blocks(integer)
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
  from public.get_discovery_candidates_before_blocks(25) candidate
  where auth.uid() is not null
    and not exists (
      select 1
      from public.user_blocks block
      where (block.blocker_user_id = auth.uid() and block.blocked_user_id = candidate.user_id)
         or (block.blocker_user_id = candidate.user_id and block.blocked_user_id = auth.uid())
    )
  limit greatest(1, least(coalesce(p_limit, 10), 25));
$$;

revoke execute on function public.get_my_discovery_candidates(integer) from public, anon;
grant execute on function public.get_my_discovery_candidates(integer) to authenticated;

-- SQL fonksiyon bağımlılığını yeni dış keşif RPC'sine yeniden bağla.
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
