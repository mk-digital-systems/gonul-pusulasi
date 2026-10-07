begin;

create extension if not exists pgtap with schema extensions;
select plan(28);

select has_table('public', 'door_question_catalog', 'kapi sorusu katalog tablosu var');
select has_table('public', 'user_door_questions', 'kullanici kapi sorulari tablosu var');
select has_table('public', 'introduction_requests', 'tanisma basvurulari tablosu var');
select has_table('public', 'introduction_request_answers', 'basvuru cevaplari tablosu var');
select has_table('public', 'conversations', 'gorusmeler tablosu var');
select has_function('public', 'save_my_door_questions', array['text[]'], 'kapi sorusu kaydetme fonksiyonu var');
select has_function('public', 'get_candidate_door_questions', array['uuid'], 'aday kapi sorulari fonksiyonu var');
select has_function('public', 'send_introduction_request', array['uuid', 'jsonb'], 'basvuru gonderme fonksiyonu var');
select has_function('public', 'respond_to_introduction_request', array['uuid', 'text'], 'basvuru yanitlama fonksiyonu var');
select has_function('public', 'get_my_introduction_requests', array[]::text[], 'basvuru listeleme fonksiyonu var');

select is(
  (select count(*)::integer from public.door_question_catalog where is_active),
  12,
  'katalogda 12 etkin kapi sorusu var'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '40000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'faz3-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '40000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'faz3-b@example.test', '', now(), '{}', '{}', now(), now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000011","role":"authenticated"}', true);

select lives_ok(
  $$select public.complete_onboarding('Derya', date '1985-05-12', 'woman', 34, 'long_term_relationship', 35, 50)$$,
  'birinci kullanici onboarding tamamlar'
);

select lives_ok(
  $test$
    select public.save_my_compatibility_answers((
      select jsonb_agg(jsonb_build_object(
        'questionCode', question.code,
        'answerOptionId', (select min(option.id) from public.compatibility_options option where option.question_code = question.code),
        'importance', 'important',
        'acceptedOptionIds', (select jsonb_agg(option.id) from public.compatibility_options option where option.question_code = question.code)
      ) order by question.display_order)
      from public.compatibility_questions question
      where question.is_active
    ))
  $test$,
  'birinci kullanici uyum cevaplarini kaydeder'
);

select throws_ok(
  $$select public.save_my_door_questions(array['meaningful_weekend', 'communication_expectation'])$$,
  '23514',
  'Tam olarak 3 etkin kapı sorusu seçilmelidir.',
  'iki kapi sorusu reddedilir'
);

select lives_ok(
  $$select public.save_my_door_questions(array['meaningful_weekend', 'communication_expectation', 'conflict_repair'])$$,
  'birinci kullanici uc kapi sorusu secer'
);

select is((select count(*)::integer from public.user_door_questions), 3, 'RLS kendi uc kapi sorusunu gosterir');

select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000012","role":"authenticated"}', true);

select lives_ok(
  $$select public.complete_onboarding('Mert', date '1983-02-10', 'man', 6, 'marriage', 35, 50)$$,
  'ikinci kullanici onboarding tamamlar'
);

select lives_ok(
  $test$
    select public.save_my_compatibility_answers((
      select jsonb_agg(jsonb_build_object(
        'questionCode', question.code,
        'answerOptionId', (select min(option.id) from public.compatibility_options option where option.question_code = question.code),
        'importance', 'important',
        'acceptedOptionIds', (select jsonb_agg(option.id) from public.compatibility_options option where option.question_code = question.code)
      ) order by question.display_order)
      from public.compatibility_questions question
      where question.is_active
    ))
  $test$,
  'ikinci kullanici uyum cevaplarini kaydeder'
);

select lives_ok(
  $$select public.save_my_door_questions(array['feeling_safe', 'future_picture', 'support_style'])$$,
  'ikinci kullanici uc kapi sorusu secer'
);

select is(
  (select count(*)::integer from public.get_candidate_door_questions('40000000-0000-0000-0000-000000000011')),
  3,
  'uygun adayin uc kapi sorusu gorulur'
);

select lives_ok(
  $test$
    select public.send_introduction_request(
      '40000000-0000-0000-0000-000000000011',
      (
        select jsonb_agg(jsonb_build_object(
          'questionCode', question.question_code,
          'answer', 'Bu soruya samimi ve yeterince ayrıntılı bir cevap veriyorum.'
        ) order by question.display_order)
        from public.get_candidate_door_questions('40000000-0000-0000-0000-000000000011') question
      )
    )
  $test$,
  'ikinci kullanici tanisma basvurusu gonderir'
);

select is((select count(*)::integer from public.introduction_request_answers), 3, 'gonderen kendi uc cevabini gorur');
select is((select count(*)::integer from public.get_my_introduction_requests()), 1, 'gonderen basvurusunu listeler');

select set_config('request.jwt.claims', '{"sub":"40000000-0000-0000-0000-000000000011","role":"authenticated"}', true);

select is((select count(*)::integer from public.get_my_introduction_requests()), 1, 'alici gelen basvuruyu listeler');

select lives_ok(
  $$select public.respond_to_introduction_request((select id from public.introduction_requests limit 1), 'accept')$$,
  'alici basvuruyu kabul eder'
);

select is((select count(*)::integer from public.conversations), 1, 'kabulde bir on gorusme olusur');
select is((select status::text from public.introduction_requests limit 1), 'accepted', 'basvuru kabul edildi olur');
select is((select status::text from public.conversations limit 1), 'pre_meeting', 'gorusme 96 saatlik on gorusme olarak baslar');

select * from finish();
rollback;
