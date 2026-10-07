-- Gönül Pusulası / Faz 2
-- Sürümlü uyum soruları, kullanıcı cevapları ve açıklanabilir aday keşfi.

begin;

create type public.compatibility_importance as enum (
  'not_important',
  'important',
  'very_important'
);

create table public.compatibility_question_sets (
  id uuid primary key default gen_random_uuid(),
  version integer not null unique check (version > 0),
  title text not null check (char_length(btrim(title)) between 2 and 100),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index compatibility_question_sets_one_active
  on public.compatibility_question_sets (is_active)
  where is_active;

create table public.compatibility_questions (
  code text primary key check (code ~ '^[a-z][a-z0-9_]{2,49}$'),
  question_set_id uuid not null references public.compatibility_question_sets(id) on delete cascade,
  prompt text not null check (char_length(btrim(prompt)) between 5 and 240),
  help_text text check (help_text is null or char_length(btrim(help_text)) between 5 and 300),
  display_order smallint not null check (display_order > 0),
  is_required boolean not null default true,
  is_active boolean not null default true,
  unique (question_set_id, display_order)
);

create table public.compatibility_options (
  id bigint generated always as identity primary key,
  question_code text not null references public.compatibility_questions(code) on delete cascade,
  code text not null check (code ~ '^[a-z][a-z0-9_]{1,49}$'),
  label text not null check (char_length(btrim(label)) between 1 and 160),
  display_order smallint not null check (display_order > 0),
  unique (question_code, code),
  unique (question_code, display_order),
  unique (question_code, id)
);

create table public.compatibility_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  question_set_id uuid not null references public.compatibility_question_sets(id),
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.compatibility_answers (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_code text not null references public.compatibility_questions(code) on delete cascade,
  answer_option_id bigint not null,
  importance public.compatibility_importance not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, question_code),
  foreign key (question_code, answer_option_id)
    references public.compatibility_options(question_code, id)
);

create table public.compatibility_answer_acceptances (
  user_id uuid not null,
  question_code text not null,
  option_id bigint not null,
  created_at timestamptz not null default now(),
  primary key (user_id, question_code, option_id),
  foreign key (user_id, question_code)
    references public.compatibility_answers(user_id, question_code) on delete cascade,
  foreign key (question_code, option_id)
    references public.compatibility_options(question_code, id)
);

create index compatibility_answers_user_idx
  on public.compatibility_answers (user_id);
create index compatibility_acceptances_user_idx
  on public.compatibility_answer_acceptances (user_id);
create index compatibility_profiles_set_idx
  on public.compatibility_profiles (question_set_id, completed_at);

create trigger compatibility_profiles_set_updated_at
before update on public.compatibility_profiles
for each row execute function public.set_updated_at();

create trigger compatibility_answers_set_updated_at
before update on public.compatibility_answers
for each row execute function public.set_updated_at();

insert into public.compatibility_question_sets (id, version, title, is_active)
values ('20000000-0000-0000-0000-000000000001', 1, 'Temel uyum seti', true);

insert into public.compatibility_questions
  (question_set_id, code, prompt, help_text, display_order)
