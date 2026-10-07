-- Gönül Pusulası / Faz 4 şikâyet bağlamı
-- Moderasyon personeline yalnızca şikâyete bağlı kapı cevaplarını gösterir.
-- Görüşme mesajları bu RPC'nin veri kümesine bilinçli olarak dahil edilmez.

begin;

create function public.get_moderation_report_context(p_report_id uuid)
returns table (
  report_id uuid,
  reporter_display_name text,
  reported_display_name text,
  reported_account_status text,
  conversation_id uuid,
  category text,
  details text,
  report_status text,
  created_at timestamptz,
  reviewed_at timestamptz,
  resolution_note text,
  request_id uuid,
  answering_user_id uuid,
  answering_display_name text,
  question_prompt text,
  answer_text text,
  answer_display_order smallint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_moderation_staff(false);

  return query
  select
    report.id,
    reporter_profile.display_name,
    reported_profile.display_name,
    reported_account.status::text,
    report.conversation_id,
    report.category,
    report.details,
    report.status,
    report.created_at,
    report.reviewed_at,
    report.resolution_note,
    conversation.request_id,
    request.sender_id,
    answering_profile.display_name,
    answer.prompt_snapshot,
    answer.answer_text,
    answer.display_order
  from public.user_reports report
  left join public.profiles reporter_profile
    on reporter_profile.user_id = report.reporter_user_id
  left join public.profiles reported_profile
    on reported_profile.user_id = report.reported_user_id
  left join public.accounts reported_account
    on reported_account.user_id = report.reported_user_id
  left join public.conversations conversation
    on conversation.id = report.conversation_id
  left join public.introduction_requests request
    on request.id = conversation.request_id
  left join public.profiles answering_profile
    on answering_profile.user_id = request.sender_id
  left join public.introduction_request_answers answer
    on answer.request_id = request.id
  where report.id = p_report_id
  order by answer.display_order nulls last;
end;
$$;

revoke execute on function public.get_moderation_report_context(uuid)
  from public, anon;
grant execute on function public.get_moderation_report_context(uuid)
  to authenticated;

notify pgrst, 'reload schema';

commit;
