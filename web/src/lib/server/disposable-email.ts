import "server-only";
import domains from "disposable-email-domains/index.json";
import wildcards from "disposable-email-domains/wildcard.json";

let blocked: Set<string> | null = null;

/** Tek kullanımlık e-posta alan adı mı? Alt alan adları da kontrol edilir. */
export function isDisposableEmail(email: string) {
  blocked ??= new Set([...domains, ...wildcards]);
  const parts = email.slice(email.lastIndexOf("@") + 1).split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    if (blocked.has(parts.slice(i).join("."))) return true;
  }
  return false;
}
