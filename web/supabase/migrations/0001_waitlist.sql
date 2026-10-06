-- Gönül Pusulası — erken erişim listesi
-- Supabase SQL Editor'de bir kez çalıştırılır.
--
-- Tabloya yalnızca sunucu (DATABASE_URL ile) erişir. RLS açık ve hiç politika
-- yok: Supabase'in herkese açık anon anahtarıyla okuma/yazma yapılamaz.

create table public.waitlist (
  id                 uuid primary key default gen_random_uuid(),

  -- Form alanları
  email              text not null unique
                     check (email = lower(email) and char_length(email) <= 254),
  name               text check (char_length(name) <= 40),
  -- Kesin aralık (1930–1996) uygulamada denetlenir; burada yalnızca akıl sağlığı sınırı.
  birth_year         smallint not null check (birth_year between 1930 and 2010),
  gender             text not null check (gender in ('kadin', 'erkek')),
  city               text not null check (char_length(city) <= 40),
  goal               text not null check (goal in ('evlilik', 'uzun-vadeli', 'once-tanisalim')),
  platform           text check (platform in ('ios', 'android')),
  nearby_cities      boolean not null default false,

  -- İlk temas kaynağı (sonraki başvurularda değişmez)
  referred_by        text check (char_length(referred_by) <= 16),
  utm_source         text check (char_length(utm_source) <= 100),
  utm_medium         text check (char_length(utm_medium) <= 100),
  utm_campaign       text check (char_length(utm_campaign) <= 100),

  -- Doğrulama sonrası üretilen davet kodu
  invite_code        text unique,

  -- Bağlantılardaki belirteçlerin yalnızca SHA-256 özeti saklanır
  verify_token_hash  text unique,
  verify_expires_at  timestamptz,
  manage_token_hash  text unique,

  -- E-posta gönderim sınırı (24 saatte en fazla 3 doğrulama e-postası)
  verify_sent_count  smallint not null default 1,
  last_email_at      timestamptz not null default now(),

  created_at         timestamptz not null default now(),
  verified_at        timestamptz
);

comment on table public.waitlist is
  'Erken erişim kayıtları. Doğrulanmayanlar 7 gün sonra silinir (waitlist_cleanup).';

create index waitlist_unverified_idx on public.waitlist (last_email_at)
  where verified_at is null;

alter table public.waitlist enable row level security;
revoke all on table public.waitlist from anon, authenticated;


-- İstek sınırı sayaçları. Anahtar, IP adresinin HMAC özetidir (IP'nin kendisi saklanmaz).
create table public.rate_limits (
  key           text primary key,
  window_start  timestamptz not null,
  count         integer not null
);

alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from anon, authenticated;


-- Günlük temizlik: doğrulanmayan kayıtlar (7 gün) ve eski sayaçlar (1 gün)
create function public.waitlist_cleanup() returns void
language sql
set search_path = ''
as $$
  delete from public.waitlist
   where verified_at is null
     and last_email_at < now() - interval '7 days';
  delete from public.rate_limits
   where window_start < now() - interval '1 day';
$$;

revoke all on function public.waitlist_cleanup() from public, anon, authenticated;
