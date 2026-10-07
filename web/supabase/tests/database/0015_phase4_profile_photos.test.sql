begin;

create extension if not exists pgtap with schema extensions;
select plan(34);

select has_table('public', 'profile_photos', 'profil fotoğrafı tablosu var');
select has_function('public', 'get_profile_photo_path', array['uuid'], 'yetkili fotoğraf yolu RPCsi var');
select has_function('public', 'get_visible_profile_photo_user_ids', array['uuid[]'], 'görünür fotoğraf listesi RPCsi var');
select has_function('public', 'submit_my_profile_photo', array['text', 'integer', 'integer', 'integer'], 'fotoğraf kayıt RPCsi var');
select has_function('public', 'remove_my_profile_photo', array[]::text[], 'fotoğraf silme RPCsi var');
select has_function('public', 'get_moderation_profile_photos', array['text', 'integer'], 'fotoğraf moderasyon kuyruğu RPCsi var');
select has_function('public', 'moderate_profile_photo', array['uuid', 'text', 'text'], 'fotoğraf karar RPCsi var');
select is(
  (select relrowsecurity from pg_class where oid = 'public.profile_photos'::regclass),
  true,
  'profil fotoğrafı tablosunda RLS etkin'
);
select is(
  has_table_privilege('authenticated', 'public.profile_photos', 'select'),
  true,
  'authenticated rolü RLS sınırında kendi kaydını okuyabilir'
);
select is(
  has_table_privilege('authenticated', 'public.profile_photos', 'insert'),
  false,
  'authenticated rolü fotoğraf kaydına doğrudan ekleme yapamaz'
);
select is(
  has_table_privilege('authenticated', 'public.profile_photos', 'update'),
  false,
  'authenticated rolü moderasyon durumunu doğrudan değiştiremez'
);
select is(
  has_function_privilege('authenticated', 'public.can_view_profile_photo(uuid)', 'execute'),
  false,
  'iç fotoğraf yetki fonksiyonu istemciden çağrılamaz'
);
select is(
  (select public from storage.buckets where id = 'profile-photos'),
  false,
  'profil fotoğrafı bucketı private'
);
select is(
  (select file_size_limit::bigint from storage.buckets where id = 'profile-photos'),
  2097152::bigint,
  'Storage nesne boyutu 2 MB ile sınırlı'
);
select is(
  (select allowed_mime_types @> array['image/webp']::text[] from storage.buckets where id = 'profile-photos'),
  true,
  'Storage yalnızca işlenmiş WebP nesnesi kabul eder'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'ae6db6cf-7852-4fef-9fa0-fba3a6afac55', 'authenticated', 'authenticated', 'photo-admin@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'photo-moderator@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'photo-owner@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000013', 'authenticated', 'authenticated', 'photo-participant@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000014', 'authenticated', 'authenticated', 'photo-unrelated@example.test', '', now(), '{}', '{}', now(), now());

update public.profiles
set display_name = case user_id
  when 'a1000000-0000-0000-0000-000000000012' then 'Fotoğraf Sahibi'
  when 'a1000000-0000-0000-0000-000000000013' then 'Görüşme Katılımcısı'
  else display_name
end
where user_id in (
  'a1000000-0000-0000-0000-000000000012',
  'a1000000-0000-0000-0000-000000000013'
);

insert into public.moderation_staff (user_id, role, is_active, created_by_user_id) values
  (
    'ae6db6cf-7852-4fef-9fa0-fba3a6afac55',
    'admin',
    true,
    'ae6db6cf-7852-4fef-9fa0-fba3a6afac55'
  ),
  (
    'a1000000-0000-0000-0000-000000000011',
    'moderator',
    true,
    'ae6db6cf-7852-4fef-9fa0-fba3a6afac55'
  );

