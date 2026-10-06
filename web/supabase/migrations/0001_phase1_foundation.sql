-- Gönül Pusulası / Faz 1
-- Supabase SQL Editor'da tek parça olarak çalıştırılabilir.
-- Auth kullanıcısına bağlı hesap/profil, onboarding, hesap duraklatma ve
-- silme talebi altyapısını; açık GRANT ve RLS kurallarıyla oluşturur.

begin;

create type public.account_status as enum (
  'active',
  'paused',
  'deletion_requested',
  'suspended'
);

create type public.profile_gender as enum ('woman', 'man');

create type public.deletion_request_status as enum (
  'requested',
  'processing',
  'completed',
  'cancelled',
  'rejected'
);

create table public.cities (
  id smallint primary key check (id between 1 and 81),
  name text not null unique check (char_length(name) between 2 and 50),
  is_active boolean not null default true
);

insert into public.cities (id, name) values
  (1, 'Adana'), (2, 'Adıyaman'), (3, 'Afyonkarahisar'), (4, 'Ağrı'),
  (5, 'Amasya'), (6, 'Ankara'), (7, 'Antalya'), (8, 'Artvin'),
  (9, 'Aydın'), (10, 'Balıkesir'), (11, 'Bilecik'), (12, 'Bingöl'),
  (13, 'Bitlis'), (14, 'Bolu'), (15, 'Burdur'), (16, 'Bursa'),
  (17, 'Çanakkale'), (18, 'Çankırı'), (19, 'Çorum'), (20, 'Denizli'),
  (21, 'Diyarbakır'), (22, 'Edirne'), (23, 'Elazığ'), (24, 'Erzincan'),
  (25, 'Erzurum'), (26, 'Eskişehir'), (27, 'Gaziantep'), (28, 'Giresun'),
  (29, 'Gümüşhane'), (30, 'Hakkâri'), (31, 'Hatay'), (32, 'Isparta'),
  (33, 'Mersin'), (34, 'İstanbul'), (35, 'İzmir'), (36, 'Kars'),
  (37, 'Kastamonu'), (38, 'Kayseri'), (39, 'Kırklareli'), (40, 'Kırşehir'),
  (41, 'Kocaeli'), (42, 'Konya'), (43, 'Kütahya'), (44, 'Malatya'),
  (45, 'Manisa'), (46, 'Kahramanmaraş'), (47, 'Mardin'), (48, 'Muğla'),
  (49, 'Muş'), (50, 'Nevşehir'), (51, 'Niğde'), (52, 'Ordu'),
  (53, 'Rize'), (54, 'Sakarya'), (55, 'Samsun'), (56, 'Siirt'),
  (57, 'Sinop'), (58, 'Sivas'), (59, 'Tekirdağ'), (60, 'Tokat'),
  (61, 'Trabzon'), (62, 'Tunceli'), (63, 'Şanlıurfa'), (64, 'Uşak'),
  (65, 'Van'), (66, 'Yozgat'), (67, 'Zonguldak'), (68, 'Aksaray'),
  (69, 'Bayburt'), (70, 'Karaman'), (71, 'Kırıkkale'), (72, 'Batman'),
  (73, 'Şırnak'), (74, 'Bartın'), (75, 'Ardahan'), (76, 'Iğdır'),
  (77, 'Yalova'), (78, 'Karabük'), (79, 'Kilis'), (80, 'Osmaniye'),
  (81, 'Düzce');

create table public.relationship_goals (
  code text primary key check (code ~ '^[a-z][a-z0-9_]{1,49}$'),
  label text not null unique check (char_length(label) between 2 and 80),
  display_order smallint not null unique,
  is_active boolean not null default true
);

-- Katalog genişletilebilir; profil satırları sabit bir enum'a kilitlenmez.
insert into public.relationship_goals (code, label, display_order) values
  ('long_term_relationship', 'Uzun süreli ve ciddi ilişki', 10),
  ('marriage', 'Evlilik', 20),
  ('marriage_or_long_term', 'Evlilik veya uzun süreli ilişki', 30);

create table public.accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status public.account_status not null default 'active',
  onboarding_completed_at timestamptz,
  paused_at timestamptz,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_status_timestamps check (
    (status <> 'paused' or paused_at is not null)
    and (status <> 'deletion_requested' or deletion_requested_at is not null)
  )
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(btrim(display_name)) between 2 and 50),
  date_of_birth date,
  birth_date_confirmed_at timestamptz,
  gender public.profile_gender,
  city_id smallint references public.cities(id),
  relationship_goal_code text references public.relationship_goals(code),
  age_preference_min integer,
  age_preference_max integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_birth_confirmation check (
    birth_date_confirmed_at is null or date_of_birth is not null
  ),
  constraint profiles_age_preference_pair check (
    (age_preference_min is null and age_preference_max is null)
    or
    (age_preference_min is not null and age_preference_max is not null)
  ),
  constraint profiles_age_preference_bounds check (
    age_preference_min is null
    or (age_preference_min >= 30 and age_preference_max >= age_preference_min)
  )
);

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.deletion_request_status not null default 'requested',
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deletion_processed_state check (
    (status in ('requested', 'processing') and processed_at is null)
    or (status in ('completed', 'cancelled', 'rejected') and processed_at is not null)
  )
);