values
  ('20000000-0000-0000-0000-000000000001', 'relationship_pace', 'Bir ilişkinin ilerleme temposu sana nasıl uyar?', 'Kendi hızını ve karşı tarafta kabul edebileceğin hızları seç.', 10),
  ('20000000-0000-0000-0000-000000000001', 'marriage_timing', 'Evliliğe bakışın hangisine daha yakın?', 'Bugünkü yaklaşımını seç; bu cevap geleceğe verilmiş değişmez bir söz değildir.', 20),
  ('20000000-0000-0000-0000-000000000001', 'children_plan', 'Çocuk sahibi olma konusundaki yaklaşımın nedir?', 'Mevcut düşüncene en yakın seçeneği işaretle.', 30),
  ('20000000-0000-0000-0000-000000000001', 'smoking', 'Sigara kullanımı konusunda sana uyan seçenek hangisi?', null, 40),
  ('20000000-0000-0000-0000-000000000001', 'alcohol', 'Alkol kullanımı konusunda sana uyan seçenek hangisi?', null, 50),
  ('20000000-0000-0000-0000-000000000001', 'relocation', 'İlişki için şehir değiştirme konusunda nasılsın?', null, 60),
  ('20000000-0000-0000-0000-000000000001', 'family_closeness', 'Ailelerle görüşme sıklığı açısından sana ne uyar?', null, 70),
  ('20000000-0000-0000-0000-000000000001', 'daily_communication', 'Günlük iletişim sıklığında ne beklersin?', null, 80),
  ('20000000-0000-0000-0000-000000000001', 'conflict_style', 'Bir anlaşmazlık olduğunda nasıl ilerlemeyi tercih edersin?', null, 90),
  ('20000000-0000-0000-0000-000000000001', 'social_energy', 'Sosyal hayat düzenin hangisine daha yakın?', null, 100),
  ('20000000-0000-0000-0000-000000000001', 'weekend_style', 'İdeal hafta sonun hangisine daha yakın?', null, 110),
  ('20000000-0000-0000-0000-000000000001', 'financial_style', 'Para yönetiminde yaklaşımın hangisine daha yakın?', null, 120),
  ('20000000-0000-0000-0000-000000000001', 'pets', 'Evcil hayvanlarla yaşam konusunda nasılsın?', null, 130),
  ('20000000-0000-0000-0000-000000000001', 'home_order', 'Ev düzeni konusunda kendini nasıl tanımlarsın?', null, 140),
  ('20000000-0000-0000-0000-000000000001', 'career_priority', 'Kariyerin günlük hayatındaki yeri nedir?', null, 150),
  ('20000000-0000-0000-0000-000000000001', 'personal_space', 'İlişkide kişisel alan ihtiyacın nasıldır?', null, 160),
  ('20000000-0000-0000-0000-000000000001', 'affection_style', 'Sevgini en çok nasıl göstermeyi seversin?', null, 170),
  ('20000000-0000-0000-0000-000000000001', 'decision_style', 'Ortak kararlarda sana uyan yaklaşım hangisi?', null, 180);