insert into public.profile_photos (
  user_id, object_path, byte_size, width, height
) values (
  'a1000000-0000-0000-0000-000000000012',
  'a1000000-0000-0000-0000-000000000012/11111111-1111-4111-8111-111111111111.webp',
  100000,
  1024,
  1024
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000012","role":"authenticated"}', true);
select is((select count(*)::integer from public.profile_photos), 1, 'fotoğraf sahibi kendi metadata kaydını okuyabilir');
select is(
  public.get_profile_photo_path('a1000000-0000-0000-0000-000000000012'),
  'a1000000-0000-0000-0000-000000000012/11111111-1111-4111-8111-111111111111.webp',
  'fotoğraf sahibi bekleyen kendi fotoğrafına erişebilir'
);

select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000013","role":"authenticated"}', true);
select is((select count(*)::integer from public.profile_photos), 0, 'başka kullanıcı fotoğraf metadata kaydını doğrudan okuyamaz');
select is(
  public.get_profile_photo_path('a1000000-0000-0000-0000-000000000012'),
  null,
  'bekleyen fotoğraf başka kullanıcıya sunulmaz'
);
select throws_ok(
  $$select * from public.get_moderation_profile_photos('pending', 100)$$,
  '42501',
  'Bu işlem için moderasyon yetkisi gerekli.',
  'normal kullanıcı fotoğraf moderasyon kuyruğunu göremez'
);

select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000011","role":"authenticated"}', true);
select is(
  (select count(*)::integer from public.get_moderation_profile_photos('pending', 100)),
  1,
  'moderatör bekleyen fotoğrafı kuyrukta görür'
);
select lives_ok(
  $$
    select public.moderate_profile_photo(
      'a1000000-0000-0000-0000-000000000012',
      'approved',
      null
    )
  $$,
  'moderatör bekleyen fotoğrafı onaylayabilir'
);

reset role;
select is(
  (select status::text from public.profile_photos where user_id = 'a1000000-0000-0000-0000-000000000012'),
  'approved',
  'fotoğraf kararı onaylandı olarak kaydedilir'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000014","role":"authenticated"}', true);
select is(
  public.get_profile_photo_path('a1000000-0000-0000-0000-000000000012'),
  null,
  'onaylı fotoğraf ilgisiz kullanıcıya açılmaz'
);

reset role;
insert into public.introduction_requests (
  id, sender_id, recipient_id, status, responded_at
) values (
  'a1000000-0000-4000-8000-000000000021',
  'a1000000-0000-0000-0000-000000000013',
  'a1000000-0000-0000-0000-000000000012',
  'accepted',
  now()
);
insert into public.conversations (
  id, request_id, user_a_id, user_b_id, status
) values (
  'a1000000-0000-4000-8000-000000000031',
  'a1000000-0000-4000-8000-000000000021',
  'a1000000-0000-0000-0000-000000000012',
  'a1000000-0000-0000-0000-000000000013',
  'pre_meeting'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000013","role":"authenticated"}', true);
select is(
  public.get_profile_photo_path('a1000000-0000-0000-0000-000000000012'),
  'a1000000-0000-0000-0000-000000000012/11111111-1111-4111-8111-111111111111.webp',
  'açık görüşme katılımcısı onaylı fotoğrafı görebilir'
);
select is(
  (
    select count(*)::integer
    from public.get_visible_profile_photo_user_ids(
      array['a1000000-0000-0000-0000-000000000012']::uuid[]
    )
  ),
  1,
  'toplu görünürlük RPCsi yetkili fotoğrafı döndürür'
);

select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000011","role":"authenticated"}', true);
select throws_ok(
  $$
    select public.moderate_profile_photo(
      'a1000000-0000-0000-0000-000000000012',
      'rejected',
      'Daha sonra yeniden değerlendirme denemesi.'
    )
  $$,
  '55000',
  'Yalnızca bekleyen fotoğraf incelenebilir.',
  'sonuçlanmış fotoğraf ikinci kez incelenemez'
);

reset role;
select is(
  (
    select count(*)::integer
    from public.account_events event
    where event.subject_user_id = 'a1000000-0000-0000-0000-000000000012'
      and event.event_type = 'moderation.profile_photo_reviewed'
  ),
  1,
  'fotoğraf kararı denetim olayına yazılır'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000013","role":"authenticated"}', true);
select throws_ok(
  $$
    select *
    from public.get_visible_profile_photo_user_ids(
      array(select gen_random_uuid() from generate_series(1, 26))
    )
  $$,
  '23514',
  'En fazla 25 fotoğraf sorgulanabilir.',
  'toplu fotoğraf sorgusu 25 kullanıcıyla sınırlıdır'
);

reset role;
insert into public.profile_photos (
  user_id, object_path, byte_size, width, height
) values (
  'a1000000-0000-0000-0000-000000000014',
  'a1000000-0000-0000-0000-000000000014/22222222-2222-4222-8222-222222222222.webp',
  120000,
  1024,
  1024
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1000000-0000-0000-0000-000000000011","role":"authenticated"}', true);
select throws_ok(
  $$
    select public.moderate_profile_photo(
      'a1000000-0000-0000-0000-000000000014',
      'rejected',
      'kısa'
    )
  $$,
  '23514',
  'Ret gerekçesi 10–1000 karakter olmalıdır.',
  'fotoğraf reddi açıklayıcı gerekçe ister'
);
select lives_ok(
  $$
    select public.moderate_profile_photo(
      'a1000000-0000-0000-0000-000000000014',
      'rejected',
      'Fotoğraf topluluk kurallarına uygun değil.'
    )
  $$,
  'moderatör geçerli gerekçeyle fotoğrafı reddedebilir'
);

reset role;
select is(
  (select status::text from public.profile_photos where user_id = 'a1000000-0000-0000-0000-000000000014'),
  'rejected',
  'reddedilen fotoğrafın durumu kaydedilir'
);
select is(
  (select moderation_note from public.profile_photos where user_id = 'a1000000-0000-0000-0000-000000000014'),
  'Fotoğraf topluluk kurallarına uygun değil.',
  'ret gerekçesi fotoğraf sahibi için saklanır'
);
select is(
  (
    select count(*)::integer
    from pg_policies policy
    where policy.schemaname = 'storage'
      and policy.tablename = 'objects'
      and (
        coalesce(policy.qual, '') like '%profile-photos%'
        or coalesce(policy.with_check, '') like '%profile-photos%'
      )
  ),
  0,
  'private bucket için tarayıcıya doğrudan Storage policy verilmez'
);

select * from finish();
rollback;
