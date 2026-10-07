begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

select has_function(
  'public',
  'get_moderation_report_context',
  array['uuid'],
  'şikâyet bağlamı fonksiyonu var'
);
select is(
  has_function_privilege(
    'authenticated',
    'public.get_moderation_report_context(uuid)',
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
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'context-moderator@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'context-sender@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000013', 'authenticated', 'authenticated', 'context-recipient@example.test', '', now(), '{}', '{}', now(), now());

update public.profiles
set display_name = case user_id
  when 'c0000000-0000-0000-0000-000000000011' then 'Bağlam Moderatörü'
  when 'c0000000-0000-0000-0000-000000000012' then 'Cevaplayan Kullanıcı'
  else 'Şikâyet Edilen Kullanıcı'
end
where user_id::text like 'c0000000-%';

insert into public.moderation_staff (user_id, role, created_by_user_id)
values (
  'c0000000-0000-0000-0000-000000000011',
  'moderator',
  'c0000000-0000-0000-0000-000000000011'
);

insert into public.introduction_requests (
  id, sender_id, recipient_id, status, responded_at
) values (
  'c0000000-0000-4000-8000-000000000021',
  'c0000000-0000-0000-0000-000000000012',
  'c0000000-0000-0000-0000-000000000013',
  'accepted',
  now()
);

insert into public.introduction_request_answers (
  request_id,
  question_code,
  prompt_snapshot,
  answer_text,
  display_order
) values
  (
    'c0000000-0000-4000-8000-000000000021',
    'meaningful_weekend',
    'Senin için gerçekten iyi geçmiş bir hafta sonu nasıl görünür?',
    'Sakin bir kahvaltı ve uzun bir doğa yürüyüşüyle iyi hissederim.',
    1
  ),
  (
    'c0000000-0000-4000-8000-000000000021',
    'communication_expectation',
    'Bir ilişkide günlük iletişimden temel beklentin nedir?',
    'Gün içinde kısa da olsa açık ve düzenli iletişim kurmayı önemserim.',
    2
  ),
  (
    'c0000000-0000-4000-8000-000000000021',
    'conflict_repair',
    'Bir anlaşmazlıktan sonra yeniden yakınlaşmak için nasıl bir yaklaşım beklersin?',
    'Sakinleşip karşılıklı dinleyerek ve çözüm arayarak ilerlemeyi tercih ederim.',
    3
  );

insert into public.conversations (
  id, request_id, user_a_id, user_b_id, status
) values (
  'c0000000-0000-4000-8000-000000000031',
  'c0000000-0000-4000-8000-000000000021',
  'c0000000-0000-0000-0000-000000000012',
  'c0000000-0000-0000-0000-000000000013',
  'pre_meeting'
);

insert into public.user_reports (
  id, reporter_user_id, reported_user_id, conversation_id, category, details
) values (
  'c0000000-0000-4000-8000-000000000041',
  'c0000000-0000-0000-0000-000000000012',
  'c0000000-0000-0000-0000-000000000013',
  'c0000000-0000-4000-8000-000000000031',
  'inappropriate_content',
  'Kapı sorusu cevaplarıyla ilişkili bağlam inceleme testi.'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000012","role":"authenticated"}', true);
select throws_ok(
  $$
    select *
    from public.get_moderation_report_context(
      'c0000000-0000-4000-8000-000000000041'
    )
  $$,
  '42501',
  'Bu işlem için moderasyon yetkisi gerekli.',
  'normal kullanıcı şikâyet bağlamını göremez'
);

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000011","role":"authenticated"}', true);
select is(
  (
    select count(*)::integer
    from public.get_moderation_report_context(
      'c0000000-0000-4000-8000-000000000041'
    )
  ),
  3,
  'moderatör şikâyete bağlı üç kapı cevabını görür'
);
select is(
  (
    select min(answering_display_name)
    from public.get_moderation_report_context(
      'c0000000-0000-4000-8000-000000000041'
    )
  ),
  'Cevaplayan Kullanıcı',
  'cevap sahibinin görünen adı bağlamda yer alır'
);
select is(
  (
    select array_agg(answer_display_order order by answer_display_order)
    from public.get_moderation_report_context(
      'c0000000-0000-4000-8000-000000000041'
    )
  ),
  array[1, 2, 3]::smallint[],
  'kapı cevapları özgün sırasıyla döner'
);
select is(
  (
    select count(*)::integer
    from public.get_moderation_report_context(
      'c0000000-0000-4000-8000-000000000099'
    )
  ),
  0,
  'bilinmeyen şikâyet kimliği veri döndürmez'
);
select is(
  (
    select count(*)::integer
    from information_schema.parameters parameter
    where parameter.specific_schema = 'public'
      and parameter.specific_name like 'get_moderation_report_context_%'
      and parameter.parameter_name in ('body', 'message_body')
  ),
  0,
  'RPC görüşme mesajı alanı yayınlamaz'
);

select * from finish();
rollback;
