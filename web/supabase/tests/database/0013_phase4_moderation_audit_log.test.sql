begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

select has_function(
  'public',
  'get_moderation_action_log',
  array['integer'],
  'moderasyon denetim geçmişi fonksiyonu var'
);
select is(
  has_function_privilege(
    'authenticated',
    'public.get_moderation_action_log(integer)',
    'execute'
  ),
  true,
  'authenticated rolü güvenli RPC sınırına erişebilir'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'ae6db6cf-7852-4fef-9fa0-fba3a6afac55', 'authenticated', 'authenticated', 'audit-admin@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'audit-moderator@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000013', 'authenticated', 'authenticated', 'audit-target@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000014', 'authenticated', 'authenticated', 'audit-regular@example.test', '', now(), '{}', '{}', now(), now());

update public.profiles
set display_name = case user_id
  when 'ae6db6cf-7852-4fef-9fa0-fba3a6afac55' then 'Denetim Admini'
  when 'd0000000-0000-0000-0000-000000000012' then 'Denetim Moderatörü'
  when 'd0000000-0000-0000-0000-000000000013' then 'Denetim Hedefi'
  else 'Normal Kullanıcı'
end
where user_id::text like 'd0000000-%'
   or user_id = 'ae6db6cf-7852-4fef-9fa0-fba3a6afac55';

insert into public.moderation_staff (user_id, role, created_by_user_id) values
  (
    'ae6db6cf-7852-4fef-9fa0-fba3a6afac55',
    'admin',
    'ae6db6cf-7852-4fef-9fa0-fba3a6afac55'
  ),
  (
    'd0000000-0000-0000-0000-000000000012',
    'moderator',
    'ae6db6cf-7852-4fef-9fa0-fba3a6afac55'
  );

insert into public.moderation_actions (
  id,
  staff_user_id,
  target_user_id,
  action,
  previous_status,
  new_status,
  reason,
  created_at
) values
  (
    'd0000000-0000-4000-8000-000000000021',
    'ae6db6cf-7852-4fef-9fa0-fba3a6afac55',
    'd0000000-0000-0000-0000-000000000013',
    'account_suspended',
    'active',
    'suspended',
    'Denetim geçmişi için hesap askıya alma testi.',
    now() - interval '1 minute'
  ),
  (
    'd0000000-0000-4000-8000-000000000022',
    'ae6db6cf-7852-4fef-9fa0-fba3a6afac55',
    'd0000000-0000-0000-0000-000000000013',
    'account_restored',
    'suspended',
    'active',
    'Denetim geçmişi için hesabı geri açma testi.',
    now()
  );

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-000000000014","role":"authenticated"}', true);
select throws_ok(
  $$select * from public.get_moderation_action_log(100)$$,
  '42501',
  'Bu işlem için moderasyon yetkisi gerekli.',
  'normal kullanıcı denetim geçmişini göremez'
);

select set_config('request.jwt.claims', '{"sub":"d0000000-0000-0000-0000-000000000012","role":"authenticated"}', true);
select throws_ok(
  $$select * from public.get_moderation_action_log(100)$$,
  '42501',
  'Bu işlem için moderasyon yetkisi gerekli.',
  'moderatör hassas yaptırım geçmişini göremez'
);

select set_config('request.jwt.claims', '{"sub":"ae6db6cf-7852-4fef-9fa0-fba3a6afac55","role":"authenticated"}', true);
select is(
  (select count(*)::integer from public.get_moderation_action_log(100)),
  2,
  'admin denetim geçmişindeki iki işlemi görür'
);
select is(
  (select action from public.get_moderation_action_log(1)),
  'account_restored',
  'en yeni işlem önce döner ve limit uygulanır'
);
select is(
  (select target_display_name from public.get_moderation_action_log(1)),
  'Denetim Hedefi',
  'hedef kullanıcının görünen adı denetim kaydında yer alır'
);

select * from finish();
rollback;
