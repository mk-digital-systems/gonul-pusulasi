begin;

create extension if not exists pgtap with schema extensions;
select plan(18);

select has_function(
  'public',
  'get_conversation_inactivity',
  array['uuid'],
  'sessizlik durumunu okuma fonksiyonu var'
);
select has_function(
  'public',
  'end_inactive_conversation',
  array['uuid'],
  'sessiz aktif tanışmayı sonlandırma fonksiyonu var'
);
select is(
  has_function_privilege('authenticated', 'public.get_conversation_inactivity(uuid)', 'execute'),
  true,
  'authenticated rolü kendi görüşmesinin sessizlik durumunu okuyabilir'
);
select is(
  has_function_privilege('anon', 'public.end_inactive_conversation(uuid)', 'execute'),
  false,
  'anon rolü sessizlik nedeniyle görüşme sonlandıramaz'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '90000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'inactive-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '90000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'inactive-b@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '90000000-0000-0000-0000-000000000013', 'authenticated', 'authenticated', 'inactive-c@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '90000000-0000-0000-0000-000000000014', 'authenticated', 'authenticated', 'inactive-d@example.test', '', now(), '{}', '{}', now(), now());

insert into public.introduction_requests (
  id, sender_id, recipient_id, status, responded_at
) values
  ('90000000-0000-4000-8000-000000000021', '90000000-0000-0000-0000-000000000011', '90000000-0000-0000-0000-000000000012', 'accepted', now()),
  ('90000000-0000-4000-8000-000000000022', '90000000-0000-0000-0000-000000000013', '90000000-0000-0000-0000-000000000014', 'accepted', now());

insert into public.conversations (
  id, request_id, user_a_id, user_b_id, status, started_at,
  pre_meeting_expires_at, decision_expires_at, activated_at
) values
  (
    '90000000-0000-4000-8000-000000000031',
    '90000000-0000-4000-8000-000000000021',
    '90000000-0000-0000-0000-000000000011',
    '90000000-0000-0000-0000-000000000012',
    'active', now() - interval '10 days', now() - interval '6 days',
    now() - interval '5 days', now() - interval '6 days'
  ),
  (
    '90000000-0000-4000-8000-000000000032',
    '90000000-0000-4000-8000-000000000022',
    '90000000-0000-0000-0000-000000000013',
    '90000000-0000-0000-0000-000000000014',
    'active', now() - interval '1 day', now() + interval '3 days',
    now() + interval '4 days', now() - interval '1 day'
  );

insert into public.conversation_messages (
  id, conversation_id, sender_id, body, created_at
) values
  (
    '90000000-0000-4000-8000-000000000041',
    '90000000-0000-4000-8000-000000000031',
    '90000000-0000-0000-0000-000000000011',
    'Dört gün önce gönderilmiş test mesajı.',
    now() - interval '4 days'
  ),
  (
    '90000000-0000-4000-8000-000000000042',
    '90000000-0000-4000-8000-000000000032',
    '90000000-0000-0000-0000-000000000013',
    'Yeni gönderilmiş test mesajı.',
    now()
  );

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000011","role":"authenticated"}', true);

select ok(
  (select last_activity_at is not null from public.get_conversation_inactivity('90000000-0000-4000-8000-000000000031')),
  'son etkinlik zamanı hesaplanır'
);
select is(
  (select check_in_due from public.get_conversation_inactivity('90000000-0000-4000-8000-000000000031')),
  true,
  'üç günlük sessizlikte kontrol hatırlatması açılır'
);
select is(
  (select inactivity_action_available from public.get_conversation_inactivity('90000000-0000-4000-8000-000000000031')),
  false,
  'dördüncü günde kayboldu seçeneği henüz açılmaz'
);

reset role;
update public.conversation_messages
set created_at = now() - interval '6 days'
where id = '90000000-0000-4000-8000-000000000041';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000011","role":"authenticated"}', true);
select is(
  (select inactivity_action_available from public.get_conversation_inactivity('90000000-0000-4000-8000-000000000031')),
  true,
  'beş günü aşan sessizlikte kayboldu seçeneği açılır'
);

select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000013","role":"authenticated"}', true);
select throws_ok(
  $$select * from public.get_conversation_inactivity('90000000-0000-4000-8000-000000000031')$$,
  '42501',
  'Bu görüşmenin sessizlik durumuna erişemezsiniz.',
  'katılımcı olmayan kullanıcı sessizlik durumunu okuyamaz'
);
select throws_ok(
  $$select public.end_inactive_conversation('90000000-0000-4000-8000-000000000032')$$,
  '55000',
  'Kayboldu seçeneği için son etkinliğin üzerinden 5 gün geçmelidir.',
  'yakın zamanda mesajlaşan aktif tanışma sessizlik nedeniyle kapatılamaz'
);

select set_config('request.jwt.claims', '{"sub":"90000000-0000-0000-0000-000000000011","role":"authenticated"}', true);
select lives_ok(
  $$select public.end_inactive_conversation('90000000-0000-4000-8000-000000000031')$$,
  'katılımcı beş günlük sessizlikten sonra görüşmeyi kapatabilir'
);
select is(
  (select count(*)::integer from public.get_conversation_inactivity('90000000-0000-4000-8000-000000000031')),
  1,
  'katılımcı kapanan görüşmenin son etkinlik kaydını okuyabilir'
);
select is(
  (select inactivity_action_available from public.get_conversation_inactivity('90000000-0000-4000-8000-000000000031')),
  false,
  'kapanan görüşmede kayboldu seçeneği artık açık değildir'
);

reset role;
select is(
  (select status::text from public.conversations where id = '90000000-0000-4000-8000-000000000031'),
  'ended',
  'sessiz aktif tanışma sona erer'
);
select is(
  (select ended_reason from public.conversations where id = '90000000-0000-4000-8000-000000000031'),
  'inactivity_ended',
  'kapanış nedeni sessizlik olarak kaydedilir'
);
select is(
  (select ended_by_user_id from public.conversations where id = '90000000-0000-4000-8000-000000000031'),
  '90000000-0000-0000-0000-000000000011'::uuid,
  'kapanışı yapan katılımcı kaydedilir'
);
select is(
  (
    select count(*)::integer
    from public.user_match_cooldowns
    where user_id in (
      '90000000-0000-0000-0000-000000000011',
      '90000000-0000-0000-0000-000000000012'
    )
  ),
  2,
  'iki katılımcı için 24 saatlik bekleme başlar'
);
select is(
  (
    select count(*)::integer
    from public.account_events event
    where event.event_type = 'conversation.ended_for_inactivity'
      and event.metadata ->> 'conversation_id' = '90000000-0000-4000-8000-000000000031'
  ),
  2,
  'sessizlik sonlandırması iki katılımcı için denetim kaydına yazılır'
);

select * from finish();
rollback;
