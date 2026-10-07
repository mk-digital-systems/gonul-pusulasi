-- Gönül Pusulası / Faz 4 moderasyon konsolu temeli
-- Rol tabanlı şikâyet kuyruğu ve yalnızca admin tarafından uygulanabilen
-- manuel hesap askıya alma/geri açma işlemleri. Otomatik yaptırım yoktur.

begin;

alter table public.conversations
  drop constraint conversations_ended_reason_allowed,
  add constraint conversations_ended_reason_allowed
    check (
      ended_reason is null
      or ended_reason in (
        'pre_meeting_timeout',
        'user_ended',
        'superseded_by_active_match',
        'inactivity_ended',
        'user_blocked',
        'moderation_suspended'
      )
    );

create table public.moderation_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('moderator', 'admin')),
  is_active boolean not null default true,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger moderation_staff_set_updated_at
before update on public.moderation_staff
for each row execute function public.set_updated_at();

-- İlk yönetici kullanıcı. Canlı projede Auth kullanıcısı mevcutsa yetki atanır;
-- temiz yerel kurulumlarda kullanıcı henüz yoksa migration başarısız olmaz.
insert into public.moderation_staff (
  user_id,
  role,
  created_by_user_id
)
select
  auth_user.id,
  'admin',
  auth_user.id
from auth.users auth_user
where auth_user.id = '68192831-8e6b-4256-adb1-bc606d7af308'
on conflict (user_id) do update
set role = excluded.role,
    is_active = true,
    updated_at = now();

alter table public.user_reports
  add column reviewed_by_user_id uuid references auth.users(id) on delete set null,
  add column resolution_note text check (
    resolution_note is null
    or char_length(btrim(resolution_note)) between 10 and 1000
  );

-- Şikâyetçi kendi temel kaydını RLS üzerinden okuyabilse de personel kimliği ve
-- iç değerlendirme notu kullanıcı Data API erişimine açılmaz.
revoke select on table public.user_reports from authenticated;
grant select (
  id,
  reporter_user_id,
  reported_user_id,
  conversation_id,
  category,
  details,
  status,
  created_at,
  reviewed_at
) on table public.user_reports to authenticated;

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  report_id uuid references public.user_reports(id) on delete set null,
  action text not null check (action in ('account_suspended', 'account_restored')),
  previous_status public.account_status not null,
  new_status public.account_status not null,
  reason text not null check (char_length(btrim(reason)) between 10 and 1000),
  created_at timestamptz not null default now()
);

create index moderation_actions_target_created_idx
  on public.moderation_actions (target_user_id, created_at desc);

create function public.require_moderation_staff(p_admin_only boolean default false)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
begin
  if v_user_id is null then
    raise exception using errcode = 'insufficient_privilege', message = 'Oturum gerekli.';
  end if;

  select staff.role into v_role
  from public.moderation_staff staff
  where staff.user_id = v_user_id
    and staff.is_active;

  if v_role is null or (p_admin_only and v_role <> 'admin') then
    raise exception using errcode = 'insufficient_privilege', message = 'Bu işlem için moderasyon yetkisi gerekli.';
  end if;

  return v_role;
end;
$$;

create function public.get_my_staff_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select staff.role
  from public.moderation_staff staff
  where staff.user_id = auth.uid()
    and staff.is_active;
$$;

