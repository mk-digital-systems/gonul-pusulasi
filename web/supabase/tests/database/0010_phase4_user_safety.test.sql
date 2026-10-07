begin;

create extension if not exists pgtap with schema extensions;
select plan(32);

select has_table('public', 'user_blocks', 'kullanıcı engelleme tablosu var');
select has_table('public', 'user_reports', 'kullanıcı şikâyet tablosu var');
select has_function('public', 'block_user', array['uuid'], 'engelleme fonksiyonu var');
select has_function('public', 'unblock_user', array['uuid'], 'engel kaldırma fonksiyonu var');
select has_function(
  'public',
  'report_user',
  array['uuid', 'uuid', 'text', 'text'],
  'şikâyet oluşturma fonksiyonu var'
);
select has_function('public', 'get_my_blocked_users', array[]::text[], 'engellenenleri listeleme fonksiyonu var');
select is(
  (select relrowsecurity from pg_class where oid = 'public.user_blocks'::regclass),
  true,
  'engelleme tablosunda RLS etkin'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.user_reports'::regclass),
  true,
  'şikâyet tablosunda RLS etkin'
);
select is(
  has_table_privilege('authenticated', 'public.user_blocks', 'insert'),
  false,
  'authenticated rolü engelleme tablosuna doğrudan yazamaz'
);
select is(
  has_table_privilege('authenticated', 'public.user_reports', 'insert'),
  false,
  'authenticated rolü şikâyet tablosuna doğrudan yazamaz'
);
select has_function(
  'public',
  'get_discovery_candidates_before_blocks',
  array['integer'],
  'önceki keşif katmanı iç fonksiyon olarak korunur'
);
select is(
  has_function_privilege('authenticated', 'public.get_discovery_candidates_before_blocks(integer)', 'execute'),
  false,
  'authenticated rolü engel filtresiz keşfi doğrudan çağıramaz'
);
select is(
  has_function_privilege('authenticated', 'public.get_my_discovery_candidates(integer)', 'execute'),
  true,
  'authenticated rolü engel filtreli keşfi çağırabilir'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'safety-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'safety-b@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000013', 'authenticated', 'authenticated', 'safety-c@example.test', '', now(), '{}', '{}', now(), now());

update public.profiles
set display_name = case user_id
  when 'a0000000-0000-0000-0000-000000000011' then 'Ayşe'
  when 'a0000000-0000-0000-0000-000000000012' then 'Baran'
  else 'Cem'
end
where user_id::text like 'a0000000-%';

insert into public.introduction_requests (
  id, sender_id, recipient_id, status, responded_at
) values
  ('a0000000-0000-4000-8000-000000000021', 'a0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000012', 'accepted', now()),
  ('a0000000-0000-4000-8000-000000000022', 'a0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000012', 'pending', null),
  ('a0000000-0000-4000-8000-000000000023', 'a0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000011', 'accepted', now());

insert into public.conversations (
  id, request_id, user_a_id, user_b_id, status, activated_at
) values (
  'a0000000-0000-4000-8000-000000000031',
  'a0000000-0000-4000-8000-000000000021',
  'a0000000-0000-0000-0000-000000000011',
  'a0000000-0000-0000-0000-000000000012',
  'active',
  now()
);

insert into public.conversation_messages (
  id, conversation_id, sender_id, body
) values (
  'a0000000-0000-4000-8000-000000000041',
  'a0000000-0000-4000-8000-000000000031',
  'a0000000-0000-0000-0000-000000000011',
  'Güvenlik testi için başlangıç mesajı.'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000011","role":"authenticated"}', true);

select lives_ok(
  $$
    select public.report_user(
      'a0000000-0000-0000-0000-000000000012',
      'a0000000-0000-4000-8000-000000000031',
      'harassment',
      'Rahatsız edici iletişim hakkında test açıklaması.'
    )
  $$,
  'katılımcı diğer kullanıcı için şikâyet oluşturabilir'
);
select is(
  (select count(*)::integer from public.user_reports where reporter_user_id = auth.uid()),
  1,
  'kullanıcı kendi şikâyet kaydını okuyabilir'
);
select is(
  (select count(*)::integer from public.user_blocks where blocker_user_id = auth.uid()),
  0,
  'şikâyet otomatik engelleme oluşturmaz'
);

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000013","role":"authenticated"}', true);
select is(
  (select count(*)::integer from public.user_reports),
  0,
  'başka kullanıcı şikâyet kaydını göremez'
);
select throws_ok(
  $$
    select public.report_user(
      'a0000000-0000-0000-0000-000000000012',
      'a0000000-0000-4000-8000-000000000031',
      'other',
      'Katılımcı olmayan kullanıcı testi.'
    )
  $$,
  '42501',
  'Yalnızca katıldığınız görüşmedeki diğer kullanıcıyı şikâyet edebilirsiniz.',
  'katılımcı olmayan kullanıcı görüşme üzerinden şikâyet oluşturamaz'
);

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000011","role":"authenticated"}', true);
select lives_ok(
  $$select public.block_user('a0000000-0000-0000-0000-000000000012')$$,
  'kullanıcı görüştüğü kişiyi engelleyebilir'
);
select is(
  (select blocked_user_id from public.get_my_blocked_users()),
  'a0000000-0000-0000-0000-000000000012'::uuid,
  'engellenen kullanıcı yalnızca engelleyen kişinin listesinde görünür'
);

reset role;
select is(
  (
    select count(*)::integer
    from public.user_blocks
    where blocker_user_id = 'a0000000-0000-0000-0000-000000000011'
      and blocked_user_id = 'a0000000-0000-0000-0000-000000000012'
  ),
  1,
  'engelleme kaydı oluşturulur'
);
select is(
  (select status::text from public.conversations where id = 'a0000000-0000-4000-8000-000000000031'),
  'ended',
  'engelleme açık görüşmeyi kapatır'
);
select is(
  (select ended_reason from public.conversations where id = 'a0000000-0000-4000-8000-000000000031'),
  'user_blocked',
  'görüşmenin engelleme nedeniyle kapandığı kaydedilir'
);
select is(
  (select ended_by_user_id from public.conversations where id = 'a0000000-0000-4000-8000-000000000031'),
  'a0000000-0000-0000-0000-000000000011'::uuid,
  'engelleyen kullanıcı kapanış aktörü olarak kaydedilir'
);
select is(
  (select status::text from public.introduction_requests where id = 'a0000000-0000-4000-8000-000000000022'),
  'expired',
  'engelleme çiftin bekleyen başvurusunu kapatır'
);
select throws_ok(
  $$
    insert into public.conversation_messages (conversation_id, sender_id, body)
    values (
      'a0000000-0000-4000-8000-000000000031',
      'a0000000-0000-0000-0000-000000000012',
      'Bu mesaj engel nedeniyle kaydedilmemeli.'
    )
  $$,
  '23514',
  'Engellenmiş kullanıcılar arasında mesaj gönderilemez.',
  'engel sonrası doğrudan mesaj yazımı engellenir'
);
select throws_ok(
  $$
    insert into public.introduction_requests (sender_id, recipient_id)
    values ('a0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000011')
  $$,
  '23514',
  'Engellenmiş kullanıcılar arasında tanışma başvurusu oluşturulamaz.',
  'engel sonrası ters yöndeki başvuru da engellenir'
);
select throws_ok(
  $$
    insert into public.conversations (request_id, user_a_id, user_b_id)
    values (
      'a0000000-0000-4000-8000-000000000023',
      'a0000000-0000-0000-0000-000000000011',
      'a0000000-0000-0000-0000-000000000012'
    )
  $$,
  '23514',
  'Engellenmiş kullanıcılar arasında görüşme açılamaz.',
  'eski kabul kaydıyla yeni görüşme açılarak engel aşılamaz'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000012","role":"authenticated"}', true);
select is(
  (select count(*)::integer from public.get_my_blocked_users()),
  0,
  'engellenen kişi kendisini kimin engellediğini göremez'
);

select set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000011","role":"authenticated"}', true);
select lives_ok(
  $$select public.unblock_user('a0000000-0000-0000-0000-000000000012')$$,
  'engelleyen kullanıcı engeli kaldırabilir'
);

reset role;
select is(
  (
    select count(*)::integer
    from public.user_blocks
    where blocker_user_id = 'a0000000-0000-0000-0000-000000000011'
      and blocked_user_id = 'a0000000-0000-0000-0000-000000000012'
  ),
  0,
  'engel kaldırıldığında ilişki kaydı silinir'
);
select is(
  (
    select count(*)::integer
    from public.account_events event
    where event.subject_user_id = 'a0000000-0000-0000-0000-000000000011'
      and event.event_type in (
        'safety.report_created',
        'safety.user_blocked',
        'safety.user_unblocked'
      )
  ),
  3,
  'şikâyet, engelleme ve engel kaldırma denetim kaydına yazılır'
);

select * from finish();
rollback;
