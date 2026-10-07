# Supabase Faz 1–4

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
   - `migrations/0009_phase3_active_inactivity.sql`
   - `migrations/0010_phase4_user_safety.sql`
   - `migrations/0011_phase4_moderation_console.sql`
   - `migrations/0012_phase4_report_context.sql`
   - `migrations/0013_phase4_moderation_audit_log.sql`
   - `migrations/0014_phase4_moderation_staff_management.sql`
   Daha önce `0001`–`0010` uygulandıysa sırayla `0011`, `0012`, `0013` ve `0014` dosyalarını çalıştır.
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
`tests/database/0009_phase3_active_inactivity.test.sql` aktif tanışmada üç günlük kontrol
hatırlatmasını, beş günlük sessizlik sonlandırmasını, katılımcı yetkisini, beklemeyi ve denetim
kaydını doğrular.
`tests/database/0010_phase4_user_safety.test.sql` engelleme ve şikâyet RLS sınırlarını,
engellenen çiftin keşif/başvuru/görüşme/mesaj kilitlerini ve denetim kayıtlarını doğrular.
`tests/database/0011_phase4_moderation_console.test.sql` personel rol ayrımını, kapalı tablo
yetkilerini, şikâyet kuyruğunu, yalnızca admin tarafından uygulanan manuel askıya alma/geri
açma akışını ve değiştirilemez işlem kayıtlarını doğrular.
`tests/database/0012_phase4_report_context.test.sql` şikâyete bağlı kapı cevaplarının yalnızca
moderasyon personeline açılmasını, normal kullanıcı erişiminin reddedilmesini ve RPC'nin özel
görüşme mesajı alanı yayınlamamasını doğrular.
`tests/database/0013_phase4_moderation_audit_log.test.sql` yaptırım geçmişinin yalnızca admin
tarafından okunmasını, moderatör ve normal kullanıcı erişiminin reddedilmesini, sıralama ve
limit davranışını doğrular.
`tests/database/0014_phase4_moderation_staff_management.test.sql` ekip listesinin ve rol
yönetiminin yalnızca admine açık olmasını, Auth UUID doğrulamasını, adminin kendini kilitleme
korumasını, pasifleştirmeyi ve denetim olaylarını doğrular.

## İlk admin

`0011_phase4_moderation_console.sql`, Supabase Auth kullanıcısı mevcutsa
`68192831-8e6b-4256-adb1-bc606d7af308` UUID'li hesabı `admin` olarak etkinleştirir.
Migration çalıştıktan sonra bu hesapla yeniden giriş yapın; uygulama menüsünde **Yönetim**
bağlantısı görünür. Admin ve moderatör yetkileri yalnızca veritabanındaki
`moderation_staff` kaydı ve oturumdaki `auth.uid()` eşleşmesiyle verilir; istemciye secret
veya `service_role` anahtarı gönderilmez.
