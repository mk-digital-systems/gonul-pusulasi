# Supabase Faz 1–3

Migrationlar sıralıdır ve mevcut Gönül Pusulası Supabase projesine uygulanır.

## Dashboard ile kurulum

1. Supabase Dashboard → **SQL Editor** → **New query**.
2. Migration dosyalarını numara sırasıyla çalıştır:
   - `migrations/0001_phase1_foundation.sql`
   - `migrations/0002_phase2_compatibility.sql`
   - `migrations/0003_discovery_rpc_fix.sql`
   - `migrations/0004_phase3_introduction_requests.sql`
   - `migrations/0005_phase3_pre_meeting_messages.sql`
   - `migrations/0006_phase3_mutual_progress.sql`
   - `migrations/0007_phase3_lifecycle_and_cooldown.sql`
   - `migrations/0008_phase3_pair_history_limits.sql`
   Daha önce `0001`–`0007` uygulandıysa yalnızca `0008` dosyasını çalıştır.
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
`tests/database/0005_phase3_pre_meeting_messages.test.sql` mesaj tablosunun varsayılan
kapalı yetkilerini, katılımcı izolasyonunu ve 96 saat sonunda mesaj gönderiminin kapanmasını doğrular.
`tests/database/0006_phase3_mutual_progress.test.sql` karşılıklı devam onayını, aktif
tanışma geçişini, diğer görüşmelerin kapanmasını ve aktif kullanıcının yeni görüşmeden korunmasını doğrular.
`tests/database/0007_phase3_lifecycle_and_cooldown.test.sql` 96+24 saatlik yaşam döngüsünü,
kontrollü sonlandırmayı, 24 saatlik beklemeyi ve bu sırada başvuru/görüşme kilitlerini doğrular.
`tests/database/0008_phase3_pair_history_limits.test.sql` aynı çift için 72 saatlik yeniden
karşılaşma aralığını, en fazla iki görüşme sınırını ve doğrudan yazma girişimlerine karşı
veritabanı korumalarını doğrular.
