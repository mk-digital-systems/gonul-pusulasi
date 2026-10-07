-- Gönül Pusulası / Faz 3 karşılıklı devam kararı
-- İki tarafın açık onayıyla ön görüşmeyi aktif tanışmaya geçirir.

begin;

create table public.conversation_continue_confirmations (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  confirmed_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create function public.validate_conversation_continue_confirmation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.conversations conversation
    where conversation.id = new.conversation_id
      and new.user_id in (conversation.user_a_id, conversation.user_b_id)
  ) then
    raise exception using errcode = 'check_violation', message = 'Devam onayı görüşmenin katılımcısına ait olmalıdır.';
  end if;

  return new;
end;
$$;

create trigger validate_conversation_continue_confirmation_before_write
before insert or update on public.conversation_continue_confirmations
for each row execute function public.validate_conversation_continue_confirmation();

create function public.block_open_conversation_for_active_user()
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

  return new;
end;
$$;

create trigger block_open_conversation_for_active_user_before_write
before insert or update of status, user_a_id, user_b_id on public.conversations
for each row execute function public.block_open_conversation_for_active_user();

create function public.get_conversation_progress(p_conversation_id uuid)
returns table (
  conversation_id uuid,
  conversation_status text,
  my_confirmed boolean,
  mutual_confirmed boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    conversation.id,
    conversation.status::text,
    exists (
      select 1
      from public.conversation_continue_confirmations confirmation
      where confirmation.conversation_id = conversation.id
        and confirmation.user_id = auth.uid()
    ),
    (
      select count(*) = 2
      from public.conversation_continue_confirmations confirmation
      where confirmation.conversation_id = conversation.id
    )
  from public.conversations conversation
  where conversation.id = p_conversation_id
    and auth.uid() in (conversation.user_a_id, conversation.user_b_id);
$$;

create function public.confirm_conversation_progress(p_conversation_id uuid)
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
    or v_conversation.pre_meeting_expires_at <= now() then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Devam kararı için açık bir ön görüşme gerekli.';
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
  set status = 'ended', ended_at = now()
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
  set status = 'active', ended_at = null
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

-- Aktif tanışması olan kişi keşfe çıkmaz; aktif tanışmadaki kişi aday olarak da gösterilmez.
-- Bekleyen başvuru veya açık görüşme bulunan çiftler tekrar keşifte görünmez.
create or replace function public.get_my_discovery_candidates(p_limit integer default 10)
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
  with active_set as (
    select question_set.id as question_set_id
    from public.compatibility_question_sets question_set
    where question_set.is_active
  ),
  viewer as (
    select
      profile.user_id as viewer_user_id,
      profile.gender as viewer_gender,
      extract(year from age(current_date, profile.date_of_birth))::integer as viewer_age,
      coalesce(
        profile.age_preference_min,
        greatest(30, extract(year from age(current_date, profile.date_of_birth))::integer - 5)
      ) as minimum_age,
      coalesce(
        profile.age_preference_max,
        extract(year from age(current_date, profile.date_of_birth))::integer + 5
      ) as maximum_age
    from public.profiles profile
    join public.accounts account on account.user_id = profile.user_id
    join public.compatibility_profiles compatibility_profile
      on compatibility_profile.user_id = profile.user_id
    join active_set
      on active_set.question_set_id = compatibility_profile.question_set_id
    where profile.user_id = auth.uid()
      and account.status = 'active'
      and account.onboarding_completed_at is not null
      and not exists (
        select 1
        from public.conversations conversation
        where conversation.status = 'active'
          and profile.user_id in (conversation.user_a_id, conversation.user_b_id)
      )
  ),
  candidates as (
    select
      profile.user_id as candidate_user_id,
      profile.display_name as candidate_display_name,
      extract(year from age(current_date, profile.date_of_birth))::integer as candidate_age,
      city.name as candidate_city_name,
      goal.label as candidate_relationship_goal
    from public.profiles profile
    join public.accounts account on account.user_id = profile.user_id
    join public.compatibility_profiles compatibility_profile
      on compatibility_profile.user_id = profile.user_id
    join active_set
      on active_set.question_set_id = compatibility_profile.question_set_id
    join public.cities city on city.id = profile.city_id
    join public.relationship_goals goal on goal.code = profile.relationship_goal_code
    cross join viewer
    where profile.user_id <> viewer.viewer_user_id
      and account.status = 'active'
      and account.onboarding_completed_at is not null
      and profile.birth_date_confirmed_at is not null
      and profile.gender <> viewer.viewer_gender
      and extract(year from age(current_date, profile.date_of_birth))::integer
        between viewer.minimum_age and viewer.maximum_age
      and viewer.viewer_age between
        coalesce(
          profile.age_preference_min,
          greatest(30, extract(year from age(current_date, profile.date_of_birth))::integer - 5)
        )
        and coalesce(
          profile.age_preference_max,
          extract(year from age(current_date, profile.date_of_birth))::integer + 5
        )
      and (select count(*) from public.user_door_questions question where question.user_id = profile.user_id) = 3
      and not exists (
        select 1
        from public.conversations conversation
        where conversation.status = 'active'
          and profile.user_id in (conversation.user_a_id, conversation.user_b_id)
      )
      and (
        select count(*)
        from public.introduction_requests request
        where request.recipient_id = profile.user_id
          and request.status = 'pending'
          and request.expires_at > now()
      ) < 10
      and not exists (
        select 1
        from public.introduction_requests request
        where request.status = 'pending'
          and request.expires_at > now()
          and least(request.sender_id, request.recipient_id) = least(viewer.viewer_user_id, profile.user_id)
          and greatest(request.sender_id, request.recipient_id) = greatest(viewer.viewer_user_id, profile.user_id)
      )
      and not exists (
        select 1
        from public.conversations conversation
        where conversation.status in ('pre_meeting', 'active')
          and conversation.user_a_id = least(viewer.viewer_user_id, profile.user_id)
          and conversation.user_b_id = greatest(viewer.viewer_user_id, profile.user_id)
      )
  ),
  answer_sets as (
    select
      answer.user_id as answer_user_id,
      answer.question_code as answer_question_code,
      answer.answer_option_id,
      answer.importance,
      array_agg(acceptance.option_id order by acceptance.option_id) as accepted_option_ids
    from public.compatibility_answers answer
    join public.compatibility_answer_acceptances acceptance
      on acceptance.user_id = answer.user_id
      and acceptance.question_code = answer.question_code
    group by answer.user_id, answer.question_code, answer.answer_option_id, answer.importance
  ),
  match_rows as (
    select
      candidate.candidate_user_id,
      question.prompt as shared_prompt,
      (
        candidate_answer.answer_option_id = any(viewer_answer.accepted_option_ids)
        and viewer_answer.answer_option_id = any(candidate_answer.accepted_option_ids)
      ) as is_mutual_match,
      greatest(
        case viewer_answer.importance
          when 'very_important' then 4
          when 'important' then 2
          else 1
        end,
        case candidate_answer.importance
          when 'very_important' then 4
          when 'important' then 2
          else 1
        end
      ) as match_weight
    from candidates candidate
    join answer_sets candidate_answer
      on candidate_answer.answer_user_id = candidate.candidate_user_id
    join answer_sets viewer_answer
      on viewer_answer.answer_user_id = auth.uid()
      and viewer_answer.answer_question_code = candidate_answer.answer_question_code
    join public.compatibility_questions question
      on question.code = candidate_answer.answer_question_code
  ),
  scored_candidates as (
    select
      match_row.candidate_user_id,
      sum(case when match_row.is_mutual_match then match_row.match_weight else 0 end)::numeric
        / nullif(sum(match_row.match_weight), 0) as compatibility_score,
      array_agg(
        match_row.shared_prompt
        order by match_row.match_weight desc, match_row.shared_prompt
      ) filter (where match_row.is_mutual_match) as mutual_shared_points
    from match_rows match_row
    group by match_row.candidate_user_id
  )
  select
    candidate.candidate_user_id,
    candidate.candidate_display_name,
    candidate.candidate_age,
    candidate.candidate_city_name,
    candidate.candidate_relationship_goal,
    case
      when scored.compatibility_score >= 0.82 then 'Çok güçlü uyum'
      when scored.compatibility_score >= 0.68 then 'Güçlü uyum'
      else 'Umut verici uyum'
    end,
    coalesce(scored.mutual_shared_points[1:3], array[]::text[])
  from candidates candidate
  join scored_candidates scored on scored.candidate_user_id = candidate.candidate_user_id
  where scored.compatibility_score >= 0.60
  order by scored.compatibility_score desc, candidate.candidate_display_name, candidate.candidate_user_id
  limit greatest(1, least(coalesce(p_limit, 10), 25));
$$;

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
    conversation.status::text,
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

-- Aktif tanışma başladıktan sonra aynı güvenli mesaj kanalı açık kalır.
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
    or (v_conversation.status = 'pre_meeting' and v_conversation.pre_meeting_expires_at <= now()) then
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
    or (v_conversation.status = 'pre_meeting' and v_conversation.pre_meeting_expires_at <= now()) then
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

alter table public.conversation_continue_confirmations enable row level security;

revoke all on table public.conversation_continue_confirmations from anon, authenticated;
revoke execute on function public.validate_conversation_continue_confirmation() from public, anon, authenticated;
revoke execute on function public.block_open_conversation_for_active_user() from public, anon, authenticated;
revoke execute on function public.get_conversation_progress(uuid) from public, anon;
revoke execute on function public.confirm_conversation_progress(uuid) from public, anon;

grant execute on function public.get_conversation_progress(uuid) to authenticated;
grant execute on function public.confirm_conversation_progress(uuid) to authenticated;

notify pgrst, 'reload schema';

commit;
