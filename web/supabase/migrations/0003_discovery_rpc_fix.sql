-- Gönül Pusulası / Faz 2 düzeltmesi
-- Keşif RPC'sindeki çıktı kolonu ve CTE kolon adı çakışmalarını kaldırır.
-- Mevcut uyum cevaplarını veya profil verilerini değiştirmez.

begin;

create or replace function public.get_my_discovery_candidates(p_limit integer default 10)
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
    select question_set.id as question_set_id
    from public.compatibility_question_sets question_set
    where question_set.is_active
  ),
  viewer as (
    select
      profile.user_id as viewer_user_id,
      profile.gender as viewer_gender,
      extract(year from age(current_date, profile.date_of_birth))::integer as viewer_age,
      coalesce(
        profile.age_preference_min,
        greatest(
          30,
          extract(year from age(current_date, profile.date_of_birth))::integer - 5
        )
      ) as minimum_age,
      coalesce(
        profile.age_preference_max,
        extract(year from age(current_date, profile.date_of_birth))::integer + 5
      ) as maximum_age
    from public.profiles profile
    join public.accounts account on account.user_id = profile.user_id
    join public.compatibility_profiles compatibility_profile
      on compatibility_profile.user_id = profile.user_id
    join active_set
      on active_set.question_set_id = compatibility_profile.question_set_id
    where profile.user_id = auth.uid()
      and account.status = 'active'
      and account.onboarding_completed_at is not null
  ),
  candidates as (
    select
      profile.user_id as candidate_user_id,
      profile.display_name as candidate_display_name,
      extract(year from age(current_date, profile.date_of_birth))::integer as candidate_age,
      city.name as candidate_city_name,
      goal.label as candidate_relationship_goal
    from public.profiles profile
    join public.accounts account on account.user_id = profile.user_id
    join public.compatibility_profiles compatibility_profile
      on compatibility_profile.user_id = profile.user_id
    join active_set
      on active_set.question_set_id = compatibility_profile.question_set_id
    join public.cities city on city.id = profile.city_id
    join public.relationship_goals goal
      on goal.code = profile.relationship_goal_code
    cross join viewer
    where profile.user_id <> viewer.viewer_user_id
      and account.status = 'active'
      and account.onboarding_completed_at is not null
      and profile.birth_date_confirmed_at is not null
      and profile.gender <> viewer.viewer_gender
      and extract(year from age(current_date, profile.date_of_birth))::integer
        between viewer.minimum_age and viewer.maximum_age
      and viewer.viewer_age between
        coalesce(
          profile.age_preference_min,
          greatest(
            30,
            extract(year from age(current_date, profile.date_of_birth))::integer - 5
          )
        )
        and coalesce(
          profile.age_preference_max,
          extract(year from age(current_date, profile.date_of_birth))::integer + 5
        )
  ),
  answer_sets as (
    select
      answer.user_id as answer_user_id,
      answer.question_code as answer_question_code,
      answer.answer_option_id,
      answer.importance,
      array_agg(acceptance.option_id order by acceptance.option_id) as accepted_option_ids
    from public.compatibility_answers answer
    join public.compatibility_answer_acceptances acceptance
      on acceptance.user_id = answer.user_id
      and acceptance.question_code = answer.question_code
    group by
      answer.user_id,
      answer.question_code,
      answer.answer_option_id,
      answer.importance
  ),
  match_rows as (
    select
      candidate.candidate_user_id,
      question.prompt as shared_prompt,
      (
        candidate_answer.answer_option_id = any(viewer_answer.accepted_option_ids)
        and viewer_answer.answer_option_id = any(candidate_answer.accepted_option_ids)
      ) as is_mutual_match,
      greatest(
        case viewer_answer.importance
          when 'very_important' then 4
          when 'important' then 2
          else 1
        end,
        case candidate_answer.importance
          when 'very_important' then 4
          when 'important' then 2
          else 1
        end
      ) as match_weight
    from candidates candidate
    join answer_sets candidate_answer
      on candidate_answer.answer_user_id = candidate.candidate_user_id
    join answer_sets viewer_answer
      on viewer_answer.answer_user_id = auth.uid()
      and viewer_answer.answer_question_code = candidate_answer.answer_question_code
    join public.compatibility_questions question
      on question.code = candidate_answer.answer_question_code
  ),
  scored_candidates as (
    select
      match_row.candidate_user_id,
      sum(
        case when match_row.is_mutual_match then match_row.match_weight else 0 end
      )::numeric / nullif(sum(match_row.match_weight), 0) as compatibility_score,
      array_agg(
        match_row.shared_prompt
        order by match_row.match_weight desc, match_row.shared_prompt
      ) filter (where match_row.is_mutual_match) as mutual_shared_points
    from match_rows match_row
    group by match_row.candidate_user_id
  )
  select
    candidate.candidate_user_id,
    candidate.candidate_display_name,
    candidate.candidate_age,
    candidate.candidate_city_name,
    candidate.candidate_relationship_goal,
    case
      when scored.compatibility_score >= 0.82 then 'Çok güçlü uyum'
      when scored.compatibility_score >= 0.68 then 'Güçlü uyum'
      else 'Umut verici uyum'
    end,
    coalesce(
      scored.mutual_shared_points[1:3],
      array[]::text[]
    )
  from candidates candidate
  join scored_candidates scored
    on scored.candidate_user_id = candidate.candidate_user_id
  where scored.compatibility_score >= 0.60
  order by
    scored.compatibility_score desc,
    candidate.candidate_display_name,
    candidate.candidate_user_id
  limit greatest(1, least(coalesce(p_limit, 10), 25));
$$;

revoke execute on function public.get_my_discovery_candidates(integer)
  from public, anon;
grant execute on function public.get_my_discovery_candidates(integer)
  to authenticated;

-- SQL Editor ile uygulandıktan sonra Data API'nin yeni fonksiyon gövdesini
-- gecikmeden kullanmasını sağlar.
notify pgrst, 'reload schema';

commit;
