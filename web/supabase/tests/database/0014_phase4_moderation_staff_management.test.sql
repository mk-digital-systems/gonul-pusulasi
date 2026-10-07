begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

select has_function(
  'public',
  'get_moderation_staff',
  array[]::text[],
  'moderasyon ekibini listeleme fonksiyonu var'
);
select has_function(
  'public',
  'manage_moderation_staff',
  array['uuid', 'text', 'boolean'],
  'moderasyon personeli yönetim fonksiyonu var'
);
select is(
  has_function_privilege('authenticated', 'public.get_moderation_staff()', 'execute'),
  true,
  'authenticated rolü güvenli liste RPC sınırına erişebilir'
);
select is(
  has_function_privilege(
    'authenticated',
    'public.manage_moderation_staff(uuid, text, boolean)',
    'execute'
  ),
  true,
  'authenticated rolü güvenli yönetim RPC sınırına erişebilir'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'e0000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'staff-admin@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e0000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'staff-moderator@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e0000000-0000-0000-0000-000000000013', 'authenticated', 'authenticated', 'staff-candidate@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e0000000-0000-0000-0000-000000000014', 'authenticated', 'authenticated', 'staff-regular@example.test', '', now(), '{}', '{}', now(), now());

update public.profiles
set display_name = case user_id
  when 'e0000000-0000-0000-0000-000000000011' then 'Ekip Admini'
  when 'e0000000-0000-0000-0000-000000000012' then 'Mevcut Moderatör'
  when 'e0000000-0000-0000-0000-000000000013' then 'Yeni Personel'
  else 'Normal Kullanıcı'
end
where user_id::text like 'e0000000-%';

insert into public.moderation_staff (user_id, role, created_by_user_id) values
  (
    'e0000000-0000-0000-0000-000000000011',
    'admin',
    'e0000000-0000-0000-0000-000000000011'
  ),
  (
    'e0000000-0000-0000-0000-000000000012',
    'moderator',
    'e0000000-0000-0000-0000-000000000011'
  );

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-000000000014","role":"authenticated"}', true);
select throws_ok(
  $$select * from public.get_moderation_staff()$$,
  '42501',
  'Bu işlem için moderasyon yetkisi gerekli.',
  'normal kullanıcı moderasyon ekibini göremez'
);

select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-000000000012","role":"authenticated"}', true);
select throws_ok(
  $$
    select public.manage_moderation_staff(
      'e0000000-0000-0000-0000-000000000013',
      'moderator',
      true
    )
  $$,
  '42501',
  'Bu işlem için moderasyon yetkisi gerekli.',
  'moderatör personel yetkisi veremez'
);

select set_config('request.jwt.claims', '{"sub":"e0000000-0000-0000-0000-000000000011","role":"authenticated"}', true);
select is(
  (select count(*)::integer from public.get_moderation_staff()),
  2,
  'admin mevcut moderasyon ekibini görür'
);
select lives_ok(
  $$
    select public.manage_moderation_staff(
      'e0000000-0000-0000-0000-000000000013',
      'moderator',
      true
    )
  $$,
  'admin etkin kullanıcıyı moderatör yapabilir'
);
select is(
  (
    select role
    from public.get_moderation_staff()
    where user_id = 'e0000000-0000-0000-0000-000000000013'
  ),
  'moderator',
  'yeni moderatör listede görünür'
);
select throws_ok(
  $$
    select public.manage_moderation_staff(
      'e0000000-0000-0000-0000-000000000011',
      'moderator',
      true
    )
  $$,
  '42501',
  'Admin kendi etkin admin yetkisini kaldıramaz.',
  'admin kendi rolünü düşüremez'
);
select throws_ok(
  $$
    select public.manage_moderation_staff(
      'e0000000-0000-0000-0000-000000000099',
      'moderator',
      true
    )
  $$,
  'P0002',
  'Auth kullanıcısı bulunamadı.',
  'bilinmeyen Auth UUID reddedilir'
);
select lives_ok(
  $$
    select public.manage_moderation_staff(
      'e0000000-0000-0000-0000-000000000013',
      'moderator',
      false
    )
  $$,
  'admin moderatör yetkisini pasifleştirebilir'
);

reset role;
select is(
  (
    select is_active
    from public.moderation_staff
    where user_id = 'e0000000-0000-0000-0000-000000000013'
  ),
  false,
  'pasifleştirilen personel kaydı korunur'
);
select is(
  (
    select count(*)::integer
    from public.account_events event
    where event.subject_user_id = 'e0000000-0000-0000-0000-000000000013'
      and event.event_type = 'moderation.staff_changed'
  ),
  2,
  'personel ekleme ve pasifleştirme denetim olayına yazılır'
);

select * from finish();
rollback;
