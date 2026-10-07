# Gönül Pusulası Web

Next.js 16 tabanlı tanıtım sitesi; Faz 1 hesap/onboarding, Faz 2 uyum/keşif ve Faz 3 tanışma başvurusu uygulaması.

## Yerel geliştirme

1. `.env.example` dosyasını `.env.local` olarak kopyala.
2. Mevcut Supabase projesinin Project URL ve publishable key değerlerini gir.
3. `supabase/migrations/0001_phase1_foundation.sql`, `0002_phase2_compatibility.sql`, `0003_discovery_rpc_fix.sql` ve `0004_phase3_introduction_requests.sql` migrationlarını Supabase SQL Editor'da sırayla çalıştır.
4. Supabase Authentication URL ayarlarına şu adresleri ekle:
   - `http://localhost:3000/auth/callback/signup`
   - `http://localhost:3000/auth/callback/recovery`
   - `https://gonulpusulasi.tr/auth/callback/signup`
   - `https://gonulpusulasi.tr/auth/callback/recovery`

```bash
npm install
npm run dev
```

Gerekli ortam değişkenleri:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Publishable key gizli değildir; yetkilendirme PostgreSQL RLS ile yapılır. Secret veya
`service_role` anahtarı istemci ortam değişkenlerine eklenmez ve Faz 1 web kodunda kullanılmaz.

## Kontroller

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Supabase CLI ve Docker bulunan bir ortamda SQL/RLS testleri:

```bash
supabase db reset
supabase test db
```

SQL Editor kurulum notları için `supabase/README.md` dosyasına bakın.
