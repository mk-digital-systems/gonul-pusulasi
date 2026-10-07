begin;

create extension if not exists pgtap with schema extensions;
select plan(36);

select has_table('public', 'moderation_staff', 'moderasyon personeli tablosu var');
select has_table('public', 'moderation_actions', 'moderasyon işlem kaydı tablosu var');
select has_function('public', 'get_my_staff_role', array[]::text[], 'personel rolü fonksiyonu var');
select has_function(
  'public',
  'get_moderation_reports',
  array['text', 'integer'],
  'moderasyon kuyruğu fonksiyonu var'
);
select has_function(
  'public',
  'update_moderation_report',
  array['uuid', 'text', 'text'],
  'şikâyet inceleme fonksiyonu var'
);
select has_function(
  'public',
  'suspend_user_for_report',
  array['uuid', 'text'],
  'hesap askıya alma fonksiyonu var'
);
select has_function(
  'public',
  'restore_suspended_user',
  array['uuid', 'text'],
  'hesap geri açma fonksiyonu var'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.moderation_staff'::regclass),
  true,
  'moderasyon personeli tablosunda RLS etkin'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.moderation_actions'::regclass),
  true,
  'moderasyon işlem tablosunda RLS etkin'
);
select is(
  has_table_privilege('authenticated', 'public.moderation_staff', 'select'),
  false,
  'authenticated rolü personel tablosunu doğrudan okuyamaz'
);
select is(
  has_table_privilege('authenticated', 'public.moderation_actions', 'select'),
  false,
  'authenticated rolü işlem tablosunu doğrudan okuyamaz'
);
select is(
  has_function_privilege(
    'authenticated',
    'public.require_moderation_staff(boolean)',
    'execute'
  ),
  false,
  'iç yetki denetimi doğrudan çağrılamaz'
);
select is(
  has_function_privilege('authenticated', 'public.get_my_staff_role()', 'execute'),
  true,
  'authenticated rolü kendi personel rolünü sorgulayabilir'
);
select is(
  has_column_privilege('authenticated', 'public.user_reports', 'reviewed_by_user_id', 'select'),
  false,
  'şikâyetçi inceleyen personel kimliğini doğrudan okuyamaz'
);
select is(
  has_column_privilege('authenticated', 'public.user_reports', 'resolution_note', 'select'),
  false,
  'şikâyetçi iç moderasyon notunu doğrudan okuyamaz'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'moderation-admin@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'moderation-moderator@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000013', 'authenticated', 'authenticated', 'moderation-reporter@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000014', 'authenticated', 'authenticated', 'moderation-target@example.test', '', now(), '{}', '{}', now(), now());

update public.profiles
set display_name = case user_id
  when 'b0000000-0000-0000-0000-000000000011' then 'Admin Test'
  when 'b0000000-0000-0000-0000-000000000012' then 'Moderatör Test'
  when 'b0000000-0000-0000-0000-000000000013' then 'Şikâyetçi Test'
  else 'Hedef Test'
end
where user_id::text like 'b0000000-%';

insert into public.moderation_staff (user_id, role, created_by_user_id) values
  (
    'b0000000-0000-0000-0000-000000000011',
    'admin',
    'b0000000-0000-0000-0000-000000000011'
  ),
  (
    'b0000000-0000-0000-0000-000000000012',
    'moderator',
    'b0000000-0000-0000-0000-000000000011'
  );

insert into public.introduction_requests (
  id, sender_id, recipient_id, status, responded_at
) values (
  'b0000000-0000-4000-8000-000000000021',
  'b0000000-0000-0000-0000-000000000013',
  'b0000000-0000-0000-0000-000000000014',
  'accepted',
  now()
);

insert into public.conversations (
  id, request_id, user_a_id, user_b_id, status, activated_at
) values (
  'b0000000-0000-4000-8000-000000000031',
  'b0000000-0000-4000-8000-000000000021',
  'b0000000-0000-0000-0000-000000000013',
  'b0000000-0000-0000-0000-000000000014',
  'active',
  now()
);

insert into public.user_reports (
  id, reporter_user_id, reported_user_id, conversation_id, category, details
) values (
  'b0000000-0000-4000-8000-000000000041',
  'b0000000-0000-0000-0000-000000000013',
  'b0000000-0000-0000-0000-000000000014',
  'b0000000-0000-4000-8000-000000000031',
  'harassment',
  'Moderasyon konsolu için yeterince uzun test açıklaması.'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000013","role":"authenticated"}', true);

select is(public.get_my_staff_role(), null, 'normal kullanıcı personel rolü alamaz');
select throws_ok(
  $$select * from public.get_moderation_reports('pending', 50)$$,
  '42501',
  'Bu işlem için moderasyon yetkisi gerekli.',
  'normal kullanıcı moderasyon kuyruğunu göremez'
);

select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000012","role":"authenticated"}', true);
select is(public.get_my_staff_role(), 'moderator', 'moderatör kendi rolünü görür');
select is(
  (select count(*)::integer from public.get_moderation_reports('pending', 50)),
  1,
  'moderatör bekleyen şikâyeti kuyrukta görür'
);
select lives_ok(
  $$
    select public.update_moderation_report(
      'b0000000-0000-4000-8000-000000000041',
      'reviewing',
      null
    )
  $$,
  'moderatör şikâyeti incelemeye alabilir'
);
select is(
  (
    select report_status
    from public.get_moderation_reports('reviewing', 50)
    where report_id = 'b0000000-0000-4000-8000-000000000041'
  ),
  'reviewing',
  'inceleme durumu kaydedilir'
);
select throws_ok(
  $$
    select public.suspend_user_for_report(
      'b0000000-0000-4000-8000-000000000041',
      'Moderatör hesap yaptırımı uygulayamaz.'
    )
  $$,
  '42501',
  'Bu işlem için moderasyon yetkisi gerekli.',
  'moderatör hesap askıya alamaz'
);

select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000011","role":"authenticated"}', true);
select is(public.get_my_staff_role(), 'admin', 'admin kendi rolünü görür');
select throws_ok(
  $$select * from public.get_moderation_reports('invalid', 50)$$,
  '23514',
  'Geçersiz şikâyet durumu.',
  'geçersiz kuyruk filtresi reddedilir'
);
select is(
  (select count(*)::integer from public.get_moderation_reports(null, 50)),
  1,
  'admin bütün şikâyet durumlarını görebilir'
);
select lives_ok(
  $$
    select public.suspend_user_for_report(
      'b0000000-0000-4000-8000-000000000041',
      'İncelenen şikâyet nedeniyle test hesabı askıya alındı.'
    )
  $$,
  'admin şikâyet üzerinden hesabı askıya alabilir'
);

reset role;
select is(
  (select status::text from public.accounts where user_id = 'b0000000-0000-0000-0000-000000000014'),
  'suspended',
  'hedef hesap askıya alınır'
);
select is(
  (select status from public.user_reports where id = 'b0000000-0000-4000-8000-000000000041'),
  'resolved',
  'işleme alınan şikâyet sonuçlandırılır'
);
select is(
  (select status::text from public.conversations where id = 'b0000000-0000-4000-8000-000000000031'),
  'ended',
  'hedef kullanıcının açık görüşmesi kapatılır'
);
select is(
  (select ended_reason from public.conversations where id = 'b0000000-0000-4000-8000-000000000031'),
  'moderation_suspended',
  'görüşmenin moderasyon nedeniyle kapandığı kaydedilir'
);
select is(
  (
    select count(*)::integer
    from public.moderation_actions
    where target_user_id = 'b0000000-0000-0000-0000-000000000014'
      and action = 'account_suspended'
  ),
  1,
  'askıya alma işlemi audit kaydına yazılır'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000011","role":"authenticated"}', true);
select lives_ok(
  $$
    select public.restore_suspended_user(
      'b0000000-0000-0000-0000-000000000014',
      'İnceleme tamamlandı ve test hesabı geri açıldı.'
    )
  $$,
  'admin askıdaki hesabı geri açabilir'
);

reset role;
select is(
  (select status::text from public.accounts where user_id = 'b0000000-0000-0000-0000-000000000014'),
  'active',
  'hesap önceki etkin durumuna döner'
);
select is(
  (
    select count(*)::integer
    from public.moderation_actions
    where target_user_id = 'b0000000-0000-0000-0000-000000000014'
  ),
  2,
  'askıya alma ve geri açma ayrı audit kayıtlarıdır'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000011","role":"authenticated"}', true);
select throws_ok(
  $$
    select public.suspend_user_for_report(
      'b0000000-0000-4000-8000-000000000041',
      'Eski şikâyet tekrar yaptırım için kullanılamaz.'
    )
  $$,
  '55000',
  'Sonuçlanmış şikâyet yaptırım için yeniden kullanılamaz.',
  'sonuçlanmış şikâyet yeni yaptırım için kullanılamaz'
);
select throws_ok(
  $$
    select public.update_moderation_report(
      'b0000000-0000-4000-8000-000000000041',
      'dismissed',
      'Sonuçlanmış kayıt tekrar değiştirilemez.'
    )
  $$,
  '55000',
  'Sonuçlanmış şikâyet yeniden değiştirilemez.',
  'sonuçlanmış şikâyet tekrar değiştirilemez'
);

select * from finish();
rollback;
