-- Gönül Pusulası / Faz 3 ilk dilim
-- Kapı soruları, 48 saatlik tanışma başvuruları ve kabulde 96 saatlik ön görüşme.

begin;

create type public.introduction_request_status as enum (
  'pending',
  'accepted',
  'declined',
  'cancelled',
  'expired'
);

create type public.conversation_status as enum (
  'pre_meeting',
  'active',
  'ended'
);

create table public.door_question_catalog (
  code text primary key check (code ~ '^[a-z][a-z0-9_]{2,49}$'),
  prompt text not null check (char_length(btrim(prompt)) between 10 and 240),
  display_order smallint not null unique check (display_order > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.door_question_catalog (code, prompt, display_order) values
  ('meaningful_weekend', 'Senin için gerçekten iyi geçmiş bir hafta sonu nasıl görünür?', 10),
  ('communication_expectation', 'Bir ilişkide günlük iletişimden temel beklentin nedir?', 20),
  ('conflict_repair', 'Bir anlaşmazlıktan sonra yeniden yakınlaşmak için nasıl bir yaklaşım beklersin?', 30),
  ('personal_space', 'Birlikte zaman ile kişisel alan arasındaki dengeyi nasıl kurmak istersin?', 40),
  ('relationship_effort', 'Bir ilişkinin iyi gitmesi için iki tarafın özellikle neye emek vermesi gerektiğini düşünürsün?', 50),
  ('feeling_safe', 'Bir ilişkide kendini güvende ve rahat hissetmeni sağlayan davranışlar nelerdir?', 60),
  ('future_picture', 'Önümüzdeki birkaç yıldaki hayatını nasıl hayal ediyorsun?', 70),
  ('support_style', 'Zor bir gün geçirdiğinde partnerinden nasıl bir destek görmek istersin?', 80),
  ('small_joys', 'Günlük hayatta seni mutlu eden küçük şeyler nelerdir?', 90),
  ('family_social_balance', 'Aile, arkadaşlar ve ilişki arasında nasıl bir denge sana iyi gelir?', 100),
  ('learning_growth', 'Son yıllarda kendinle ilgili öğrendiğin önemli bir şey nedir?', 110),
  ('first_meeting', 'İlk buluşmanın rahat ve anlamlı geçmesi için sence ne önemlidir?', 120);

create table public.user_door_questions (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_code text not null references public.door_question_catalog(code),
  display_order smallint not null check (display_order between 1 and 3),
  created_at timestamptz not null default now(),
  primary key (user_id, question_code),
  unique (user_id, display_order)
);

create table public.introduction_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status public.introduction_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '48 hours'),
  responded_at timestamptz,
  check (sender_id <> recipient_id),
  check (expires_at > created_at)
);

create unique index introduction_requests_one_pending_pair
  on public.introduction_requests (
    least(sender_id, recipient_id),
    greatest(sender_id, recipient_id)
  )
  where status = 'pending';

create index introduction_requests_sender_pending_idx
  on public.introduction_requests (sender_id, expires_at)
  where status = 'pending';

create index introduction_requests_recipient_pending_idx
  on public.introduction_requests (recipient_id, expires_at)
  where status = 'pending';

create table public.introduction_request_answers (
  request_id uuid not null references public.introduction_requests(id) on delete cascade,
  question_code text not null references public.door_question_catalog(code),
  prompt_snapshot text not null check (char_length(btrim(prompt_snapshot)) between 10 and 240),
  answer_text text not null check (char_length(btrim(answer_text)) between 20 and 500),
  display_order smallint not null check (display_order between 1 and 3),
  created_at timestamptz not null default now(),
  primary key (request_id, question_code),
  unique (request_id, display_order)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.introduction_requests(id),
  user_a_id uuid not null references auth.users(id) on delete cascade,
  user_b_id uuid not null references auth.users(id) on delete cascade,
  status public.conversation_status not null default 'pre_meeting',
  started_at timestamptz not null default now(),
  pre_meeting_expires_at timestamptz not null default (now() + interval '96 hours'),
  ended_at timestamptz,
  check (user_a_id < user_b_id),
  check (pre_meeting_expires_at > started_at)
);

