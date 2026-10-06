-- Temizliği her gece 03:17'de (UTC) çalıştırır.
-- Supabase'de pg_cron eklentisi gerekir (Database → Extensions → pg_cron).

create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'waitlist-cleanup',
  '17 3 * * *',
  $$select public.waitlist_cleanup()$$
);
