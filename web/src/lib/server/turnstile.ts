import "server-only";
import { env } from "./env";

// Cloudflare Turnstile isteğe bağlıdır: TURNSTILE_SECRET_KEY yoksa denetim yapılmaz.
export function turnstileEnabled() {
  return env.turnstileSecret !== null;
}

export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = env.turnstileSecret;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(5000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error("Turnstile doğrulaması başarısız", error);
    return false;
  }
}
