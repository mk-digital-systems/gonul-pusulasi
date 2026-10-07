-- Gönül Pusulası / Faz 3 çift geçmişi sınırları
-- Kapanan bir görüşmeden sonra aynı çift 72 saat birbirine gösterilmez.
-- Aynı çift ömür boyu en fazla iki görüşme başlatabilir.

begin;

create index conversations_pair_history_idx
  on public.conversations (user_a_id, user_b_id, ended_at desc);

-- Mevcut aktif tanışma ve kullanıcı bekleme kontrollerine çift geçmişi
-- kurallarını ekle. Çift bazlı işlem kilidi eşzamanlı isteklerin sınırı
-- birlikte aşmasını engeller.
create or replace function public.block_open_conversation_for_active_user()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_user_a_id uuid := least(new.user_a_id, new.user_b_id);
  v_user_b_id uuid := greatest(new.user_a_id, new.user_b_id);
begin
  if new.status not in ('pre_meeting', 'active') then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_a_id::text || ':' || v_user_b_id::text, 0)
  );

  if exists (
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

  if exists (
    select 1
    from public.user_match_cooldowns cooldown
    where cooldown.ends_at > now()
      and cooldown.user_id in (new.user_a_id, new.user_b_id)
  ) then
    raise exception using errcode = 'check_violation', message = 'Tanışma sonrası 24 saatlik bekleme sürüyor.';
  end if;

  if (
    select count(*)
    from public.conversations conversation
    where conversation.id <> new.id
      and conversation.user_a_id = v_user_a_id
      and conversation.user_b_id = v_user_b_id
  ) >= 2 then
    raise exception using errcode = 'check_violation', message = 'Aynı iki kullanıcı en fazla iki kez tanışabilir.';
  end if;

  if exists (
    select 1
    from public.conversations conversation
    where conversation.id <> new.id
      and conversation.user_a_id = v_user_a_id
      and conversation.user_b_id = v_user_b_id
      and conversation.status = 'ended'
      and conversation.ended_at > now() - interval '72 hours'
  ) then
    raise exception using errcode = 'check_violation', message = 'Aynı çiftin yeniden tanışması için 72 saat geçmelidir.';
  end if;

  return new;
end;
$$;

create or replace function public.block_introduction_request_for_unavailable_user()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_user_a_id uuid := least(new.sender_id, new.recipient_id);
  v_user_b_id uuid := greatest(new.sender_id, new.recipient_id);
begin
  if new.status <> 'pending' then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_a_id::text || ':' || v_user_b_id::text, 0)
  );

  if exists (
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

  if exists (
    select 1
    from public.user_match_cooldowns cooldown
    where cooldown.ends_at > now()
      and cooldown.user_id in (new.sender_id, new.recipient_id)
  ) then
    raise exception using errcode = 'check_violation', message = 'Tanışma sonrası 24 saatlik bekleme sürüyor.';
  end if;

  if (
    select count(*)
    from public.conversations conversation
    where conversation.user_a_id = v_user_a_id
      and conversation.user_b_id = v_user_b_id
  ) >= 2 then
    raise exception using errcode = 'check_violation', message = 'Aynı iki kullanıcı en fazla iki kez tanışabilir.';
  end if;

  if exists (
    select 1
    from public.conversations conversation
    where conversation.user_a_id = v_user_a_id
      and conversation.user_b_id = v_user_b_id
      and conversation.status = 'ended'
      and conversation.ended_at > now() - interval '72 hours'
  ) then
    raise exception using errcode = 'check_violation', message = 'Aynı çiftin yeniden tanışması için 72 saat geçmelidir.';
  end if;

  return new;
end;
$$;

revoke execute on function public.block_open_conversation_for_active_user()
  from public, anon, authenticated;
revoke execute on function public.block_introduction_request_for_unavailable_user()
  from public, anon, authenticated;

-- 0007 keşif fonksiyonunu iç katman olarak koru; yeni dış RPC çift geçmişini
-- uygular. Bağımlı kapı sorusu RPC'si aşağıda yeni dış fonksiyona bağlanır.
alter function public.get_my_discovery_candidates(integer)
  rename to get_discovery_candidates_before_pair_history;

revoke execute on function public.get_discovery_candidates_before_pair_history(integer)
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
  from public.get_discovery_candidates_before_pair_history(25) candidate
  where auth.uid() is not null
    and (
      select count(*)
      from public.conversations conversation
      where conversation.user_a_id = least(auth.uid(), candidate.user_id)
        and conversation.user_b_id = greatest(auth.uid(), candidate.user_id)
    ) < 2
    and not exists (
      select 1
      from public.conversations conversation
      where conversation.user_a_id = least(auth.uid(), candidate.user_id)
        and conversation.user_b_id = greatest(auth.uid(), candidate.user_id)
        and conversation.status = 'ended'
        and conversation.ended_at > now() - interval '72 hours'
    )
  limit greatest(1, least(coalesce(p_limit, 10), 25));
$$;

revoke execute on function public.get_my_discovery_candidates(integer) from public, anon;
grant execute on function public.get_my_discovery_candidates(integer) to authenticated;

-- ALTER FUNCTION RENAME bağımlı SQL fonksiyonlarını eski OID'ye bağlı tutar.
-- Kapı sorularının da yeni çift-geçmişi filtresini kullanması için yeniden bağla.
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
