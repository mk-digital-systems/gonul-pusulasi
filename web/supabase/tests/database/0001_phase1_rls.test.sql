begin;

create extension if not exists pgtap with schema extensions;
select plan(17);

select has_table('public', 'accounts', 'accounts tablosu var');
select has_table('public', 'profiles', 'profiles tablosu var');
select has_table('public', 'account_deletion_requests', 'silme talepleri tablosu var');
select has_table('public', 'account_events', 'olay tablosu var');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'faz1-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'faz1-b@example.test', '', now(), '{}', '{}', now(), now());

select is((select count(*)::integer from public.accounts where user_id::text like '10000000-%'), 2, 'auth trigger hesap olusturur');
select is((select count(*)::integer from public.profiles where user_id::text like '10000000-%'), 2, 'auth trigger profil olusturur');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}', true);

select lives_ok(
  $$select public.complete_onboarding('Ayşe', date '1986-05-12', 'woman', 14, 'long_term_relationship', null, null)$$,
  '30+ kullanici onboarding tamamlar'
);

select is((select count(*)::integer from public.profiles), 1, 'RLS yalnizca kendi profilini gosterir');
select is((select display_name from public.profiles), 'Ayşe', 'kendi profilini okuyabilir');

select throws_ok(
  $$select public.complete_onboarding('Ayşe', date '2000-05-12', 'woman', 14, 'long_term_relationship', null, null)$$,
  '55000',
  'Onboarding tamamlanamaz.',
  'onboarding ikinci kez calismaz'
);

reset role;
select throws_ok(
  $$update public.profiles set date_of_birth = date '1985-01-01' where user_id = '10000000-0000-0000-0000-000000000001'$$,
  '23514',
  'Doğrulanmış doğum tarihi normal profil işlemiyle değiştirilemez.',
  'dogrulanmis dogum tarihi kilitlidir'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
select is((select count(*)::integer from public.profiles where display_name = 'Ayşe'), 0, 'baska kullanicinin profili gorulemez');

select throws_ok(
  $$select public.complete_onboarding('Ali', date '2000-01-01', 'man', 34, 'marriage', null, null)$$,
  '23514',
  'Minimum yaş 30.',
  '30 yas alti veritabaninda reddedilir'
);

select lives_ok(
  $$select public.complete_onboarding('Ali', date '1980-01-01', 'man', 34, 'marriage', 40, 50)$$,
  'kesin yas araligi kabul edilir'
);

select results_eq(
  $$select minimum_age, maximum_age, preference_source from public.get_my_effective_age_preference()$$,
  $$values (40, 50, 'exact'::text)$$,
  'kesin yas araligi genisletilmez'
);

select lives_ok($$select public.pause_my_account()$$, 'hesap duraklatilir');
select lives_ok($$select public.resume_my_account()$$, 'hesap yeniden etkinlestirilir');

select * from finish();
rollback;
