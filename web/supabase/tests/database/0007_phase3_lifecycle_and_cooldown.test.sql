begin;

create extension if not exists pgtap with schema extensions;
select plan(27);

select has_table('public', 'user_match_cooldowns', 'tanisma bekleme tablosu var');
select has_function('public', 'get_my_match_cooldown', array[]::text[], 'bekleme durumu fonksiyonu var');
select has_function('public', 'end_active_conversation', array['uuid'], 'aktif tanisma sonlandirma fonksiyonu var');
select has_column('public', 'conversations', 'decision_expires_at', 'karar penceresi bitis kolonu var');
select has_column('public', 'conversations', 'ended_reason', 'gorusme kapanis nedeni kolonu var');
select is(
  (select relrowsecurity from pg_class where oid = 'public.user_match_cooldowns'::regclass),
  true,
  'bekleme tablosunda RLS etkin'
);
select is(
  has_table_privilege('authenticated', 'public.user_match_cooldowns', 'insert'),
  false,
  'authenticated rolu bekleme tablosuna dogrudan yazamaz'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '70000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'lifecycle-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '70000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'lifecycle-b@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '70000000-0000-0000-0000-000000000013', 'authenticated', 'authenticated', 'lifecycle-c@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '70000000-0000-0000-0000-000000000014', 'authenticated', 'authenticated', 'lifecycle-d@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '70000000-0000-0000-0000-000000000015', 'authenticated', 'authenticated', 'lifecycle-e@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '70000000-0000-0000-0000-000000000016', 'authenticated', 'authenticated', 'lifecycle-f@example.test', '', now(), '{}', '{}', now(), now());

update public.accounts
set status = 'active', onboarding_completed_at = now()
where user_id::text like '70000000-%';

update public.profiles
set display_name = case user_id
  when '70000000-0000-0000-0000-000000000011' then 'Ada'
  when '70000000-0000-0000-0000-000000000012' then 'Bora'
  when '70000000-0000-0000-0000-000000000013' then 'Ceren'
  when '70000000-0000-0000-0000-000000000014' then 'Doruk'
  when '70000000-0000-0000-0000-000000000015' then 'Ece'
  else 'Fırat'
end
where user_id::text like '70000000-%';

insert into public.introduction_requests (
  id, sender_id, recipient_id, status, responded_at
) values
  ('70000000-0000-4000-8000-000000000021', '70000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000012', 'accepted', now()),
  ('70000000-0000-4000-8000-000000000022', '70000000-0000-0000-0000-000000000013', '70000000-0000-0000-0000-000000000014', 'accepted', now()),
  ('70000000-0000-4000-8000-000000000023', '70000000-0000-0000-0000-000000000015', '70000000-0000-0000-0000-000000000016', 'accepted', now()),
  ('70000000-0000-4000-8000-000000000024', '70000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000013', 'accepted', now());

insert into public.conversations (
  id, request_id, user_a_id, user_b_id, started_at, pre_meeting_expires_at, decision_expires_at
) values
  (
    '70000000-0000-4000-8000-000000000031',
    '70000000-0000-4000-8000-000000000021',
    '70000000-0000-0000-0000-000000000011',
    '70000000-0000-0000-0000-000000000012',
    now(), now() + interval '96 hours', now() + interval '120 hours'
  ),
  (
    '70000000-0000-4000-8000-000000000032',
    '70000000-0000-4000-8000-000000000022',
    '70000000-0000-0000-0000-000000000013',
    '70000000-0000-0000-0000-000000000014',
    now() - interval '97 hours', now() - interval '1 hour', now() + interval '23 hours'
  ),
  (
    '70000000-0000-4000-8000-000000000033',
    '70000000-0000-4000-8000-000000000023',
    '70000000-0000-0000-0000-000000000015',
    '70000000-0000-0000-0000-000000000016',
    now() - interval '121 hours', now() - interval '25 hours', now() - interval '1 hour'
  );

insert into public.conversation_messages (conversation_id, sender_id, body)
values (
  '70000000-0000-4000-8000-000000000032',
  '70000000-0000-0000-0000-000000000013',
  'Karar penceresinde okunabilen eski mesaj.'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-000000000011","role":"authenticated"}', true);

select is(
  public.confirm_conversation_progress('70000000-0000-4000-8000-000000000031'),
  'pre_meeting',
  'ilk devam onayi on gorusmeyi acik tutar'
);

select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-000000000012","role":"authenticated"}', true);
select is(
  public.confirm_conversation_progress('70000000-0000-4000-8000-000000000031'),
  'active',
  'ikinci devam onayi aktif tanismayi baslatir'
);
select is(
  (select status::text from public.conversations where id = '70000000-0000-4000-8000-000000000031'),
  'active',
  'gorusme aktif durumdadir'
);
select lives_ok(
  $$select public.end_active_conversation('70000000-0000-4000-8000-000000000031')$$,
  'katilimci aktif tanismayi sonlandirir'
);
select is(
  (select status::text from public.conversations where id = '70000000-0000-4000-8000-000000000031'),
  'ended',
  'sonlandirilan aktif tanisma kapanir'
);
select is(
  (select ended_reason from public.conversations where id = '70000000-0000-4000-8000-000000000031'),
  'user_ended',
  'kapanis nedeni kullanici sonlandirmasi olur'
);
select is((select count(*)::integer from public.get_my_match_cooldown()), 1, 'sonlandiran kullanici bekleme durumunu gorur');

reset role;
select is(
  (select count(*)::integer from public.user_match_cooldowns where user_id in ('70000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000012')),
  2,
  'iki katilimci icin 24 saatlik bekleme olusur'
);
select throws_ok(
  $$
    insert into public.introduction_requests (sender_id, recipient_id)
    values ('70000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000014')
  $$,
  '23514',
  'Tanışma sonrası 24 saatlik bekleme sürüyor.',
  'bekleme sirasinda yeni basvuru engellenir'
);
select throws_ok(
  $$
    insert into public.conversations (request_id, user_a_id, user_b_id)
    values (
      '70000000-0000-4000-8000-000000000024',
      '70000000-0000-0000-0000-000000000011',
      '70000000-0000-0000-0000-000000000013'
    )
  $$,
  '23514',
  'Tanışma sonrası 24 saatlik bekleme sürüyor.',
  'bekleme sirasinda yeni gorusme engellenir'
);
select is(
  (
    select count(*)::integer
    from public.account_events event
    where event.event_type = 'conversation.ended_by_user'
      and event.metadata ->> 'conversation_id' = '70000000-0000-4000-8000-000000000031'
  ),
  2,
  'sonlandirma iki katilimci icin denetim kaydina yazilir'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-000000000013","role":"authenticated"}', true);
select is(
  (select conversation_status from public.get_conversation_details('70000000-0000-4000-8000-000000000032')),
  'decision_window',
  '96 saat sonunda 24 saatlik karar penceresi gorunur'
);
select is(
  (select count(*)::integer from public.get_conversation_messages('70000000-0000-4000-8000-000000000032', 100)),
  1,
  'karar penceresinde eski mesajlar salt okunur gorulur'
);
select throws_ok(
  $$select public.send_conversation_message('70000000-0000-4000-8000-000000000032', 'Karar penceresinde gönderilmemeli.')$$,
  '55000',
  'Görüşme mesajlaşmaya kapalı.',
  'karar penceresinde yeni mesaj engellenir'
);
select is(
  public.confirm_conversation_progress('70000000-0000-4000-8000-000000000032'),
  'pre_meeting',
  'karar penceresinde ilk devam onayi kabul edilir'
);

select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-000000000014","role":"authenticated"}', true);
select is(
  public.confirm_conversation_progress('70000000-0000-4000-8000-000000000032'),
  'active',
  'karar penceresinde ikinci onay aktif tanismayi baslatir'
);
select is(
  (select status::text from public.conversations where id = '70000000-0000-4000-8000-000000000032'),
  'active',
  'karar penceresindeki karsilikli onay kalici olur'
);

select set_config('request.jwt.claims', '{"sub":"70000000-0000-0000-0000-000000000015","role":"authenticated"}', true);
select is(
  (select conversation_status from public.get_conversation_details('70000000-0000-4000-8000-000000000033')),
  'ended',
  '120 saat sonunda gorusme kapanir'
);
select is(
  (select ended_reason from public.conversations where id = '70000000-0000-4000-8000-000000000033'),
  'pre_meeting_timeout',
  'karar penceresi sonu zaman asimi olarak kaydedilir'
);
select is(
  (
    select count(*)::integer
    from public.account_events event
    where event.event_type = 'conversation.status_changed'
      and event.metadata ->> 'conversation_id' = '70000000-0000-4000-8000-000000000033'
  ),
  2,
  'zaman asimi iki katilimci icin denetim kaydina yazilir'
);

select * from finish();
rollback;
