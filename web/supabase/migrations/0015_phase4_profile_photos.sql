-- Gönül Pusulası / Faz 4 isteğe bağlı profil fotoğrafı
-- Özel Storage bucket, sunucu kontrollü erişim ve manuel moderasyon.

begin;

create type public.profile_photo_status as enum (
  'pending',
  'approved',
  'rejected'
);

create table public.profile_photos (
  user_id uuid primary key references auth.users(id) on delete cascade,
  object_path text not null unique,
  byte_size integer not null check (byte_size between 1 and 2097152),
  width integer not null check (width = 1024),
  height integer not null check (height = 1024),
  status public.profile_photo_status not null default 'pending',
  uploaded_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by_user_id uuid references auth.users(id) on delete set null,
  moderation_note text check (
    moderation_note is null
    or char_length(btrim(moderation_note)) between 10 and 1000
  ),
  check (object_path ~ ('^' || user_id::text || '/[0-9a-f-]{36}[.]webp$'))
);

create index profile_photos_status_uploaded_idx
  on public.profile_photos (status, uploaded_at);

-- Bucket private kalır. storage.objects için kullanıcı policy'si bilinçli olarak
-- oluşturulmaz; dosya işlemleri yalnızca sunucu Route Handler'ından secret key ile yapılır.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'profile-photos',
  'profile-photos',
  false,
  2097152,
  array['image/webp']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create function public.can_view_profile_photo(p_owner_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.profile_photos photo
      where photo.user_id = p_owner_user_id
        and (
          photo.user_id = auth.uid()
          or exists (
            select 1
            from public.moderation_staff staff
            where staff.user_id = auth.uid()
              and staff.is_active
          )
          or (
            photo.status = 'approved'
            and exists (
              select 1
              from public.accounts owner_account
              where owner_account.user_id = photo.user_id
                and owner_account.status = 'active'
            )
            and (
              exists (
                select 1
                from public.get_my_discovery_candidates(25) candidate
                where candidate.user_id = photo.user_id
              )
              or exists (
                select 1
                from public.conversations conversation
                where conversation.status in ('pre_meeting', 'active')
                  and auth.uid() in (conversation.user_a_id, conversation.user_b_id)
                  and photo.user_id in (conversation.user_a_id, conversation.user_b_id)
              )
            )
          )
        )
    );
$$;

