-- Gönül Pusulası / Faz 4 sabit admin ve personel-üye ayrımı
-- Daha önce uygulanmış migrationları değiştirmeden birincil admini
-- düzeltir; aktif moderasyon personelini aday/arayış akışlarından ayırır.

begin;

-- Canlı projede mevcut bir admin varken yeni UUID Auth tarafında yoksa
-- yetkiyi boşa düşürmek yerine tüm transactionı geri al.
do $$
begin
  if exists (
    select 1 from public.moderation_staff staff where staff.role = 'admin'
  ) and not exists (
    select 1
    from auth.users auth_user
    where auth_user.id = 'ae6db6cf-7852-4fef-9fa0-fba3a6afac55'
  ) then
    raise exception using
      errcode = 'no_data_found',
      message = 'Yeni birincil admin Auth kullanıcısı bulunamadı: ae6db6cf-7852-4fef-9fa0-fba3a6afac55';
  end if;
end;
$$;

-- Yanlış ilk admin atamasını kaldır. Bu kullanıcının Auth, hesap ve
-- profil verileri korunur; yalnızca moderasyon personeli yetkisi kaldırılır.
delete from public.moderation_staff
where role = 'admin'
  and user_id <> 'ae6db6cf-7852-4fef-9fa0-fba3a6afac55';

-- Yeni birincil admin yalnızca Auth kullanıcısı gerçekten mevcutsa atanır.
insert into public.moderation_staff (
  user_id,
  role,
  is_active,
  created_by_user_id
)
select
  auth_user.id,
  'admin',
  true,
  auth_user.id
from auth.users auth_user
where auth_user.id = 'ae6db6cf-7852-4fef-9fa0-fba3a6afac55'
on conflict (user_id) do update
set role = 'admin',
    is_active = true,
    created_by_user_id = excluded.created_by_user_id,
    updated_at = now();

-- Eski sürümden kalmış ve onboarding'i tamamlanmış moderatör
-- kayıtları yeni ayrıma uymuyorsa veri silmeden pasifleştirilir.
update public.moderation_staff staff
set is_active = false,
    updated_at = now()
where staff.role = 'moderator'
  and staff.is_active
  and exists (
    select 1
    from public.accounts account
    where account.user_id = staff.user_id
      and account.onboarding_completed_at is not null
  );

-- Tek ve değiştirilemez admin kimliği. Moderatörler admin rolüne
-- yükseltilemez; yeni admin hesabı ancak yeni bir migration ile belirlenir.
alter table public.moderation_staff
  add constraint moderation_staff_fixed_admin
  check (
    role <> 'admin'
    or (
      user_id = 'ae6db6cf-7852-4fef-9fa0-fba3a6afac55'
      and is_active
    )
  );

create unique index moderation_staff_single_admin
  on public.moderation_staff (role)
  where role = 'admin';

create function public.enforce_moderation_staff_separation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'admin' then
    if new.user_id <> 'ae6db6cf-7852-4fef-9fa0-fba3a6afac55' or not new.is_active then
      raise exception using errcode = 'insufficient_privilege', message = 'Admin kimliği sabittir ve pasifleştirilemez.';
    end if;
    return new;
  end if;

  if new.role <> 'moderator' then
    raise exception using errcode = 'check_violation', message = 'Geçersiz moderasyon rolü.';
  end if;

  if new.is_active and exists (
    select 1
    from public.accounts account
    where account.user_id = new.user_id
      and account.onboarding_completed_at is not null
  ) then
    raise exception using
      errcode = 'object_not_in_prerequisite_state',
      message = 'Tamamlanmış üye profiline moderatör yetkisi verilemez.';
  end if;

  return new;
end;
$$;

create trigger enforce_moderation_staff_separation_before_write
before insert or update of user_id, role, is_active on public.moderation_staff
for each row execute function public.enforce_moderation_staff_separation();

-- Aktif moderatör hesabı daha sonra onboarding tamamlayarak üye akışına
-- giremez. Birincil adminin geçmiş profil verisi varsa korunur ve keşiften
-- ayrıca filtrelenir.
create function public.block_member_onboarding_for_moderation_staff()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.onboarding_completed_at is not null
    and old.onboarding_completed_at is null
    and exists (
      select 1
      from public.moderation_staff staff
      where staff.user_id = new.user_id
        and staff.is_active
    ) then
    raise exception using
      errcode = 'insufficient_privilege',
      message = 'Moderasyon personeli üye onboarding akışını tamamlayamaz.';
  end if;

  return new;
end;
$$;

create trigger block_member_onboarding_for_moderation_staff_before_update
before update of onboarding_completed_at on public.accounts
for each row execute function public.block_member_onboarding_for_moderation_staff();