create unique index account_deletion_requests_one_open_per_user
  on public.account_deletion_requests (user_id)
  where status in ('requested', 'processing');

create table public.account_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  subject_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type ~ '^[a-z][a-z0-9_.]{2,79}$'),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index accounts_status_idx on public.accounts (status);
create index profiles_city_gender_idx on public.profiles (city_id, gender);
create index account_deletion_requests_status_requested_idx
  on public.account_deletion_requests (status, requested_at);
create index account_events_subject_occurred_idx
  on public.account_events (subject_user_id, occurred_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger accounts_set_updated_at
before update on public.accounts
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger account_deletion_requests_set_updated_at
before update on public.account_deletion_requests
for each row execute function public.set_updated_at();

create function public.prevent_locked_profile_identity_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.birth_date_confirmed_at is not null then
    if new.date_of_birth is distinct from old.date_of_birth
      or new.birth_date_confirmed_at is distinct from old.birth_date_confirmed_at then
      raise exception using
        errcode = 'check_violation',
        message = 'Doğrulanmış doğum tarihi normal profil işlemiyle değiştirilemez.';
    end if;

    if new.gender is distinct from old.gender then
      raise exception using
        errcode = 'check_violation',
        message = 'Onaylanmış cinsiyet normal profil işlemiyle değiştirilemez.';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_locked_identity_changes
before update on public.profiles
for each row execute function public.prevent_locked_profile_identity_changes();

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.accounts (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.account_events (actor_user_id, subject_user_id, event_type)
  values (new.id, new.id, 'account.created');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Migration öncesinde oluşturulmuş test kullanıcılarını güvenle tamamlar.
insert into public.accounts (user_id)
select id from auth.users
on conflict (user_id) do nothing;

insert into public.profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;

create function public.complete_onboarding(
  p_display_name text,
  p_date_of_birth date,
  p_gender text,
  p_city_id smallint,
  p_relationship_goal_code text,
  p_age_preference_min integer default null,
  p_age_preference_max integer default null
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
    select 1 from auth.users
    where id = v_user_id and email_confirmed_at is not null
  ) then
    raise exception using errcode = 'insufficient_privilege', message = 'E-posta doğrulanmalı.';
  end if;

  if not exists (
    select 1 from public.accounts
    where user_id = v_user_id
      and onboarding_completed_at is null
      and status = 'active'
    for update
  ) then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Onboarding tamamlanamaz.';
  end if;

  if char_length(btrim(p_display_name)) not between 2 and 50 then
    raise exception using errcode = 'check_violation', message = 'Görünen ad geçersiz.';
  end if;

  if p_date_of_birth is null
    or p_date_of_birth > (current_date - interval '30 years')::date then
    raise exception using errcode = 'check_violation', message = 'Minimum yaş 30.';
  end if;

  if p_gender not in ('woman', 'man') then
    raise exception using errcode = 'check_violation', message = 'Cinsiyet geçersiz.';
  end if;

  if not exists (select 1 from public.cities where id = p_city_id and is_active) then
    raise exception using errcode = 'foreign_key_violation', message = 'Şehir geçersiz.';
  end if;

  if not exists (
    select 1 from public.relationship_goals
    where code = p_relationship_goal_code and is_active
  ) then
    raise exception using errcode = 'foreign_key_violation', message = 'İlişki amacı geçersiz.';
  end if;

  if (p_age_preference_min is null) <> (p_age_preference_max is null)
    or (p_age_preference_min is not null and (
      p_age_preference_min < 30 or p_age_preference_max < p_age_preference_min
    )) then
    raise exception using errcode = 'check_violation', message = 'Yaş tercihi geçersiz.';
  end if;

  update public.profiles
  set display_name = btrim(p_display_name),
      date_of_birth = p_date_of_birth,
      birth_date_confirmed_at = now(),
      gender = p_gender::public.profile_gender,
      city_id = p_city_id,
      relationship_goal_code = p_relationship_goal_code,
      age_preference_min = p_age_preference_min,
      age_preference_max = p_age_preference_max
  where user_id = v_user_id;

  update public.accounts
  set onboarding_completed_at = now()
  where user_id = v_user_id;

  insert into public.account_events (actor_user_id, subject_user_id, event_type)
  values (v_user_id, v_user_id, 'profile.onboarding_completed');
end;
$$;

create function public.update_my_profile(
  p_display_name text,
  p_city_id smallint,
  p_relationship_goal_code text,
  p_age_preference_min integer default null,
  p_age_preference_max integer default null
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
    select 1 from public.accounts
    where user_id = v_user_id
      and onboarding_completed_at is not null
      and status in ('active', 'paused')
  ) then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Profil güncellenemez.';
  end if;

  if char_length(btrim(p_display_name)) not between 2 and 50 then
    raise exception using errcode = 'check_violation', message = 'Görünen ad geçersiz.';
  end if;

  if not exists (select 1 from public.cities where id = p_city_id and is_active)
    or not exists (
      select 1 from public.relationship_goals
      where code = p_relationship_goal_code and is_active
    ) then
    raise exception using errcode = 'foreign_key_violation', message = 'Profil seçimi geçersiz.';
  end if;

  if (p_age_preference_min is null) <> (p_age_preference_max is null)
    or (p_age_preference_min is not null and (
      p_age_preference_min < 30 or p_age_preference_max < p_age_preference_min
    )) then
    raise exception using errcode = 'check_violation', message = 'Yaş tercihi geçersiz.';
  end if;

  update public.profiles
  set display_name = btrim(p_display_name),
      city_id = p_city_id,
      relationship_goal_code = p_relationship_goal_code,
      age_preference_min = p_age_preference_min,
      age_preference_max = p_age_preference_max
  where user_id = v_user_id;

  insert into public.account_events (actor_user_id, subject_user_id, event_type)
  values (v_user_id, v_user_id, 'profile.updated');
end;
$$;

create function public.pause_my_account()
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

  update public.accounts
  set status = 'paused', paused_at = now()
  where user_id = v_user_id and status = 'active';

  if not found then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Hesap duraklatılamaz.';
  end if;

  insert into public.account_events (actor_user_id, subject_user_id, event_type)
  values (v_user_id, v_user_id, 'account.paused');
end;
$$;

create function public.resume_my_account()
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

  update public.accounts
  set status = 'active', paused_at = null
  where user_id = v_user_id and status = 'paused';

  if not found then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Hesap etkinleştirilemez.';
  end if;

  insert into public.account_events (actor_user_id, subject_user_id, event_type)
  values (v_user_id, v_user_id, 'account.resumed');
end;
$$;

create function public.request_my_account_deletion()
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

  update public.accounts
  set status = 'deletion_requested', deletion_requested_at = now()
  where user_id = v_user_id and status in ('active', 'paused');

  if not found then
    raise exception using errcode = 'object_not_in_prerequisite_state', message = 'Silme talebi oluşturulamaz.';
  end if;

  insert into public.account_deletion_requests (user_id)
  values (v_user_id);

  insert into public.account_events (actor_user_id, subject_user_id, event_type)
  values (v_user_id, v_user_id, 'account.deletion_requested');
end;
$$;

create function public.get_my_effective_age_preference()
returns table (minimum_age integer, maximum_age integer, preference_source text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(p.age_preference_min, greatest(30, extract(year from age(current_date, p.date_of_birth))::integer - 5)),
    coalesce(p.age_preference_max, extract(year from age(current_date, p.date_of_birth))::integer + 5),
    case when p.age_preference_min is null then 'default' else 'exact' end
  from public.profiles p
  where p.user_id = auth.uid()
    and p.birth_date_confirmed_at is not null;
$$;

alter table public.accounts enable row level security;
alter table public.profiles enable row level security;
alter table public.account_deletion_requests enable row level security;
alter table public.account_events enable row level security;

-- Katalog tabloları kişisel veri içermez; yalnızca aktif satırlar okunabilir.
alter table public.cities enable row level security;
alter table public.relationship_goals enable row level security;

create policy cities_read_active
on public.cities for select
to anon, authenticated
using (is_active);

create policy relationship_goals_read_active
on public.relationship_goals for select
to anon, authenticated
using (is_active);

create policy accounts_read_own
on public.accounts for select
to authenticated
using (user_id = auth.uid());

create policy profiles_read_own
on public.profiles for select
to authenticated
using (user_id = auth.uid());

create policy deletion_requests_read_own
on public.account_deletion_requests for select
to authenticated
using (user_id = auth.uid());

-- account_events bilerek policy almaz: Data API üzerinden varsayılan kapalıdır.

revoke all on table public.cities from anon, authenticated;
revoke all on table public.relationship_goals from anon, authenticated;
revoke all on table public.accounts from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.account_deletion_requests from anon, authenticated;
revoke all on table public.account_events from anon, authenticated;

grant usage on schema public to anon, authenticated;
grant select on table public.cities to anon, authenticated;
grant select on table public.relationship_goals to anon, authenticated;
grant select on table public.accounts to authenticated;
grant select on table public.profiles to authenticated;
grant select on table public.account_deletion_requests to authenticated;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.prevent_locked_profile_identity_changes() from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

revoke execute on function public.complete_onboarding(text, date, text, smallint, text, integer, integer) from public, anon;
revoke execute on function public.update_my_profile(text, smallint, text, integer, integer) from public, anon;
revoke execute on function public.pause_my_account() from public, anon;
revoke execute on function public.resume_my_account() from public, anon;
revoke execute on function public.request_my_account_deletion() from public, anon;
revoke execute on function public.get_my_effective_age_preference() from public, anon;

grant execute on function public.complete_onboarding(text, date, text, smallint, text, integer, integer) to authenticated;
grant execute on function public.update_my_profile(text, smallint, text, integer, integer) to authenticated;
grant execute on function public.pause_my_account() to authenticated;
grant execute on function public.resume_my_account() to authenticated;
grant execute on function public.request_my_account_deletion() to authenticated;
grant execute on function public.get_my_effective_age_preference() to authenticated;

commit;
