-- Gönül Pusulası / Faz 4 moderasyon denetim geçmişi
-- Hassas yaptırım gerekçelerini yalnızca admin rolüne açar.

begin;

create index moderation_actions_created_idx
  on public.moderation_actions (created_at desc, id desc);

create function public.get_moderation_action_log(p_limit integer default 100)
returns table (
  action_id uuid,
  staff_user_id uuid,
  staff_display_name text,
  target_user_id uuid,
  target_display_name text,
  report_id uuid,
  action text,
  previous_status text,
  new_status text,
  reason text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_moderation_staff(true);

  return query
  select
    moderation_action.id,
    moderation_action.staff_user_id,
    staff_profile.display_name,
    moderation_action.target_user_id,
    target_profile.display_name,
    moderation_action.report_id,
    moderation_action.action,
    moderation_action.previous_status::text,
    moderation_action.new_status::text,
    moderation_action.reason,
    moderation_action.created_at
  from public.moderation_actions moderation_action
  left join public.profiles staff_profile
    on staff_profile.user_id = moderation_action.staff_user_id
  left join public.profiles target_profile
    on target_profile.user_id = moderation_action.target_user_id
  order by moderation_action.created_at desc, moderation_action.id desc
  limit greatest(1, least(coalesce(p_limit, 100), 200));
end;
$$;

revoke execute on function public.get_moderation_action_log(integer)
  from public, anon;
grant execute on function public.get_moderation_action_log(integer)
  to authenticated;

notify pgrst, 'reload schema';

commit;
