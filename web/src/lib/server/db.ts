import "server-only";
import postgres from "postgres";
import { env } from "./env";

// Supabase'de "Transaction pooler" (6543) adresi kullanılır; bu modda
// hazır sorgular (prepared statements) desteklenmez.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export function db(): postgres.Sql {
  globalForDb.sql ??= postgres(env.databaseUrl, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return globalForDb.sql;
}
