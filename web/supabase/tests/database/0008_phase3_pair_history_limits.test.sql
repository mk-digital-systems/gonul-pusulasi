begin;

create extension if not exists pgtap with schema extensions;
select plan(15);

select has_index(
  'public',
  'conversations',
  'conversations_pair_history_idx',
  'çift geçmişi sorguları için indeks var'
);
select has_function(
  'public',
  'get_discovery_candidates_before_pair_history',
  array['integer'],
  'önceki keşif katmanı iç fonksiyon olarak korunur'
);
select is(
  has_function_privilege('authenticated', 'public.get_discovery_candidates_before_pair_history(integer)', 'execute'),
  false,
  'authenticated rolü iç keşif katmanını doğrudan çağıramaz'
);
select is(
  has_function_privilege('authenticated', 'public.get_my_discovery_candidates(integer)', 'execute'),
  true,
  'authenticated rolü çift geçmişi filtreli keşfi çağırabilir'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '80000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'pair-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '80000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'pair-b@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '80000000-0000-0000-0000-000000000013', 'authenticated', 'authenticated', 'pair-c@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '80000000-0000-0000-0000-000000000014', 'authenticated', 'authenticated', 'pair-d@example.test', '', now(), '{}', '{}', now(), now());

insert into public.introduction_requests (
  id, sender_id, recipient_id, status, responded_at
) values
  ('80000000-0000-4000-8000-000000000021', '80000000-0000-0000-0000-000000000011', '80000000-0000-0000-0000-000000000012', 'accepted', now()),
  ('80000000-0000-4000-8000-000000000022', '80000000-0000-0000-0000-000000000013', '80000000-0000-0000-0000-000000000014', 'accepted', now()),
  ('80000000-0000-4000-8000-000000000023', '80000000-0000-0000-0000-000000000013', '80000000-0000-0000-0000-000000000014', 'accepted', now());

insert into public.conversations (
  id, request_id, user_a_id, user_b_id, status, started_at,
  pre_meeting_expires_at, decision_expires_at, ended_at
) values
  (
    '80000000-0000-4000-8000-000000000031',
    '80000000-0000-4000-8000-000000000021',
    '80000000-0000-0000-0000-000000000011',
    '80000000-0000-0000-0000-000000000012',
    'ended', now() - interval '100 hours', now() - interval '4 hours',
    now() + interval '20 hours', now() - interval '1 hour'
  ),
  (
    '80000000-0000-4000-8000-000000000032',
    '80000000-0000-4000-8000-000000000022',
    '80000000-0000-0000-0000-000000000013',
    '80000000-0000-0000-0000-000000000014',
    'ended', now() - interval '100 hours', now() - interval '4 hours',
    now() + interval '20 hours', now() - interval '1 hour'
  );

select throws_ok(
  $$
    insert into public.introduction_requests (sender_id, recipient_id)
    values ('80000000-0000-0000-0000-000000000011', '80000000-0000-0000-0000-000000000012')
  $$,
  '23514',
  'Aynı çiftin yeniden tanışması için 72 saat geçmelidir.',
  'kapanıştan sonraki 72 saatte yeni başvuru engellenir'
);

select throws_ok(
  $$
    insert into public.conversations (request_id, user_a_id, user_b_id)
    values (
      '80000000-0000-4000-8000-000000000023',
      '80000000-0000-0000-0000-000000000013',
      '80000000-0000-0000-0000-000000000014'
    )
  $$,
  '23514',
  'Aynı çiftin yeniden tanışması için 72 saat geçmelidir.',
  'eski kabul kaydıyla görüşme açarak 72 saat sınırı aşılamaz'
);

update public.conversations
set ended_at = now() - interval '73 hours'
where id in (
  '80000000-0000-4000-8000-000000000031',
  '80000000-0000-4000-8000-000000000032'
);

select lives_ok(
  $$
    insert into public.introduction_requests (
      id, sender_id, recipient_id, status
    ) values (
      '80000000-0000-4000-8000-000000000024',
      '80000000-0000-0000-0000-000000000011',
      '80000000-0000-0000-0000-000000000012',
      'pending'
    )
  $$,
  '72 saat geçince ikinci başvuru oluşturulabilir'
);
select is(
  (
    select count(*)::integer
    from public.introduction_requests
    where id = '80000000-0000-4000-8000-000000000024'
  ),
  1,
  'izin verilen ikinci başvuru kalıcıdır'
);

update public.introduction_requests
set status = 'accepted', responded_at = now()
where id = '80000000-0000-4000-8000-000000000024';

select lives_ok(
  $$
    insert into public.conversations (
      id, request_id, user_a_id, user_b_id
    ) values (
      '80000000-0000-4000-8000-000000000033',
      '80000000-0000-4000-8000-000000000024',
      '80000000-0000-0000-0000-000000000011',
      '80000000-0000-0000-0000-000000000012'
    )
  $$,
  'aynı çift için ikinci görüşme açılabilir'
);
select is(
  (
    select count(*)::integer
    from public.conversations
    where user_a_id = '80000000-0000-0000-0000-000000000011'
      and user_b_id = '80000000-0000-0000-0000-000000000012'
  ),
  2,
  'çiftin iki görüşmelik geçmişi saklanır'
);

update public.conversations
set status = 'ended', ended_at = now() - interval '73 hours'
where id = '80000000-0000-4000-8000-000000000033';

select throws_ok(
  $$
    insert into public.introduction_requests (sender_id, recipient_id)
    values ('80000000-0000-0000-0000-000000000012', '80000000-0000-0000-0000-000000000011')
  $$,
  '23514',
  'Aynı iki kullanıcı en fazla iki kez tanışabilir.',
  'iki görüşmeden sonra ters yöndeki üçüncü başvuru da engellenir'
);

select lives_ok(
  $$
    insert into public.conversations (
      id, request_id, user_a_id, user_b_id
    ) values (
      '80000000-0000-4000-8000-000000000034',
      '80000000-0000-4000-8000-000000000023',
      '80000000-0000-0000-0000-000000000013',
      '80000000-0000-0000-0000-000000000014'
    )
  $$,
  '72 saat geçince eski kabul kaydıyla ikinci görüşme açılabilir'
);
select is(
  (
    select count(*)::integer
    from public.conversations
    where user_a_id = '80000000-0000-0000-0000-000000000013'
      and user_b_id = '80000000-0000-0000-0000-000000000014'
  ),
  2,
  'görüşme tetikleyicisi izin verilen ikinci kaydı oluşturur'
);

insert into public.introduction_requests (
  id, sender_id, recipient_id, status, responded_at
) values (
  '80000000-0000-4000-8000-000000000025',
  '80000000-0000-0000-0000-000000000011',
  '80000000-0000-0000-0000-000000000012',
  'accepted',
  now()
);

select throws_ok(
  $$
    insert into public.conversations (
      request_id, user_a_id, user_b_id
    ) values (
      '80000000-0000-4000-8000-000000000025',
      '80000000-0000-0000-0000-000000000011',
      '80000000-0000-0000-0000-000000000012'
    )
  $$,
  '23514',
  'Aynı iki kullanıcı en fazla iki kez tanışabilir.',
  'doğrudan üçüncü görüşme oluşturma girişimi de engellenir'
);

select is(
  (
    select count(*)::integer
    from public.conversations
    where user_a_id = '80000000-0000-0000-0000-000000000011'
      and user_b_id = '80000000-0000-0000-0000-000000000012'
  ),
  2,
  'başarısız üçüncü görüşme geçmişi değiştirmez'
);

select * from finish();
rollback;
