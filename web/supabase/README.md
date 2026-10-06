# Supabase Faz 1

Migrationlar sıralıdır ve mevcut Gönül Pusulası Supabase projesine uygulanır.

## Dashboard ile kurulum

1. Supabase Dashboard → **SQL Editor** → **New query**.
2. `migrations/0001_phase1_foundation.sql` dosyasının tamamını yapıştırıp bir kez çalıştır.
3. Hata olursa aynı sorguyu tekrar çalıştırma; transaction geri alınmış olur. Hata metnini inceleyip migrationı düzelt.

## Yerel CLI bulunduğunda

```bash
supabase db reset
supabase test db
```

`tests/database/0001_phase1_rls.test.sql` pgTAP ile trigger, 30+ kontrolü,
doğum tarihi kilidi, kesin yaş aralığı ve RLS izolasyonunu doğrular.
