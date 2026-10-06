import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { env } from "./env";

/** Bağlantılarda kullanılan tek seferlik belirteç; veri tabanında yalnızca özeti tutulur. */
export function newToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** IP gibi değerleri kimliği açığa çıkarmadan anahtar olarak kullanmak için. */
export function keyedHash(value: string) {
  return createHmac("sha256", env.appSecret).update(value).digest("hex");
}

// Karışabilecek karakterler (0, O, 1, I) yok; 32 karakter → modulo sapması yok.
const INVITE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const INVITE_CODE_RE = /^[2-9A-HJ-NP-Z]{8}$/;

export function newInviteCode() {
  return Array.from(randomBytes(8), (b) => INVITE_ALPHABET[b % 32]).join("");
}
