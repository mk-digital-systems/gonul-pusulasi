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
   - `migrations/0015_phase4_profile_photos.sql`
   - `migrations/0016_phase4_fixed_admin_and_staff_separation.sql`
   Daha önce `0001`–`0014` uygulandıysa sırayla `0015` ve `0016` dosyalarını çalıştır.
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
`tests/database/0015_phase4_profile_photos.test.sql` private bucket ayarlarını, kapalı tablo
yazma yetkilerini, fotoğraf sahibi/personel/aday erişim sınırlarını ve manuel onay-red
akışını doğrular.
`tests/database/0016_phase4_fixed_admin_and_staff_separation.test.sql` sabit admin kimliğini,
yalnızca admin tarafından moderatör atanmasını, normal üye/personel ayrımını ve personelin
Keşfet akışından çıkarılmasını doğrular.

## İlk admin

`0016_phase4_fixed_admin_and_staff_separation.sql`, Supabase Auth kullanıcısı mevcutsa
`ae6db6cf-7852-4fef-9fa0-fba3a6afac55` UUID'li hesabı tek ve sabit `admin` olarak etkinleştirir.
Migration çalıştıktan sonra bu hesapla yeniden giriş yapın; uygulama menüsünde **Yönetim**
alanı görünür. Admin ve moderatörler üye/Keşfet akışına katılamaz. Moderatör
yalnızca admin tarafından, onboarding'i tamamlanmamış ayrı bir Auth hesabına atanabilir.
Yetkiler yalnızca veritabanındaki
`moderation_staff` kaydı ve oturumdaki `auth.uid()` eşleşmesiyle verilir; istemciye secret
veya `service_role` anahtarı gönderilmez.

## Profil fotoğrafı Storage ayarı

`0015` migrationı private `profile-photos` bucketını oluşturur. Tarayıcıya doğrudan
`storage.objects` policy'si verilmez; yükleme ve indirme yetki denetimli sunucu akışından yapılır.
Vercel ve `.env.local` içine Supabase Dashboard → **Project Settings → API Keys** bölümündeki
server-only `sb_secret_...` değerini `SUPABASE_SECRET_KEY` adıyla ekleyin. Bu değişkeni
`NEXT_PUBLIC_` adıyla oluşturmayın.
