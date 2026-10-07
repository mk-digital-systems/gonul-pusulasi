begin;

create extension if not exists pgtap with schema extensions;
select plan(19);

select has_table('public', 'compatibility_question_sets', 'uyum soru setleri tablosu var');
select has_table('public', 'compatibility_questions', 'uyum sorulari tablosu var');
select has_table('public', 'compatibility_options', 'uyum secenekleri tablosu var');
select has_table('public', 'compatibility_profiles', 'uyum profilleri tablosu var');
select has_table('public', 'compatibility_answers', 'uyum cevaplari tablosu var');
select has_table('public', 'compatibility_answer_acceptances', 'kabul edilen cevaplar tablosu var');
select has_function('public', 'save_my_compatibility_answers', array['jsonb'], 'uyum kaydetme fonksiyonu var');
select has_function('public', 'get_my_discovery_candidates', array['integer'], 'kesif fonksiyonu var');

select is(
  (select count(*)::integer from public.compatibility_questions where is_active),
  18,
  'aktif sette 18 soru var'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'faz2-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'faz2-b@example.test', '', now(), '{}', '{}', now(), now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000011","role":"authenticated"}', true);
select lives_ok(
  $$select public.complete_onboarding('Deniz', date '1985-05-12', 'woman', 34, 'long_term_relationship', 35, 50)$$,
  'birinci kullanici onboarding tamamlar'
);
select lives_ok(
  $test$
    select public.save_my_compatibility_answers((
      select jsonb_agg(jsonb_build_object(
        'questionCode', q.code,
        'answerOptionId', (select min(o.id) from public.compatibility_options o where o.question_code = q.code),
        'importance', 'important',
        'acceptedOptionIds', (select jsonb_agg(o.id) from public.compatibility_options o where o.question_code = q.code)
      ) order by q.display_order)
      from public.compatibility_questions q
      where q.is_active
    ))
  $test$,
  'birinci kullanici uyum cevaplarini kaydeder'
);
select lives_ok(
  $$select public.save_my_door_questions(array['meaningful_weekend', 'communication_expectation', 'conflict_repair'])$$,
  'birinci kullanici uc kapi sorusu secer'
);

select is((select count(*)::integer from public.compatibility_answers), 18, 'RLS kendi 18 cevabini gosterir');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"20000000-0000-0000-0000-000000000012","role":"authenticated"}', true);
select is((select count(*)::integer from public.compatibility_answers), 0, 'diger kullanicinin cevaplari gorunmez');
select lives_ok(
  $$select public.complete_onboarding('Eren', date '1983-02-10', 'man', 6, 'marriage', 35, 50)$$,
  'ikinci kullanici onboarding tamamlar'
);
select lives_ok(
  $test$
    select public.save_my_compatibility_answers((
      select jsonb_agg(jsonb_build_object(
        'questionCode', q.code,
        'answerOptionId', (select min(o.id) from public.compatibility_options o where o.question_code = q.code),
        'importance', 'important',
        'acceptedOptionIds', (select jsonb_agg(o.id) from public.compatibility_options o where o.question_code = q.code)
      ) order by q.display_order)
      from public.compatibility_questions q
      where q.is_active
    ))
  $test$,
  'ikinci kullanici uyum cevaplarini kaydeder'
);
select lives_ok(
  $$select public.save_my_door_questions(array['feeling_safe', 'future_picture', 'support_style'])$$,
  'ikinci kullanici uc kapi sorusu secer'
);

select is(
  (select count(*)::integer from public.get_my_discovery_candidates(10)),
  1,
  'karsilikli yas cinsiyet ve uyum filtrelerinden bir aday gecer'
);

select throws_ok(
  $$select public.save_my_compatibility_answers('[]'::jsonb)$$,
  '23514',
  'Bütün uyum soruları yanıtlanmalıdır.',
  'eksik cevap seti reddedilir'
);

select * from finish();
rollback;