-- Personel atama yalnızca sabit admin tarafından ve yalnızca ayrı bir
-- moderatör hesabına yapılabilir. Normal/onboarding'i tamamlanmış üyeler
-- moderatöre dönüştürülmez.
create or replace function public.manage_moderation_staff(
  p_user_id uuid,
  p_role text,
  p_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_user_id uuid := auth.uid();
  v_existing public.moderation_staff%rowtype;
  v_existing_found boolean;
begin
  perform public.require_moderation_staff(true);

  if v_admin_user_id <> 'ae6db6cf-7852-4fef-9fa0-fba3a6afac55' then
    raise exception using errcode = 'insufficient_privilege', message = 'Yalnızca birincil admin personel yönetebilir.';
  end if;

  if p_user_id is null
    or p_role <> 'moderator'
    or p_is_active is null
    or p_user_id = v_admin_user_id then
    raise exception using errcode = 'check_violation', message = 'Yalnızca ayrı bir moderatör hesabı yönetilebilir.';
  end if;

  if not exists (
    select 1
    from auth.users auth_user
    where auth_user.id = p_user_id
  ) then
    raise exception using errcode = 'no_data_found', message = 'Auth kullanıcısı bulunamadı.';
  end if;

  if p_is_active and not exists (
    select 1
    from public.accounts account
    where account.user_id = p_user_id
      and account.status = 'active'
      and account.onboarding_completed_at is null
  ) then
    raise exception using
      errcode = 'object_not_in_prerequisite_state',
      message = 'Moderatör hesabı etkin olmalı ve üye onboarding akışını tamamlamamış olmalıdır.';
  end if;

  if p_is_active and exists (
    select 1
    from public.introduction_requests request
    where request.status = 'pending'
      and p_user_id in (request.sender_id, request.recipient_id)
  ) then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Açık tanışma başvurusu olan hesap moderatör yapılamaz.';
  end if;

  if p_is_active and exists (
    select 1
    from public.conversations conversation
    where conversation.status in ('pre_meeting', 'active')
      and p_user_id in (conversation.user_a_id, conversation.user_b_id)
  ) then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Açık görüşmesi olan hesap moderatör yapılamaz.';
  end if;

  select * into v_existing
  from public.moderation_staff staff
  where staff.user_id = p_user_id
  for update;
  v_existing_found := found;

  if v_existing_found and v_existing.role = 'admin' then
    raise exception using errcode = 'insufficient_privilege', message = 'Birincil admin bu akıştan değiştirilemez.';
  end if;

  insert into public.moderation_staff (
    user_id,
    role,
    is_active,
    created_by_user_id
  ) values (
    p_user_id,
    'moderator',
    p_is_active,
    v_admin_user_id
  )
  on conflict (user_id) do update
  set role = 'moderator',
      is_active = excluded.is_active,
      updated_at = now();

  insert into public.account_events (actor_user_id, subject_user_id, event_type, metadata)
  values (
    v_admin_user_id,
    p_user_id,
    'moderation.staff_changed',
    jsonb_build_object(
      'previous_role', case when v_existing_found then v_existing.role else null end,
      'previous_is_active', case when v_existing_found then v_existing.is_active else null end,
      'new_role', 'moderator',
      'new_is_active', p_is_active
    )
  );
end;
$$;

-- 0010/0008 zincirindeki mevcut keşif mantığını koruyup personel
-- ayrımını dış katmanda uygula.
alter function public.get_my_discovery_candidates(integer)
  rename to get_discovery_candidates_before_staff_separation;

revoke execute on function public.get_discovery_candidates_before_staff_separation(integer)
  from public, anon, authenticated;

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
  select
    candidate.user_id,
    candidate.display_name,
    candidate.age,
    candidate.city_name,
    candidate.relationship_goal,
    candidate.compatibility_band,
    candidate.shared_points
  from public.get_discovery_candidates_before_staff_separation(p_limit) candidate
  where auth.uid() is not null
    and not exists (
      select 1
      from public.moderation_staff staff
      where staff.user_id = auth.uid()
        and staff.is_active
    )
    and not exists (
      select 1
      from public.moderation_staff staff
      where staff.user_id = candidate.user_id
        and staff.is_active
    );
$$;

revoke execute on function public.get_my_discovery_candidates(integer)
  from public, anon;
grant execute on function public.get_my_discovery_candidates(integer)
  to authenticated;

revoke execute on function public.enforce_moderation_staff_separation()
  from public, anon, authenticated;
revoke execute on function public.block_member_onboarding_for_moderation_staff()
  from public, anon, authenticated;

notify pgrst, 'reload schema';

commit;
