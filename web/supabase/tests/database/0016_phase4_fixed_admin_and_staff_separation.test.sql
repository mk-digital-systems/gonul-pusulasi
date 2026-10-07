begin;

create extension if not exists pgtap with schema extensions;
select plan(17);

select has_function(
  'public',
  'enforce_moderation_staff_separation',
  array[]::text[],
  'personel ve üye ayrımı trigger fonksiyonu var'
);
select has_function(
  'public',
  'block_member_onboarding_for_moderation_staff',
  array[]::text[],
  'personelin onboarding tamamlamasını engelleyen fonksiyon var'
);
select has_trigger(
  'public',
  'moderation_staff',
  'enforce_moderation_staff_separation_before_write',
  'personel tablosunda ayrım triggerı var'
);
select has_trigger(
  'public',
  'accounts',
  'block_member_onboarding_for_moderation_staff_before_update',
  'hesap tablosunda personel onboarding koruması var'
);
select is(
  has_function_privilege(
    'authenticated',
    'public.enforce_moderation_staff_separation()',
    'execute'
  ),
  false,
  'personel ayrımı iç fonksiyonu istemciden çağrılamaz'
);
select is(
  has_table_privilege('authenticated', 'public.moderation_staff', 'insert'),
  false,
  'normal kullanıcı personel tablosuna doğrudan kayıt ekleyemez'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'ae6db6cf-7852-4fef-9fa0-fba3a6afac55', 'authenticated', 'authenticated', 'fixed-admin@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f0000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'staff-only@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f0000000-0000-0000-0000-000000000013', 'authenticated', 'authenticated', 'completed-member@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f0000000-0000-0000-0000-000000000014', 'authenticated', 'authenticated', 'other-admin@example.test', '', now(), '{}', '{}', now(), now());

update public.accounts
set onboarding_completed_at = now()
where user_id = 'f0000000-0000-0000-0000-000000000013';

insert into public.moderation_staff (user_id, role, is_active, created_by_user_id)
values (
  'ae6db6cf-7852-4fef-9fa0-fba3a6afac55',
  'admin',
  true,
  'ae6db6cf-7852-4fef-9fa0-fba3a6afac55'
);

select throws_ok(
  $$
    insert into public.moderation_staff (user_id, role, is_active)
    values ('f0000000-0000-0000-0000-000000000014', 'admin', true)
  $$,
  '42501',
  'Admin kimliği sabittir ve pasifleştirilemez.',
  'sabit UUID dışında admin oluşturulamaz'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"ae6db6cf-7852-4fef-9fa0-fba3a6afac55","role":"authenticated"}', true);

select throws_ok(
  $$
    select public.manage_moderation_staff(
      'f0000000-0000-0000-0000-000000000013',
      'moderator',
      true
    )
  $$,
  '55000',
  'Moderatör hesabı etkin olmalı ve üye onboarding akışını tamamlamamış olmalıdır.',
  'onboarding tamamlamış normal üye moderatör yapılamaz'
);
select throws_ok(
  $$
    select public.manage_moderation_staff(
      'f0000000-0000-0000-0000-000000000012',
      'admin',
      true
    )
  $$,
  '23514',
  'Yalnızca ayrı bir moderatör hesabı yönetilebilir.',
  'personel yönetimi ikinci admin atayamaz'
);
select lives_ok(
  $$
    select public.manage_moderation_staff(
      'f0000000-0000-0000-0000-000000000012',
      'moderator',
      true
    )
  $$,
  'admin ayrı personel hesabını moderatör yapabilir'
);
select is(
  (
    select role
    from public.get_moderation_staff()
    where user_id = 'f0000000-0000-0000-0000-000000000012'
  ),
  'moderator',
  'atanan personelin rolü yalnızca moderatördür'
);
select is(
  (select count(*)::integer from public.get_my_discovery_candidates(10)),
  0,
  'admin aday arayamaz'
);

select set_config('request.jwt.claims', '{"sub":"f0000000-0000-0000-0000-000000000012","role":"authenticated"}', true);
select is(public.get_my_staff_role(), 'moderator', 'atanan moderatör kendi personel rolünü görür');
select is(
  (select count(*)::integer from public.get_my_discovery_candidates(10)),
  0,
  'moderatör aday arayamaz'
);
select throws_ok(
  $$
    select public.manage_moderation_staff(
      'f0000000-0000-0000-0000-000000000014',
      'moderator',
      true
    )
  $$,
  '42501',
  'Bu işlem için moderasyon yetkisi gerekli.',
  'moderatör başka moderatör atayamaz'
);

reset role;
select throws_ok(
  $$
    update public.accounts
    set onboarding_completed_at = now()
    where user_id = 'f0000000-0000-0000-0000-000000000012'
  $$,
  '42501',
  'Moderasyon personeli üye onboarding akışını tamamlayamaz.',
  'aktif moderatör sonradan normal üye olamaz'
);
select is(
  (
    select count(*)::integer
    from public.moderation_staff
    where role = 'admin' and is_active
  ),
  1,
  'yalnızca bir etkin admin vardır'
);

select * from finish();
rollback;