create function public.get_moderation_reports(
  p_status text default null,
  p_limit integer default 50
)
returns table (
  report_id uuid,
  reporter_user_id uuid,
  reporter_display_name text,
  reported_user_id uuid,
  reported_display_name text,
  reported_account_status text,
  conversation_id uuid,
  category text,
  details text,
  report_status text,
  created_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by_user_id uuid,
  resolution_note text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_moderation_staff(false);

  if p_status is not null
    and p_status not in ('pending', 'reviewing', 'resolved', 'dismissed') then
    raise exception using errcode = 'check_violation', message = 'Geçersiz şikâyet durumu.';
  end if;

  return query
  select
    report.id,
    report.reporter_user_id,
    reporter_profile.display_name,
    report.reported_user_id,
    reported_profile.display_name,
    reported_account.status::text,
    report.conversation_id,
    report.category,
    report.details,
    report.status,
    report.created_at,
    report.reviewed_at,
    report.reviewed_by_user_id,
    report.resolution_note
  from public.user_reports report
  left join public.profiles reporter_profile
    on reporter_profile.user_id = report.reporter_user_id
  left join public.profiles reported_profile
    on reported_profile.user_id = report.reported_user_id
  left join public.accounts reported_account
    on reported_account.user_id = report.reported_user_id
  where p_status is null or report.status = p_status
  order by
    case report.status
      when 'pending' then 1
      when 'reviewing' then 2
      else 3
    end,
    report.created_at
  limit greatest(1, least(coalesce(p_limit, 50), 100));
end;
$$;

create function public.update_moderation_report(
  p_report_id uuid,
  p_status text,
  p_resolution_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_report public.user_reports%rowtype;
  v_note text := nullif(btrim(p_resolution_note), '');
begin
  perform public.require_moderation_staff(false);

  if p_status not in ('reviewing', 'resolved', 'dismissed') then
    raise exception using errcode = 'check_violation', message = 'Geçersiz moderasyon durumu.';
  end if;

  if p_status in ('resolved', 'dismissed')
    and (v_note is null or char_length(v_note) not between 10 and 1000) then
    raise exception using errcode = 'check_violation', message = 'Sonuç notu 10–1000 karakter olmalıdır.';
  end if;

  select * into v_report
  from public.user_reports report
  where report.id = p_report_id
  for update;

  if not found then
    raise exception using errcode = 'no_data_found', message = 'Şikâyet bulunamadı.';
  end if;

  if v_report.status in ('resolved', 'dismissed') then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Sonuçlanmış şikâyet yeniden değiştirilemez.';
  end if;

  update public.user_reports
  set status = p_status,
      reviewed_by_user_id = v_user_id,
      reviewed_at = now(),
      resolution_note = case
        when p_status in ('resolved', 'dismissed') then v_note
        else resolution_note
      end
  where id = p_report_id;

  insert into public.account_events (actor_user_id, subject_user_id, event_type, metadata)
  values (
    v_user_id,
    v_user_id,
    'moderation.report_status_changed',
    jsonb_build_object(
      'report_id', p_report_id,
      'from', v_report.status,
      'to', p_status
    )
  );
end;
$$;

create function public.suspend_user_for_report(
  p_report_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_user_id uuid := auth.uid();
  v_report public.user_reports%rowtype;
  v_account public.accounts%rowtype;
  v_reason text := btrim(p_reason);
begin
  perform public.require_moderation_staff(true);

  if v_reason is null or char_length(v_reason) not between 10 and 1000 then
    raise exception using errcode = 'check_violation', message = 'Askıya alma gerekçesi 10–1000 karakter olmalıdır.';
  end if;

  select * into v_report
  from public.user_reports report
  where report.id = p_report_id
  for update;

  if not found or v_report.reported_user_id is null then
    raise exception using errcode = 'no_data_found', message = 'Şikâyet veya hedef kullanıcı bulunamadı.';
  end if;

  if v_report.status in ('resolved', 'dismissed') then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Sonuçlanmış şikâyet yaptırım için yeniden kullanılamaz.';
  end if;

  if v_report.reported_user_id = v_admin_user_id or exists (
    select 1
    from public.moderation_staff staff
    where staff.user_id = v_report.reported_user_id
      and staff.is_active
  ) then
    raise exception using errcode = 'insufficient_privilege', message = 'Etkin moderasyon personeli bu akıştan askıya alınamaz.';
  end if;

  select * into v_account
  from public.accounts account
  where account.user_id = v_report.reported_user_id
  for update;

  if not found or v_account.status in ('suspended', 'deletion_requested') then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Hesap askıya alınamaz.';
  end if;

  update public.accounts
  set status = 'suspended'
  where user_id = v_report.reported_user_id;

  update public.introduction_requests request
  set status = 'expired', responded_at = now()
  where request.status = 'pending'
    and v_report.reported_user_id in (request.sender_id, request.recipient_id);

  update public.conversations conversation
  set status = 'ended',
      ended_at = now(),
      ended_reason = 'moderation_suspended',
      ended_by_user_id = null
  where conversation.status in ('pre_meeting', 'active')
    and v_report.reported_user_id in (conversation.user_a_id, conversation.user_b_id);

  update public.user_reports
  set status = 'resolved',
      reviewed_by_user_id = v_admin_user_id,
      reviewed_at = now(),
      resolution_note = v_reason
  where id = p_report_id;

  insert into public.moderation_actions (
    staff_user_id,
    target_user_id,
    report_id,
    action,
    previous_status,
    new_status,
    reason
  ) values (
    v_admin_user_id,
    v_report.reported_user_id,
    p_report_id,
    'account_suspended',
    v_account.status,
    'suspended',
    v_reason
  );

  insert into public.account_events (actor_user_id, subject_user_id, event_type, metadata)
  values (
    v_admin_user_id,
    v_report.reported_user_id,
    'moderation.account_suspended',
    jsonb_build_object('report_id', p_report_id)
  );
end;
$$;

create function public.restore_suspended_user(
  p_user_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_user_id uuid := auth.uid();
  v_account public.accounts%rowtype;
  v_restore_status public.account_status := 'active';
  v_reason text := btrim(p_reason);
begin
  perform public.require_moderation_staff(true);

  if v_reason is null or char_length(v_reason) not between 10 and 1000 then
    raise exception using errcode = 'check_violation', message = 'Geri açma gerekçesi 10–1000 karakter olmalıdır.';
  end if;

  select * into v_account
  from public.accounts account
  where account.user_id = p_user_id
  for update;

  if not found or v_account.status <> 'suspended' then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Yalnızca askıdaki hesap geri açılabilir.';
  end if;

  select action.previous_status into v_restore_status
  from public.moderation_actions action
  where action.target_user_id = p_user_id
    and action.action = 'account_suspended'
  order by action.created_at desc, action.id desc
  limit 1;

  if v_restore_status is null or v_restore_status not in ('active', 'paused') then
    v_restore_status := 'active';
  end if;

  update public.accounts
  set status = v_restore_status,
      paused_at = case when v_restore_status = 'paused' then coalesce(paused_at, now()) else null end
  where user_id = p_user_id;

  insert into public.moderation_actions (
    staff_user_id,
    target_user_id,
    action,
    previous_status,
    new_status,
    reason
  ) values (
    v_admin_user_id,
    p_user_id,
    'account_restored',
    'suspended',
    v_restore_status,
    v_reason
  );

  insert into public.account_events (actor_user_id, subject_user_id, event_type, metadata)
  values (
    v_admin_user_id,
    p_user_id,
    'moderation.account_restored',
    jsonb_build_object('restored_status', v_restore_status)
  );
end;
$$;

alter table public.moderation_staff enable row level security;
alter table public.moderation_actions enable row level security;

revoke all on table public.moderation_staff from anon, authenticated;
revoke all on table public.moderation_actions from anon, authenticated;

revoke execute on function public.require_moderation_staff(boolean)
  from public, anon, authenticated;
revoke execute on function public.get_my_staff_role() from public, anon;
revoke execute on function public.get_moderation_reports(text, integer) from public, anon;
revoke execute on function public.update_moderation_report(uuid, text, text) from public, anon;
revoke execute on function public.suspend_user_for_report(uuid, text) from public, anon;
revoke execute on function public.restore_suspended_user(uuid, text) from public, anon;

grant execute on function public.get_my_staff_role() to authenticated;
grant execute on function public.get_moderation_reports(text, integer) to authenticated;
grant execute on function public.update_moderation_report(uuid, text, text) to authenticated;
grant execute on function public.suspend_user_for_report(uuid, text) to authenticated;
grant execute on function public.restore_suspended_user(uuid, text) to authenticated;

notify pgrst, 'reload schema';

commit;