create unique index conversations_one_open_pair
  on public.conversations (user_a_id, user_b_id)
  where status in ('pre_meeting', 'active');

create index conversations_user_a_open_idx
  on public.conversations (user_a_id, pre_meeting_expires_at)
  where status in ('pre_meeting', 'active');

create index conversations_user_b_open_idx
  on public.conversations (user_b_id, pre_meeting_expires_at)
  where status in ('pre_meeting', 'active');

create function public.save_my_door_questions(p_question_codes text[])
returns void
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

  if not exists (
    select 1 from public.accounts
    where user_id = v_user_id
      and status = 'active'
      and onboarding_completed_at is not null
  ) then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Etkin ve tamamlanmış profil gerekli.';
  end if;

  if p_question_codes is null
    or cardinality(p_question_codes) <> 3
    or (select count(distinct code) from unnest(p_question_codes) code) <> 3
    or (
      select count(*) from public.door_question_catalog question
      where question.code = any(p_question_codes) and question.is_active
    ) <> 3 then
    raise exception using errcode = 'check_violation', message = 'Tam olarak 3 etkin kapı sorusu seçilmelidir.';
  end if;

  delete from public.user_door_questions where user_id = v_user_id;

  insert into public.user_door_questions (user_id, question_code, display_order)
  select v_user_id, selected.code, selected.ordinality::smallint
  from unnest(p_question_codes) with ordinality selected(code, ordinality);

  insert into public.account_events (actor_user_id, subject_user_id, event_type)
  values (v_user_id, v_user_id, 'door_questions.updated');
end;
$$;

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
  join public.door_question_catalog question
    on question.code = selected.question_code
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