insert into public.compatibility_options (question_code, code, label, display_order) values
  ('relationship_pace', 'slow', 'Yavaş, zamana yayarak', 10),
  ('relationship_pace', 'steady', 'Dengeli ve doğal bir tempoda', 20),
  ('relationship_pace', 'fast', 'Niyet netse hızlı ilerleyerek', 30),

  ('marriage_timing', 'soon', 'Uygun kişiyle yakın dönemde evlilik isterim', 10),
  ('marriage_timing', 'later', 'Önce ilişkiyi yaşayıp sonra karar vermek isterim', 20),
  ('marriage_timing', 'undecided', 'Şimdilik kesin bir zaman düşünmüyorum', 30),

  ('children_plan', 'want', 'Çocuk sahibi olmak isterim', 10),
  ('children_plan', 'have_and_open', 'Çocuğum var, yeniden çocuk sahibi olmaya açığım', 20),
  ('children_plan', 'have_no_more', 'Çocuğum var, yeniden çocuk düşünmüyorum', 30),
  ('children_plan', 'do_not_want', 'Çocuk sahibi olmak istemiyorum', 40),
  ('children_plan', 'undecided', 'Kararsızım', 50),

  ('smoking', 'never', 'Kullanmıyorum', 10),
  ('smoking', 'occasionally', 'Ara sıra kullanıyorum', 20),
  ('smoking', 'regularly', 'Düzenli kullanıyorum', 30),
  ('smoking', 'quitting', 'Bırakma sürecindeyim', 40),

  ('alcohol', 'never', 'Kullanmıyorum', 10),
  ('alcohol', 'occasionally', 'Sosyal ortamlarda veya ara sıra', 20),
  ('alcohol', 'regularly', 'Düzenli kullanıyorum', 30),

  ('relocation', 'open', 'Uygun koşullarda şehir değiştirebilirim', 10),
  ('relocation', 'same_city', 'Aynı şehirde yaşamayı tercih ederim', 20),
  ('relocation', 'remote_first', 'Önce uzaktan tanışmaya açığım', 30),
  ('relocation', 'undecided', 'Koşullara göre karar veririm', 40),

  ('family_closeness', 'frequent', 'Sık ve yakın temas', 10),
  ('family_closeness', 'balanced', 'Dengeli ve düzenli görüşme', 20),
  ('family_closeness', 'independent', 'Daha bağımsız bir düzen', 30),

  ('daily_communication', 'frequent', 'Gün içinde sık iletişim', 10),
  ('daily_communication', 'regular', 'Günde birkaç anlamlı temas', 20),
  ('daily_communication', 'light', 'Müsait oldukça, baskısız iletişim', 30),

  ('conflict_style', 'talk_now', 'Konuyu bekletmeden konuşmak', 10),
  ('conflict_style', 'pause_then_talk', 'Sakinleşip sonra konuşmak', 20),
  ('conflict_style', 'write_first', 'Önce yazarak düşüncelerimi toparlamak', 30),

  ('social_energy', 'social', 'Sık sosyalleşmeyi severim', 10),
  ('social_energy', 'balanced', 'Sosyal hayat ve sakin zamanı dengelerim', 20),
  ('social_energy', 'quiet', 'Daha sakin ve küçük çevreli bir hayatı severim', 30),

  ('weekend_style', 'outdoors', 'Dışarıda, gezerek ve keşfederek', 10),
  ('weekend_style', 'home', 'Evde, sakin ve dinlenerek', 20),
  ('weekend_style', 'social', 'Arkadaşlar ve etkinliklerle', 30),
  ('weekend_style', 'mixed', 'Ruh halime göre karışık', 40),

  ('financial_style', 'planner', 'Bütçe ve birikim odaklıyım', 10),
  ('financial_style', 'balanced', 'Planlıyım ama keyif harcamalarına da yer veririm', 20),
  ('financial_style', 'spontaneous', 'Daha esnek ve anlık karar veririm', 30),

  ('pets', 'love', 'Evcil hayvanlarla yaşamayı severim', 10),
  ('pets', 'open', 'Olmasına açığım', 20),
  ('pets', 'no_pet', 'Evcil hayvanlı bir yaşam istemem', 30),
  ('pets', 'allergy', 'Alerji veya sağlık nedeniyle yaşayamam', 40),

  ('home_order', 'very_orderly', 'Düzen ve temizlik benim için çok önemlidir', 10),
  ('home_order', 'balanced', 'Genel olarak düzenli ama esneğim', 20),
  ('home_order', 'relaxed', 'Daha rahat ve dağınık olabilirim', 30),

  ('career_priority', 'central', 'Kariyer şu dönemde önceliklerimin başında', 10),
  ('career_priority', 'balanced', 'İş ve özel hayat dengesini gözetirim', 20),
  ('career_priority', 'life_first', 'Özel hayatı kariyerin önünde tutarım', 30),

  ('personal_space', 'high', 'Düzenli olarak yalnız zamana ihtiyaç duyarım', 10),
  ('personal_space', 'balanced', 'Birlikte zaman ve kişisel alan dengesi isterim', 20),
  ('personal_space', 'low', 'Çoğu zamanı birlikte geçirmek isterim', 30),

  ('affection_style', 'words', 'Sözlerle ve güzel ifadelerle', 10),
  ('affection_style', 'time', 'Birlikte kaliteli zaman geçirerek', 20),
  ('affection_style', 'actions', 'Yardım ederek ve davranışlarımla', 30),
  ('affection_style', 'touch', 'Fiziksel yakınlıkla', 40),

  ('decision_style', 'together', 'Konuşup ortak karar vererek', 10),
  ('decision_style', 'expertise', 'Konu kimle ilgiliyse onun ağırlığıyla', 20),
  ('decision_style', 'flexible', 'Duruma göre esnek biçimde', 30);