create function public.get_profile_photo_path(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select photo.object_path
  from public.profile_photos photo
  where photo.user_id = p_user_id
    and public.can_view_profile_photo(photo.user_id);
$$;

create function public.get_visible_profile_photo_user_ids(p_user_ids uuid[])
returns table (user_id uuid)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = 'insufficient_privilege', message = 'Oturum gerekli.';
  end if;

  if cardinality(p_user_ids) > 25 then
    raise exception using errcode = 'check_violation', message = 'En fazla 25 fotoğraf sorgulanabilir.';
  end if;

  return query
  select photo.user_id
  from public.profile_photos photo
  where photo.user_id = any(coalesce(p_user_ids, array[]::uuid[]))
    and public.can_view_profile_photo(photo.user_id)
  order by photo.user_id;
end;
$$;

create function public.submit_my_profile_photo(
  p_object_path text,
  p_byte_size integer,
  p_width integer,
  p_height integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception using errcode = 'insufficient_privilege', message = 'Oturum gerekli.';
  end if;

  if not exists (
    select 1
    from public.accounts account
    where account.user_id = v_user_id
      and account.status in ('active', 'paused')
      and account.onboarding_completed_at is not null
  ) then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Fotoğraf yüklemek için kullanılabilir hesap ve tamamlanmış profil gerekli.';
  end if;

  if p_object_path is null
    or p_object_path !~ ('^' || v_user_id::text || '/[0-9a-f-]{36}[.]webp$')
    or p_byte_size not between 1 and 2097152
    or p_width <> 1024
    or p_height <> 1024 then
    raise exception using errcode = 'check_violation', message = 'İşlenmiş fotoğraf bilgileri geçersiz.';
  end if;

  if not exists (
    select 1
    from storage.objects object
    where object.bucket_id = 'profile-photos'
      and object.name = p_object_path
  ) then
    raise exception using errcode = 'no_data_found', message = 'Storage nesnesi bulunamadı.';
  end if;

  insert into public.profile_photos (
    user_id,
    object_path,
    byte_size,
    width,
    height,
    status,
    uploaded_at,
    reviewed_at,
    reviewed_by_user_id,
    moderation_note
  ) values (
    v_user_id,
    p_object_path,
    p_byte_size,
    p_width,
    p_height,
    'pending',
    now(),
    null,
    null,
    null
  )
  on conflict (user_id) do update
  set object_path = excluded.object_path,
      byte_size = excluded.byte_size,
      width = excluded.width,
      height = excluded.height,
      status = 'pending',
      uploaded_at = now(),
      reviewed_at = null,
      reviewed_by_user_id = null,
      moderation_note = null;

  insert into public.account_events (subject_user_id, event_type, metadata)
  values (
    v_user_id,
    'profile.photo_submitted',
    jsonb_build_object('object_path', p_object_path, 'byte_size', p_byte_size)
  );
end;
$$;

create function public.remove_my_profile_photo()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_object_path text;
begin
  if v_user_id is null then
    raise exception using errcode = 'insufficient_privilege', message = 'Oturum gerekli.';
  end if;

  delete from public.profile_photos photo
  where photo.user_id = v_user_id
  returning photo.object_path into v_object_path;

  if v_object_path is not null then
    insert into public.account_events (subject_user_id, event_type, metadata)
    values (
      v_user_id,
      'profile.photo_removed',
      jsonb_build_object('object_path', v_object_path)
    );
  end if;

  return v_object_path;
end;
$$;

create function public.get_moderation_profile_photos(
  p_status text default 'pending',
  p_limit integer default 100
)
returns table (
  user_id uuid,
  display_name text,
  object_path text,
  byte_size integer,
  width integer,
  height integer,
  photo_status text,
  uploaded_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by_user_id uuid,
  moderation_note text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_moderation_staff(false);

  if p_status is not null
    and p_status not in ('pending', 'approved', 'rejected') then
    raise exception using errcode = 'check_violation', message = 'Geçersiz fotoğraf durumu.';
  end if;

  return query
  select
    photo.user_id,
    profile.display_name,
    photo.object_path,
    photo.byte_size,
    photo.width,
    photo.height,
    photo.status::text,
    photo.uploaded_at,
    photo.reviewed_at,
    photo.reviewed_by_user_id,
    photo.moderation_note
  from public.profile_photos photo
  left join public.profiles profile on profile.user_id = photo.user_id
  where p_status is null or photo.status::text = p_status
  order by photo.uploaded_at
  limit greatest(1, least(coalesce(p_limit, 100), 200));
end;
$$;

create function public.moderate_profile_photo(
  p_user_id uuid,
  p_status text,
  p_moderation_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_user_id uuid := auth.uid();
  v_photo public.profile_photos%rowtype;
  v_note text := nullif(btrim(p_moderation_note), '');
begin
  perform public.require_moderation_staff(false);

  if p_status is null or p_status not in ('approved', 'rejected') then
    raise exception using errcode = 'check_violation', message = 'Fotoğraf yalnızca onaylanabilir veya reddedilebilir.';
  end if;

  if p_status = 'rejected'
    and (v_note is null or char_length(v_note) not between 10 and 1000) then
    raise exception using errcode = 'check_violation', message = 'Ret gerekçesi 10–1000 karakter olmalıdır.';
  end if;

  select * into v_photo
  from public.profile_photos photo
  where photo.user_id = p_user_id
  for update;

  if not found then
    raise exception using errcode = 'no_data_found', message = 'Profil fotoğrafı bulunamadı.';
  end if;

  if v_photo.status <> 'pending' then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Yalnızca bekleyen fotoğraf incelenebilir.';
  end if;

  update public.profile_photos
  set status = p_status::public.profile_photo_status,
      reviewed_at = now(),
      reviewed_by_user_id = v_staff_user_id,
      moderation_note = v_note
  where user_id = p_user_id;

  insert into public.account_events (actor_user_id, subject_user_id, event_type, metadata)
  values (
    v_staff_user_id,
    p_user_id,
    'moderation.profile_photo_reviewed',
    jsonb_build_object('status', p_status, 'note', v_note)
  );
end;
$$;

alter table public.profile_photos enable row level security;

create policy profile_photos_read_own
on public.profile_photos for select to authenticated
using (user_id = auth.uid());

revoke all on table public.profile_photos from anon, authenticated;
grant select on table public.profile_photos to authenticated;

revoke execute on function public.can_view_profile_photo(uuid)
  from public, anon, authenticated;
revoke execute on function public.get_profile_photo_path(uuid)
  from public, anon;
revoke execute on function public.get_visible_profile_photo_user_ids(uuid[])
  from public, anon;
revoke execute on function public.submit_my_profile_photo(text, integer, integer, integer)
  from public, anon;
revoke execute on function public.remove_my_profile_photo()
  from public, anon;
revoke execute on function public.get_moderation_profile_photos(text, integer)
  from public, anon;
revoke execute on function public.moderate_profile_photo(uuid, text, text)
  from public, anon;

grant execute on function public.get_profile_photo_path(uuid)
  to authenticated;
grant execute on function public.get_visible_profile_photo_user_ids(uuid[])
  to authenticated;
grant execute on function public.submit_my_profile_photo(text, integer, integer, integer)
  to authenticated;
grant execute on function public.remove_my_profile_photo()
  to authenticated;
grant execute on function public.get_moderation_profile_photos(text, integer)
  to authenticated;
grant execute on function public.moderate_profile_photo(uuid, text, text)
  to authenticated;

notify pgrst, 'reload schema';

commit;