create function public.send_introduction_request(
  p_recipient_id uuid,
  p_answers jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sender_id uuid := auth.uid();
  v_request_id uuid;
  v_item jsonb;
  v_question_code text;
  v_answer_text text;
  v_prompt text;
  v_display_order smallint;
  v_sender_capacity integer;
begin
  if v_sender_id is null then
    raise exception using errcode = 'insufficient_privilege', message = 'Oturum gerekli.';
  end if;
  if p_recipient_id is null or p_recipient_id = v_sender_id then
    raise exception using errcode = 'check_violation', message = 'Geçersiz alıcı.';
  end if;

  perform account.user_id
  from public.accounts account
  where account.user_id in (v_sender_id, p_recipient_id)
  order by account.user_id
  for update;

  update public.introduction_requests request
  set status = 'expired', responded_at = now()
  where request.status = 'pending'
    and request.expires_at <= now()
    and (
      request.sender_id in (v_sender_id, p_recipient_id)
      or request.recipient_id in (v_sender_id, p_recipient_id)
    );

  update public.conversations conversation
  set status = 'ended', ended_at = now()
  where conversation.status = 'pre_meeting'
    and conversation.pre_meeting_expires_at <= now()
    and (
      conversation.user_a_id in (v_sender_id, p_recipient_id)
      or conversation.user_b_id in (v_sender_id, p_recipient_id)
    );

  if not exists (
    select 1 from public.get_my_discovery_candidates(25) candidate
    where candidate.user_id = p_recipient_id
  ) then
    raise exception using errcode = 'check_violation', message = 'Bu kullanıcı şu anda tanışma başvurusuna uygun değil.';
  end if;

  if (select count(*) from public.user_door_questions where user_id = v_sender_id) <> 3
    or (select count(*) from public.user_door_questions where user_id = p_recipient_id) <> 3 then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'İki kullanıcının da üç kapı sorusu hazır olmalıdır.';
  end if;

  if p_answers is null
    or jsonb_typeof(p_answers) <> 'array'
    or jsonb_array_length(p_answers) <> 3
    or (
      select count(distinct item ->> 'questionCode')
      from jsonb_array_elements(p_answers) item
    ) <> 3 then
    raise exception using errcode = 'check_violation', message = 'Üç kapı sorusunun tamamı yanıtlanmalıdır.';
  end if;

  for v_item in select value from jsonb_array_elements(p_answers)
  loop
    v_question_code := v_item ->> 'questionCode';
    v_answer_text := btrim(v_item ->> 'answer');

    if char_length(v_answer_text) not between 20 and 500
      or not exists (
        select 1 from public.user_door_questions selected
        join public.door_question_catalog question on question.code = selected.question_code
        where selected.user_id = p_recipient_id
          and selected.question_code = v_question_code
          and question.is_active
      ) then
      raise exception using errcode = 'check_violation', message = 'Kapı sorusu cevabı geçersiz.';
    end if;
  end loop;

  select
    (select count(*) from public.introduction_requests request
      where request.sender_id = v_sender_id
        and request.status = 'pending'
        and request.expires_at > now())
    +
    (select count(*) from public.conversations conversation
      where conversation.status in ('pre_meeting', 'active')
        and v_sender_id in (conversation.user_a_id, conversation.user_b_id))
  into v_sender_capacity;

  if v_sender_capacity >= 3 then
    raise exception using errcode = 'check_violation', message = 'Aynı anda en fazla 3 bekleyen başvuru veya açık görüşme olabilir.';
  end if;

  if (
    select count(*) from public.introduction_requests request
    where request.recipient_id = p_recipient_id
      and request.status = 'pending'
      and request.expires_at > now()
  ) >= 10 then
    raise exception using errcode = 'check_violation', message = 'Adayın bekleyen başvuru kapasitesi dolu.';
  end if;

  if exists (
    select 1 from public.introduction_requests request
    where request.status = 'pending'
      and request.expires_at > now()
      and least(request.sender_id, request.recipient_id) = least(v_sender_id, p_recipient_id)
      and greatest(request.sender_id, request.recipient_id) = greatest(v_sender_id, p_recipient_id)
  ) or exists (
    select 1 from public.conversations conversation
    where conversation.status in ('pre_meeting', 'active')
      and conversation.user_a_id = least(v_sender_id, p_recipient_id)
      and conversation.user_b_id = greatest(v_sender_id, p_recipient_id)
  ) then
    raise exception using errcode = 'unique_violation', message = 'Bu kişiyle zaten bekleyen başvurunuz veya açık görüşmeniz var.';
  end if;

  insert into public.introduction_requests (sender_id, recipient_id)
  values (v_sender_id, p_recipient_id)
  returning id into v_request_id;

  for v_item in select value from jsonb_array_elements(p_answers)
  loop
    v_question_code := v_item ->> 'questionCode';
    v_answer_text := btrim(v_item ->> 'answer');

    select question.prompt, selected.display_order
    into v_prompt, v_display_order
    from public.user_door_questions selected
    join public.door_question_catalog question on question.code = selected.question_code
    where selected.user_id = p_recipient_id
      and selected.question_code = v_question_code;

    insert into public.introduction_request_answers (
      request_id, question_code, prompt_snapshot, answer_text, display_order
    ) values (
      v_request_id, v_question_code, v_prompt, v_answer_text, v_display_order
    );
  end loop;

  insert into public.account_events (actor_user_id, subject_user_id, event_type, metadata)
  values (
    v_sender_id,
    p_recipient_id,
    'introduction.request_sent',
    jsonb_build_object('request_id', v_request_id)
  );

  return v_request_id;
end;
$$;

create function public.respond_to_introduction_request(
  p_request_id uuid,
  p_action text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.introduction_requests%rowtype;
  v_conversation_id uuid;
  v_recipient_capacity integer;
begin
  if v_user_id is null then
    raise exception using errcode = 'insufficient_privilege', message = 'Oturum gerekli.';
  end if;
  if p_action not in ('accept', 'decline', 'cancel') then
    raise exception using errcode = 'check_violation', message = 'Geçersiz işlem.';
  end if;

  select * into v_request
  from public.introduction_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception using errcode = 'no_data_found', message = 'Başvuru bulunamadı.';
  end if;

  if v_request.status = 'pending' and v_request.expires_at <= now() then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Başvurunun süresi doldu.';
  end if;

  if v_request.status <> 'pending' then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Başvuru artık beklemede değil.';
  end if;

  if p_action = 'cancel' then
    if v_request.sender_id <> v_user_id then
      raise exception using errcode = 'insufficient_privilege', message = 'Bu başvuruyu iptal edemezsiniz.';
    end if;
    update public.introduction_requests
    set status = 'cancelled', responded_at = now()
    where id = p_request_id;
    insert into public.account_events (actor_user_id, subject_user_id, event_type, metadata)
    values (
      v_user_id,
      v_request.recipient_id,
      'introduction.request_cancelled',
      jsonb_build_object('request_id', p_request_id)
    );
    return null;
  end if;

  if v_request.recipient_id <> v_user_id then
    raise exception using errcode = 'insufficient_privilege', message = 'Bu başvuruyu yanıtlayamazsınız.';
  end if;

  if p_action = 'decline' then
    update public.introduction_requests
    set status = 'declined', responded_at = now()
    where id = p_request_id;
    insert into public.account_events (actor_user_id, subject_user_id, event_type, metadata)
    values (
      v_user_id,
      v_request.sender_id,
      'introduction.request_declined',
      jsonb_build_object('request_id', p_request_id)
    );
    return null;
  end if;

  perform account.user_id
  from public.accounts account
  where account.user_id in (v_request.sender_id, v_request.recipient_id)
  order by account.user_id
  for update;

  update public.conversations conversation
  set status = 'ended', ended_at = now()
  where conversation.status = 'pre_meeting'
    and conversation.pre_meeting_expires_at <= now()
    and (
      conversation.user_a_id in (v_request.sender_id, v_request.recipient_id)
      or conversation.user_b_id in (v_request.sender_id, v_request.recipient_id)
    );

  if exists (
    select 1 from public.accounts account
    where account.user_id in (v_request.sender_id, v_request.recipient_id)
      and (account.status <> 'active' or account.onboarding_completed_at is null)
  ) then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'İki hesabın da etkin olması gerekir.';
  end if;

  select
    (select count(*) from public.introduction_requests request
      where request.sender_id = v_request.recipient_id
        and request.status = 'pending'
        and request.expires_at > now())
    +
    (select count(*) from public.conversations conversation
      where conversation.status in ('pre_meeting', 'active')
        and v_request.recipient_id in (conversation.user_a_id, conversation.user_b_id))
  into v_recipient_capacity;

  if v_recipient_capacity >= 3 then
    raise exception using errcode = 'check_violation', message = 'Açık görüşme kapasiteniz dolu.';
  end if;

  if exists (
    select 1 from public.conversations conversation
    where conversation.status in ('pre_meeting', 'active')
      and conversation.user_a_id = least(v_request.sender_id, v_request.recipient_id)
      and conversation.user_b_id = greatest(v_request.sender_id, v_request.recipient_id)
  ) then
    raise exception using errcode = 'unique_violation', message = 'Bu kişiyle zaten açık görüşme var.';
  end if;

  update public.introduction_requests
  set status = 'accepted', responded_at = now()
  where id = p_request_id;

  insert into public.conversations (request_id, user_a_id, user_b_id)
  values (
    p_request_id,
    least(v_request.sender_id, v_request.recipient_id),
    greatest(v_request.sender_id, v_request.recipient_id)
  )
  returning id into v_conversation_id;

  insert into public.account_events (actor_user_id, subject_user_id, event_type, metadata)
  values (
    v_user_id,
    v_request.sender_id,
    'introduction.request_accepted',
    jsonb_build_object(
      'request_id', p_request_id,
      'conversation_id', v_conversation_id
    )
  );

  return v_conversation_id;
end;
$$;

create function public.get_my_introduction_requests()
returns table (
  request_id uuid,
  direction text,
  status text,
  other_user_id uuid,
  other_display_name text,
  created_at timestamptz,
  expires_at timestamptz,
  answers jsonb,
  conversation_id uuid,
  pre_meeting_expires_at timestamptz
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

  update public.introduction_requests request
  set status = 'expired', responded_at = now()
  where request.status = 'pending'
    and request.expires_at <= now()
    and v_user_id in (request.sender_id, request.recipient_id);

  update public.conversations conversation
  set status = 'ended', ended_at = now()
  where conversation.status = 'pre_meeting'
    and conversation.pre_meeting_expires_at <= now()
    and v_user_id in (conversation.user_a_id, conversation.user_b_id);

  return query
  select
    request.id,
    case when request.sender_id = v_user_id then 'outgoing' else 'incoming' end,
    request.status::text,
    other_profile.user_id,
    other_profile.display_name,
    request.created_at,
    request.expires_at,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'questionCode', answer.question_code,
            'prompt', answer.prompt_snapshot,
            'answer', answer.answer_text,
            'displayOrder', answer.display_order
          ) order by answer.display_order
        )
        from public.introduction_request_answers answer
        where answer.request_id = request.id
      ),
      '[]'::jsonb
    ),
    conversation.id,
    conversation.pre_meeting_expires_at
  from public.introduction_requests request
  join public.profiles other_profile
    on other_profile.user_id = case
      when request.sender_id = v_user_id then request.recipient_id
      else request.sender_id
    end
  left join public.conversations conversation on conversation.request_id = request.id
  where v_user_id in (request.sender_id, request.recipient_id)
  order by request.created_at desc;
