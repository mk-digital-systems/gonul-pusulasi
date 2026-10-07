-- Gönül Pusulası / Faz 4 moderasyon ekibi yönetimi
-- Personel atama yalnızca admin tarafından, Auth kullanıcı UUID'si üzerinden yapılır.

begin;

create function public.get_moderation_staff()
returns table (
  user_id uuid,
  display_name text,
  role text,
  is_active boolean,
  created_by_user_id uuid,
  created_by_display_name text,
  created_at timestamptz,
  updated_at timestamptz
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
    staff.user_id,
    staff_profile.display_name,
    staff.role,
    staff.is_active,
    staff.created_by_user_id,
    creator_profile.display_name,
    staff.created_at,
    staff.updated_at
  from public.moderation_staff staff
  left join public.profiles staff_profile
    on staff_profile.user_id = staff.user_id
  left join public.profiles creator_profile
    on creator_profile.user_id = staff.created_by_user_id
  order by
    staff.is_active desc,
    case staff.role when 'admin' then 1 else 2 end,
    staff_profile.display_name nulls last,
    staff.user_id;
end;
$$;

create function public.manage_moderation_staff(
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

  if p_user_id is null
    or p_role is null
    or p_role not in ('moderator', 'admin')
    or p_is_active is null then
    raise exception using errcode = 'check_violation', message = 'Geçerli kullanıcı, rol ve etkinlik durumu gerekli.';
  end if;

  if not exists (
    select 1 from auth.users auth_user where auth_user.id = p_user_id
  ) then
    raise exception using errcode = 'no_data_found', message = 'Auth kullanıcısı bulunamadı.';
  end if;

  if p_is_active and not exists (
    select 1
    from public.accounts account
    where account.user_id = p_user_id
      and account.status = 'active'
  ) then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Yalnızca etkin hesaba moderasyon yetkisi verilebilir.';
  end if;

  if p_user_id = v_admin_user_id
    and (p_role <> 'admin' or not p_is_active) then
    raise exception using errcode = 'insufficient_privilege', message = 'Admin kendi etkin admin yetkisini kaldıramaz.';
  end if;

  -- İki adminin eşzamanlı olarak birbirini pasifleştirip sistemi adminsiz
  -- bırakmasını önlemek için rol değişikliklerini tek sırada uygula.
  lock table public.moderation_staff in share row exclusive mode;

  select * into v_existing
  from public.moderation_staff staff
  where staff.user_id = p_user_id
  for update;
  v_existing_found := found;

  if v_existing_found
    and v_existing.role = 'admin'
    and v_existing.is_active
    and (p_role <> 'admin' or not p_is_active)
    and (
      select count(*)
      from public.moderation_staff staff
      where staff.role = 'admin'
        and staff.is_active
    ) <= 1 then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Son etkin admin kaldırılamaz.';
  end if;

  insert into public.moderation_staff (
    user_id,
    role,
    is_active,
    created_by_user_id
  ) values (
    p_user_id,
    p_role,
    p_is_active,
    v_admin_user_id
  )
  on conflict (user_id) do update
  set role = excluded.role,
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
      'new_role', p_role,
      'new_is_active', p_is_active
    )
  );
end;
$$;

revoke execute on function public.get_moderation_staff()
  from public, anon;
revoke execute on function public.manage_moderation_staff(uuid, text, boolean)
  from public, anon;

grant execute on function public.get_moderation_staff()
  to authenticated;
grant execute on function public.manage_moderation_staff(uuid, text, boolean)
  to authenticated;

notify pgrst, 'reload schema';

commit;
