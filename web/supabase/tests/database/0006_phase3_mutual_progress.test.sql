begin;

create extension if not exists pgtap with schema extensions;
select plan(23);

select has_table('public', 'conversation_continue_confirmations', 'devam onaylari tablosu var');
select has_function('public', 'get_conversation_progress', array['uuid'], 'devam durumu fonksiyonu var');
select has_function('public', 'confirm_conversation_progress', array['uuid'], 'devam onayi fonksiyonu var');
select is(
  (select relrowsecurity from pg_class where oid = 'public.conversation_continue_confirmations'::regclass),
  true,
  'devam onaylari tablosunda RLS etkin'
);
select is(
  has_table_privilege('authenticated', 'public.conversation_continue_confirmations', 'select'),
  false,
  'authenticated rolu devam onaylarini dogrudan okuyamaz'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '60000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'progress-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '60000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'progress-b@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '60000000-0000-0000-0000-000000000013', 'authenticated', 'authenticated', 'progress-c@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '60000000-0000-0000-0000-000000000014', 'authenticated', 'authenticated', 'progress-d@example.test', '', now(), '{}', '{}', now(), now());

update public.accounts
set status = 'active', onboarding_completed_at = now()
where user_id::text like '60000000-%';

update public.profiles
set display_name = case user_id
  when '60000000-0000-0000-0000-000000000011' then 'Aylin'
  when '60000000-0000-0000-0000-000000000012' then 'Baran'
  when '60000000-0000-0000-0000-000000000013' then 'Can'
  else 'Derya'
end
where user_id::text like '60000000-%';

insert into public.introduction_requests (
  id, sender_id, recipient_id, status, responded_at
) values
  (
    '60000000-0000-4000-8000-000000000021',
    '60000000-0000-0000-0000-000000000011',
    '60000000-0000-0000-0000-000000000012',
    'accepted',
    now()
  ),
  (
    '60000000-0000-4000-8000-000000000022',
    '60000000-0000-0000-0000-000000000011',
    '60000000-0000-0000-0000-000000000013',
    'accepted',
    now()
  ),
  (
    '60000000-0000-4000-8000-000000000023',
    '60000000-0000-0000-0000-000000000011',
    '60000000-0000-0000-0000-000000000014',
    'pending',
    null
  );

insert into public.conversations (
  id, request_id, user_a_id, user_b_id
) values
  (
    '60000000-0000-4000-8000-000000000031',
    '60000000-0000-4000-8000-000000000021',
    '60000000-0000-0000-0000-000000000011',
    '60000000-0000-0000-0000-000000000012'
  ),
  (
    '60000000-0000-4000-8000-000000000032',
    '60000000-0000-4000-8000-000000000022',
    '60000000-0000-0000-0000-000000000011',
    '60000000-0000-0000-0000-000000000013'
  );

select throws_ok(
  $$
    insert into public.conversation_continue_confirmations (conversation_id, user_id)
    values (
      '60000000-0000-4000-8000-000000000031',
      '60000000-0000-0000-0000-000000000013'
    )
  $$,
  '23514',
  'Devam onayı görüşmenin katılımcısına ait olmalıdır.',
  'katilimci olmayan kullanici adina onay yazilamaz'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"60000000-0000-0000-0000-000000000011","role":"authenticated"}', true);

select is(
  (select count(*)::integer from public.get_conversation_progress('60000000-0000-4000-8000-000000000031')),
  1,
  'birinci katilimci devam durumunu gorur'
);
select is(
  (select my_confirmed from public.get_conversation_progress('60000000-0000-4000-8000-000000000031')),
  false,
  'birinci katilimci baslangicta onay vermemistir'
);
select is(
  public.confirm_conversation_progress('60000000-0000-4000-8000-000000000031'),
  'pre_meeting',
  'ilk onaydan sonra on gorusme devam eder'
);
select is(
  (select my_confirmed from public.get_conversation_progress('60000000-0000-4000-8000-000000000031')),
  true,
  'birinci katilimcinin onayi kaydedilir'
);

select set_config('request.jwt.claims', '{"sub":"60000000-0000-0000-0000-000000000012","role":"authenticated"}', true);

select is(
  (select mutual_confirmed from public.get_conversation_progress('60000000-0000-4000-8000-000000000031')),
  false,
  'ikinci onaydan once karsilikli onay yoktur'
);
select is(
  public.confirm_conversation_progress('60000000-0000-4000-8000-000000000031'),
  'active',
  'ikinci onay aktif tanismayi baslatir'
);
select is(
  (select status::text from public.conversations where id = '60000000-0000-4000-8000-000000000031'),
  'active',
  'hedef gorusme aktif olur'
);
select is(
  (select mutual_confirmed from public.get_conversation_progress('60000000-0000-4000-8000-000000000031')),
  true,
  'iki onay karsilikli olarak gorulur'
);
select lives_ok(
  $$select public.send_conversation_message('60000000-0000-4000-8000-000000000031', 'Aktif tanışmada mesajlaşma devam ediyor.')$$,
  'aktif tanismada mesaj gonderilir'
);
select is(
  (select count(*)::integer from public.get_conversation_messages('60000000-0000-4000-8000-000000000031', 100)),
  1,
  'aktif tanisma mesaji katilimciya gorunur'
);

select set_config('request.jwt.claims', '{"sub":"60000000-0000-0000-0000-000000000013","role":"authenticated"}', true);

select is(
  (select status::text from public.conversations where id = '60000000-0000-4000-8000-000000000032'),
  'ended',
  'diger acik gorusme sona erer'
);
select throws_ok(
  $$select public.confirm_conversation_progress('60000000-0000-4000-8000-000000000031')$$,
  '42501',
  'Bu görüşme için karar veremezsiniz.',
  'katilimci olmayan kullanici devam onayi veremez'
);

reset role;
select throws_ok(
  $$
    update public.conversations
    set status = 'pre_meeting', ended_at = null
    where id = '60000000-0000-4000-8000-000000000032'
  $$,
  '23514',
  'Aktif tanışması olan kullanıcı yeni görüşme açamaz.',
  'aktif kullanici icin baska gorusme yeniden acilamaz'
);
select is(
  (select status::text from public.introduction_requests where id = '60000000-0000-4000-8000-000000000023'),
  'expired',
  'aktif tanisma baslayinca bekleyen basvuru kapanir'
);
select is(
  (
    select count(*)::integer
    from public.account_events event
    where event.event_type = 'introduction.closed_for_active_match'
      and event.metadata ->> 'request_id' = '60000000-0000-4000-8000-000000000023'
  ),
  2,
  'kapanan basvuru iki taraf icin denetim kaydina yazilir'
);
select is(
  (
    select count(*)::integer
    from public.account_events event
    where event.event_type = 'conversation.activated'
      and event.metadata ->> 'conversation_id' = '60000000-0000-4000-8000-000000000031'
  ),
  2,
  'aktif tanisma iki katilimci icin denetim kaydina yazilir'
);
select is(
  (
    select count(*)::integer
    from public.conversation_continue_confirmations confirmation
    where confirmation.conversation_id = '60000000-0000-4000-8000-000000000031'
  ),
  2,
  'iki devam onayi saklanir'
);

select * from finish();
rollback;
