-- Gönül Pusulası / Faz 3 aktif tanışma sessizlik takibi
-- Son etkinlikten 3 gün sonra kontrol hatırlatması, 5 gün sonra kullanıcının
-- görüşmeyi "kayboldu" seçeneğiyle kapatabilmesi için güvenli RPC'ler.

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
        'inactivity_ended'
      )
    );

create function public.get_conversation_inactivity(p_conversation_id uuid)
returns table (
  conversation_id uuid,
  last_activity_at timestamptz,
  check_in_due boolean,
  inactivity_action_available boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_last_activity_at timestamptz;
begin
  if v_user_id is null then
    raise exception using errcode = 'insufficient_privilege', message = 'Oturum gerekli.';
  end if;

  select * into v_conversation
  from public.conversations conversation
  where conversation.id = p_conversation_id;

  if not found
    or v_user_id not in (v_conversation.user_a_id, v_conversation.user_b_id) then
    raise exception using errcode = 'insufficient_privilege', message = 'Bu görüşmenin sessizlik durumuna erişemezsiniz.';
  end if;

  select greatest(
    coalesce(max(message.created_at), '-infinity'::timestamptz),
    coalesce(v_conversation.activated_at, v_conversation.started_at)
  )
  into v_last_activity_at
  from public.conversation_messages message
  where message.conversation_id = p_conversation_id;

  return query
  select
    v_conversation.id,
    v_last_activity_at,
    v_conversation.status = 'active'
      and v_last_activity_at <= now() - interval '3 days',
    v_conversation.status = 'active'
      and v_last_activity_at <= now() - interval '5 days';
end;
$$;

create function public.end_inactive_conversation(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_conversation public.conversations%rowtype;
  v_last_activity_at timestamptz;
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
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Yalnızca aktif tanışma sessizlik nedeniyle sonlandırılabilir.';
  end if;

  select greatest(
    coalesce(max(message.created_at), '-infinity'::timestamptz),
    coalesce(v_conversation.activated_at, v_conversation.started_at)
  )
  into v_last_activity_at
  from public.conversation_messages message
  where message.conversation_id = p_conversation_id;

  if v_last_activity_at > now() - interval '5 days' then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Kayboldu seçeneği için son etkinliğin üzerinden 5 gün geçmelidir.';
  end if;

  update public.conversations
  set status = 'ended',
      ended_at = now(),
      ended_reason = 'inactivity_ended',
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
      'conversation.ended_for_inactivity',
      jsonb_build_object(
        'conversation_id', p_conversation_id,
        'last_activity_at', v_last_activity_at,
        'cooldown_ends_at', v_cooldown_ends_at
      )
    ),
    (
      v_user_id,
      v_conversation.user_b_id,
      'conversation.ended_for_inactivity',
      jsonb_build_object(
        'conversation_id', p_conversation_id,
        'last_activity_at', v_last_activity_at,
        'cooldown_ends_at', v_cooldown_ends_at
      )
    );
end;
$$;

revoke execute on function public.get_conversation_inactivity(uuid)
  from public, anon;
revoke execute on function public.end_inactive_conversation(uuid)
  from public, anon;

grant execute on function public.get_conversation_inactivity(uuid)
  to authenticated;
grant execute on function public.end_inactive_conversation(uuid)
  to authenticated;

notify pgrst, 'reload schema';

commit;