end;
$$;

alter table public.door_question_catalog enable row level security;
alter table public.user_door_questions enable row level security;
alter table public.introduction_requests enable row level security;
alter table public.introduction_request_answers enable row level security;
alter table public.conversations enable row level security;

create policy door_question_catalog_read_active
on public.door_question_catalog for select to authenticated
using (is_active);

create policy user_door_questions_read_own
on public.user_door_questions for select to authenticated
using (user_id = auth.uid());

create policy introduction_requests_read_participant
on public.introduction_requests for select to authenticated
using (auth.uid() in (sender_id, recipient_id));

create policy introduction_answers_read_participant
on public.introduction_request_answers for select to authenticated
using (
  exists (
    select 1 from public.introduction_requests request
    where request.id = request_id
      and auth.uid() in (request.sender_id, request.recipient_id)
  )
);

create policy conversations_read_participant
on public.conversations for select to authenticated
using (auth.uid() in (user_a_id, user_b_id));

revoke all on table public.door_question_catalog from anon, authenticated;
revoke all on table public.user_door_questions from anon, authenticated;
revoke all on table public.introduction_requests from anon, authenticated;
revoke all on table public.introduction_request_answers from anon, authenticated;
revoke all on table public.conversations from anon, authenticated;

grant select on table public.door_question_catalog to authenticated;
grant select on table public.user_door_questions to authenticated;
grant select on table public.introduction_requests to authenticated;
grant select on table public.introduction_request_answers to authenticated;
grant select on table public.conversations to authenticated;

revoke execute on function public.save_my_door_questions(text[]) from public, anon;
revoke execute on function public.get_candidate_door_questions(uuid) from public, anon;
revoke execute on function public.send_introduction_request(uuid, jsonb) from public, anon;
revoke execute on function public.respond_to_introduction_request(uuid, text) from public, anon;
revoke execute on function public.get_my_introduction_requests() from public, anon;

grant execute on function public.save_my_door_questions(text[]) to authenticated;
grant execute on function public.get_candidate_door_questions(uuid) to authenticated;
grant execute on function public.send_introduction_request(uuid, jsonb) to authenticated;
grant execute on function public.respond_to_introduction_request(uuid, text) to authenticated;
grant execute on function public.get_my_introduction_requests() to authenticated;

notify pgrst, 'reload schema';

commit;
