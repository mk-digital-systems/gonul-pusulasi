export function getOptionalSupabasePublicEnv() {
  // Direct references are required so Next.js can inline NEXT_PUBLIC values in
  // the browser bundle. Do not replace these with dynamic property access.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) return null;

  return { url, publishableKey };
}

export function getSupabasePublicEnv() {
  const values = getOptionalSupabasePublicEnv();
  const missing = [
    !process.env.NEXT_PUBLIC_SUPABASE_URL ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      ? "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      : null,
  ].filter((name): name is string => Boolean(name));

  if (!values) {
    throw new Error(
      `Eksik Supabase ortam değişkenleri: ${missing.join(", ")}. web/.env.example dosyasını temel alın.`,
    );
  }

  return values;
}

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return process.env.NODE_ENV === "production"
    ? "https://gonulpusulasi.tr"
    : "http://localhost:3000";
}
