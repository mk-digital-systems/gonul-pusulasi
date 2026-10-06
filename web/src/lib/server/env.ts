import "server-only";
import { SITE } from "@/lib/site";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} ortam değişkeni tanımlı değil.`);
  return value;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  // Belirteç ve IP özetleri için gizli anahtar (en az 32 karakter)
  get appSecret() {
    const secret = required("APP_SECRET");
    if (secret.length < 32) throw new Error("APP_SECRET en az 32 karakter olmalı.");
    return secret;
  },
  // E-postalardaki bağlantıların kök adresi (yerelde http://localhost:3000)
  get appUrl() {
    return (process.env.APP_URL || SITE.url).replace(/\/+$/, "");
  },
  get turnstileSecret() {
    return process.env.TURNSTILE_SECRET_KEY || null;
  },
};
