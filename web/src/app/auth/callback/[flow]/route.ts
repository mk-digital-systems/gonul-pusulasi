import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FLOW_DESTINATIONS = {
  signup: "/onboarding",
  recovery: "/sifre-yenile",
} as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ flow: string }> },
) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const { flow } = await params;
  const destination = FLOW_DESTINATIONS[flow as keyof typeof FLOW_DESTINATIONS];

  if (code && destination) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destination, url.origin));
  }

  return NextResponse.redirect(
    new URL("/giris?hata=Doğrulama+bağlantısı+geçersiz+veya+süresi+dolmuş.", url.origin),
  );
}
