begin;

create extension if not exists pgtap with schema extensions;
select plan(27);

select has_table('public', 'conversation_messages', 'gorusme mesajlari tablosu var');
select has_function('public', 'get_my_conversations', array[]::text[], 'gorusme listeleme fonksiyonu var');
select has_function('public', 'get_conversation_details', array['uuid'], 'gorusme detay fonksiyonu var');
select has_function('public', 'get_conversation_messages', array['uuid', 'integer'], 'mesaj listeleme fonksiyonu var');
select has_function('public', 'send_conversation_message', array['uuid', 'text'], 'mesaj gonderme fonksiyonu var');

select is(
  (select relrowsecurity from pg_class where oid = 'public.conversation_messages'::regclass),
  true,
  'mesaj tablosunda RLS etkin'
);
select is(
  has_table_privilege('authenticated', 'public.conversation_messages', 'select'),
  false,
  'authenticated rolu mesaj tablosunu dogrudan okuyamaz'
);
select is(
  has_table_privilege('authenticated', 'public.conversation_messages', 'insert'),
  false,
  'authenticated rolu mesaj tablosuna dogrudan yazamaz'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '50000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'faz3-message-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '50000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'faz3-message-b@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '50000000-0000-0000-0000-000000000013', 'authenticated', 'authenticated', 'faz3-message-outsider@example.test', '', now(), '{}', '{}', now(), now());

update public.accounts
set status = 'active', onboarding_completed_at = now()
where user_id::text like '50000000-%';

update public.profiles
set display_name = case user_id
  when '50000000-0000-0000-0000-000000000011' then 'Deniz'
  when '50000000-0000-0000-0000-000000000012' then 'Eren'
  else 'Dış Kullanıcı'
end
where user_id::text like '50000000-%';

insert into public.introduction_requests (
  id, sender_id, recipient_id, status, responded_at
) values (
  '50000000-0000-4000-8000-000000000021',
  '50000000-0000-0000-0000-000000000011',
  '50000000-0000-0000-0000-000000000012',
  'accepted',
  now()
);

insert into public.conversations (
  id, request_id, user_a_id, user_b_id
) values (
  '50000000-0000-4000-8000-000000000031',
  '50000000-0000-4000-8000-000000000021',
  '50000000-0000-0000-0000-000000000011',
  '50000000-0000-0000-0000-000000000012'
);

select throws_ok(
  $$
    insert into public.conversation_messages (conversation_id, sender_id, body)
    values (
      '50000000-0000-4000-8000-000000000031',
      '50000000-0000-0000-0000-000000000013',
      'Katılımcı olmayan kullanıcı adına yazılmamalı.'
    )
  $$,
  '23514',
  'Mesaj gönderen görüşmenin katılımcısı olmalıdır.',
  'veritabani katilimci olmayan gondereni reddeder'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000011","role":"authenticated"}', true);

select is((select count(*)::integer from public.get_my_conversations()), 1, 'birinci katilimci gorusmesini listeler');
select is(
  (select count(*)::integer from public.get_conversation_details('50000000-0000-4000-8000-000000000031')),
  1,
  'birinci katilimci gorusme detayini gorur'
);
select lives_ok(
  $$select public.send_conversation_message('50000000-0000-4000-8000-000000000031', '  Merhaba, tanıştığımıza sevindim.  ')$$,
  'birinci katilimci mesaj gonderir'
);
select is(
  (select count(*)::integer from public.get_conversation_messages('50000000-0000-4000-8000-000000000031', 100)),
  1,
  'birinci katilimci bir mesaji gorur'
);
select is(
  (select body from public.get_conversation_messages('50000000-0000-4000-8000-000000000031', 100)),
  'Merhaba, tanıştığımıza sevindim.',
  'mesaj bosluklari temizlenerek saklanir'
);

select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000012","role":"authenticated"}', true);

select is((select count(*)::integer from public.get_my_conversations()), 1, 'ikinci katilimci gorusmesini listeler');
select is(
  (select count(*)::integer from public.get_conversation_messages('50000000-0000-4000-8000-000000000031', 100)),
  1,
  'ikinci katilimci ilk mesaji gorur'
);
select lives_ok(
  $$select public.send_conversation_message('50000000-0000-4000-8000-000000000031', 'Ben de memnun oldum, hoş geldin.')$$,
  'ikinci katilimci yanit gonderir'
);
select is(
  (select count(*)::integer from public.get_conversation_messages('50000000-0000-4000-8000-000000000031', 100)),
  2,
  'iki mesaj sirali olarak gorulur'
);

select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000013","role":"authenticated"}', true);

select is((select count(*)::integer from public.get_my_conversations()), 0, 'ucuncu kisi gorusmeyi listeleyemez');
select is(
  (select count(*)::integer from public.get_conversation_details('50000000-0000-4000-8000-000000000031')),
  0,
  'ucuncu kisi gorusme detayini goremez'
);
select throws_ok(
  $$select public.get_conversation_messages('50000000-0000-4000-8000-000000000031', 100)$$,
  '42501',
  'Bu görüşmeye erişemezsiniz.',
  'ucuncu kisi mesajlari okuyamaz'
);
select throws_ok(
  $$select public.send_conversation_message('50000000-0000-4000-8000-000000000031', 'Bu mesaja erişmemeliyim.')$$,
  '42501',
  'Bu görüşmeye mesaj gönderemezsiniz.',
  'ucuncu kisi mesaj gonderemez'
);

reset role;
update public.conversations
set started_at = now() - interval '5 days',
    pre_meeting_expires_at = now() - interval '1 day',
    decision_expires_at = now() - interval '1 minute'
where id = '50000000-0000-4000-8000-000000000031';

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"50000000-0000-0000-0000-000000000011","role":"authenticated"}', true);

select lives_ok($$select public.get_my_conversations()$$, 'sure sonu gorusme listelenirken islenir');
select is(
  (select conversation_status from public.get_conversation_details('50000000-0000-4000-8000-000000000031')),
  'ended',
  '96 arti 24 saat dolan gorusme sona erer'
);
select is(
  (select count(*)::integer from public.get_conversation_messages('50000000-0000-4000-8000-000000000031', 100)),
  0,
  'sona eren gorusmenin mesajlari RPC ile acilmaz'
);
select throws_ok(
  $$select public.send_conversation_message('50000000-0000-4000-8000-000000000031', 'Süre dolduktan sonra gönderilmemeli.')$$,
  '55000',
  'Görüşme mesajlaşmaya kapalı.',
  'sure dolunca yeni mesaj reddedilir'
);

reset role;
select is(
  (
    select count(*)::integer
    from public.account_events event
    where event.event_type = 'conversation.status_changed'
      and event.metadata ->> 'conversation_id' = '50000000-0000-4000-8000-000000000031'
  ),
  2,
  'sure sonu durum degisikligi iki katilimci icin denetim kaydina yazilir'
);

select * from finish();
rollback;
