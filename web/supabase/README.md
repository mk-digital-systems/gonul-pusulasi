# Supabase Faz 1–3

Migrationlar sıralıdır ve mevcut Gönül Pusulası Supabase projesine uygulanır.

## Dashboard ile kurulum

1. Supabase Dashboard → **SQL Editor** → **New query**.
2. Migration dosyalarını numara sırasıyla çalıştır:
   - `migrations/0001_phase1_foundation.sql`
   - `migrations/0002_phase2_compatibility.sql`
   - `migrations/0003_discovery_rpc_fix.sql`
   - `migrations/0004_phase3_introduction_requests.sql`
   Daha önce `0001`–`0003` uygulandıysa yalnızca `0004` dosyasını çalıştır.
3. Hata olursa aynı sorguyu tekrar çalıştırma; transaction geri alınmış olur. Hata metnini inceleyip migrationı düzelt.

## Yerel CLI bulunduğunda

```bash
supabase db reset
supabase test db
```

`tests/database/0001_phase1_rls.test.sql` pgTAP ile trigger, 30+ kontrolü,
doğum tarihi kilidi, kesin yaş aralığı ve RLS izolasyonunu doğrular.
`tests/database/0002_phase2_compatibility.test.sql` ise soru setini, cevap kaydını,
RLS izolasyonunu ve karşılıklı keşif filtresini doğrular.
`tests/database/0004_phase3_introduction_requests.test.sql` kapı sorularını, başvuru
cevaplarını, katılımcı RLS sınırlarını ve kabulde 96 saatlik ön görüşme açılmasını doğrular.
