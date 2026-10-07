import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Supabase kesintisi tanıtım ve hukuki sayfaları etkilemesin. Oturum
  // yenileme yalnızca auth ve uygulama yüzeylerinde çalışır.
  matcher: [
    "/giris/:path*",
    "/kayit/:path*",
    "/sifremi-unuttum/:path*",
    "/sifre-yenile/:path*",
    "/onboarding/:path*",
    "/hesabim/:path*",
    "/profil/:path*",
    "/uyum/:path*",
    "/kesfet/:path*",
    "/kapi-sorularim/:path*",
    "/tanisma-talebi/:path*",
    "/talepler/:path*",
    "/gorusmeler/:path*",
    "/engellenenler/:path*",
    "/yonetim/:path*",
    "/api/profil-fotografi/:path*",
    "/auth/:path*",
  ],
};