create function public.save_my_compatibility_answers(p_answers jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_question_set_id uuid;
  v_expected_count integer;
  v_item jsonb;
  v_question_code text;
  v_answer_option_id bigint;
  v_importance text;
  v_accepted jsonb;
begin
  if v_user_id is null then
    raise exception using errcode = 'insufficient_privilege', message = 'Oturum gerekli.';
  end if;

  if not exists (
    select 1 from public.accounts
    where user_id = v_user_id
      and status = 'active'
      and onboarding_completed_at is not null
  ) then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Uyum soruları için etkin ve tamamlanmış profil gerekli.';
  end if;

  select id into v_question_set_id
  from public.compatibility_question_sets
  where is_active;

  select count(*) into v_expected_count
  from public.compatibility_questions
  where question_set_id = v_question_set_id
    and is_active
    and is_required;

  if p_answers is null
    or jsonb_typeof(p_answers) <> 'array'
    or jsonb_array_length(p_answers) <> v_expected_count then
    raise exception using errcode = 'check_violation', message = 'Bütün uyum soruları yanıtlanmalıdır.';
  end if;

  if (
    select count(*) <> count(distinct item ->> 'questionCode')
    from jsonb_array_elements(p_answers) item
  ) then
    raise exception using errcode = 'check_violation', message = 'Aynı soru birden fazla kez gönderilemez.';
  end if;

  if (
    select count(*)
    from jsonb_array_elements(p_answers) item
    where item ->> 'importance' = 'very_important'
  ) > 5 then
    raise exception using errcode = 'check_violation', message = 'En fazla 5 soru Çok önemli seçilebilir.';
  end if;

  for v_item in select value from jsonb_array_elements(p_answers)
  loop
    v_question_code := v_item ->> 'questionCode';
    v_importance := v_item ->> 'importance';
    v_accepted := v_item -> 'acceptedOptionIds';

    begin
      v_answer_option_id := (v_item ->> 'answerOptionId')::bigint;
    exception when others then
      raise exception using errcode = 'check_violation', message = 'Uyum cevabı geçersiz.';
    end;

    if v_importance not in ('not_important', 'important', 'very_important') then
      raise exception using errcode = 'check_violation', message = 'Önem derecesi geçersiz.';
    end if;

    if not exists (
      select 1
      from public.compatibility_questions q
      join public.compatibility_options o on o.question_code = q.code
      where q.question_set_id = v_question_set_id
        and q.is_active
        and q.is_required
        and q.code = v_question_code
        and o.id = v_answer_option_id
    ) then
      raise exception using errcode = 'check_violation', message = 'Soru veya cevap seçeneği geçersiz.';
    end if;

    if jsonb_typeof(v_accepted) <> 'array' or jsonb_array_length(v_accepted) = 0 then
      raise exception using errcode = 'check_violation', message = 'Her soru için en az bir kabul edilen cevap seçilmelidir.';
    end if;

    if exists (
      select 1
      from jsonb_array_elements_text(v_accepted) accepted(value)
      where not exists (
        select 1 from public.compatibility_options o
        where o.question_code = v_question_code
          and o.id = accepted.value::bigint
      )
    ) then
      raise exception using errcode = 'check_violation', message = 'Kabul edilen cevaplardan biri geçersiz.';
    end if;
  end loop;

  delete from public.compatibility_answers where user_id = v_user_id;

  for v_item in select value from jsonb_array_elements(p_answers)
  loop
    v_question_code := v_item ->> 'questionCode';
    v_answer_option_id := (v_item ->> 'answerOptionId')::bigint;
    v_importance := v_item ->> 'importance';
    v_accepted := v_item -> 'acceptedOptionIds';

    insert into public.compatibility_answers
      (user_id, question_code, answer_option_id, importance)
    values
      (v_user_id, v_question_code, v_answer_option_id, v_importance::public.compatibility_importance);

    insert into public.compatibility_answer_acceptances
      (user_id, question_code, option_id)
    select v_user_id, v_question_code, accepted.value::bigint
    from (
      select distinct value
      from jsonb_array_elements_text(v_accepted)
    ) accepted;
  end loop;

  insert into public.compatibility_profiles (user_id, question_set_id, completed_at)
  values (v_user_id, v_question_set_id, now())
  on conflict (user_id) do update
    set question_set_id = excluded.question_set_id,
        completed_at = excluded.completed_at;

  insert into public.account_events (actor_user_id, subject_user_id, event_type)
  values (v_user_id, v_user_id, 'compatibility.answers_saved');
end;
$$;

create function public.get_my_discovery_candidates(p_limit integer default 10)
returns table (
  user_id uuid,
  display_name text,
  age integer,
  city_name text,
  relationship_goal text,
  compatibility_band text,
  shared_points text[]
)
language sql
stable
security definer
set search_path = ''
as $$
  with active_set as (
    select id
    from public.compatibility_question_sets
    where is_active
  ),
  viewer as (
    select
      p.user_id,
      p.gender,
      extract(year from age(current_date, p.date_of_birth))::integer as age,
      coalesce(
        p.age_preference_min,
        greatest(30, extract(year from age(current_date, p.date_of_birth))::integer - 5)
      ) as minimum_age,
      coalesce(
        p.age_preference_max,
        extract(year from age(current_date, p.date_of_birth))::integer + 5
      ) as maximum_age
    from public.profiles p
    join public.accounts a on a.user_id = p.user_id
    join public.compatibility_profiles cp on cp.user_id = p.user_id
    join active_set s on s.id = cp.question_set_id
    where p.user_id = auth.uid()
      and a.status = 'active'
      and a.onboarding_completed_at is not null
  ),
  candidates as (
    select
      p.user_id,
      p.display_name,
      extract(year from age(current_date, p.date_of_birth))::integer as age,
      c.name as city_name,
      rg.label as relationship_goal
    from public.profiles p
    join public.accounts a on a.user_id = p.user_id
    join public.compatibility_profiles cp on cp.user_id = p.user_id
    join active_set s on s.id = cp.question_set_id
    join public.cities c on c.id = p.city_id
    join public.relationship_goals rg on rg.code = p.relationship_goal_code
    cross join viewer v
    where p.user_id <> v.user_id
      and a.status = 'active'
      and a.onboarding_completed_at is not null
      and p.birth_date_confirmed_at is not null
      and p.gender <> v.gender
      and extract(year from age(current_date, p.date_of_birth))::integer
        between v.minimum_age and v.maximum_age
      and v.age between
        coalesce(
          p.age_preference_min,
          greatest(30, extract(year from age(current_date, p.date_of_birth))::integer - 5)
        )
        and coalesce(
          p.age_preference_max,
          extract(year from age(current_date, p.date_of_birth))::integer + 5
        )
  ),
  answer_sets as (
    select
      a.user_id,
      a.question_code,
      a.answer_option_id,
      a.importance,
      array_agg(aa.option_id order by aa.option_id) as accepted_option_ids
    from public.compatibility_answers a
    join public.compatibility_answer_acceptances aa
      on aa.user_id = a.user_id
      and aa.question_code = a.question_code
    group by a.user_id, a.question_code, a.answer_option_id, a.importance
  ),
  match_rows as (
    select
      c.user_id,
      q.prompt,
      (
        ca.answer_option_id = any(va.accepted_option_ids)
        and va.answer_option_id = any(ca.accepted_option_ids)
      ) as is_mutual_match,
      greatest(
        case va.importance
          when 'very_important' then 4
          when 'important' then 2
          else 1
        end,
        case ca.importance
          when 'very_important' then 4
          when 'important' then 2
          else 1
        end
      ) as weight
    from candidates c
    join answer_sets ca on ca.user_id = c.user_id
    join answer_sets va
      on va.user_id = auth.uid()
      and va.question_code = ca.question_code
    join public.compatibility_questions q on q.code = ca.question_code
  ),
  scored as (
    select
      user_id,
      sum(case when is_mutual_match then weight else 0 end)::numeric
        / nullif(sum(weight), 0) as score,
      array_agg(prompt order by weight desc, prompt)
        filter (where is_mutual_match) as shared_points
    from match_rows
    group by user_id
  )
  select
    c.user_id,
    c.display_name,
    c.age,
    c.city_name,
    c.relationship_goal,
    case
      when s.score >= 0.82 then 'Çok güçlü uyum'
      when s.score >= 0.68 then 'Güçlü uyum'
      else 'Umut verici uyum'
    end as compatibility_band,
    coalesce(s.shared_points[1:3], array[]::text[]) as shared_points
  from candidates c
  join scored s on s.user_id = c.user_id
  where s.score >= 0.60
  order by s.score desc, c.display_name, c.user_id
  limit greatest(1, least(coalesce(p_limit, 10), 25));
$$;

alter table public.compatibility_question_sets enable row level security;
alter table public.compatibility_questions enable row level security;
alter table public.compatibility_options enable row level security;
alter table public.compatibility_profiles enable row level security;
alter table public.compatibility_answers enable row level security;
alter table public.compatibility_answer_acceptances enable row level security;

create policy compatibility_question_sets_read_active
on public.compatibility_question_sets for select
to authenticated
using (is_active);

create policy compatibility_questions_read_active
on public.compatibility_questions for select
to authenticated
using (
  is_active and exists (
    select 1 from public.compatibility_question_sets s
    where s.id = question_set_id and s.is_active
  )
);

create policy compatibility_options_read_active
on public.compatibility_options for select
to authenticated
using (
  exists (
    select 1
    from public.compatibility_questions q
    join public.compatibility_question_sets s on s.id = q.question_set_id
    where q.code = question_code and q.is_active and s.is_active
  )
);

create policy compatibility_profiles_read_own
on public.compatibility_profiles for select
to authenticated
using (user_id = auth.uid());

create policy compatibility_answers_read_own
on public.compatibility_answers for select
to authenticated
using (user_id = auth.uid());

create policy compatibility_acceptances_read_own
on public.compatibility_answer_acceptances for select
to authenticated
using (user_id = auth.uid());

revoke all on table public.compatibility_question_sets from anon, authenticated;
revoke all on table public.compatibility_questions from anon, authenticated;
revoke all on table public.compatibility_options from anon, authenticated;
revoke all on table public.compatibility_profiles from anon, authenticated;
revoke all on table public.compatibility_answers from anon, authenticated;
revoke all on table public.compatibility_answer_acceptances from anon, authenticated;

grant select on table public.compatibility_question_sets to authenticated;
grant select on table public.compatibility_questions to authenticated;
grant select on table public.compatibility_options to authenticated;
grant select on table public.compatibility_profiles to authenticated;
grant select on table public.compatibility_answers to authenticated;
grant select on table public.compatibility_answer_acceptances to authenticated;

revoke execute on function public.save_my_compatibility_answers(jsonb) from public, anon;
revoke execute on function public.get_my_discovery_candidates(integer) from public, anon;
grant execute on function public.save_my_compatibility_answers(jsonb) to authenticated;
grant execute on function public.get_my_discovery_candidates(integer) to authenticated;

commit;
