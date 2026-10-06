import "server-only";
import { db } from "./db";

/** Sabit pencereli sayaç. Sınır aşıldıysa false döner. */
export async function hitRateLimit(key: string, limit: number, windowSeconds: number) {
  const [row] = await db()<{ count: number }[]>`
    insert into public.rate_limits (key, window_start, count)
    values (${key}, now(), 1)
    on conflict (key) do update set
      window_start = case
        when rate_limits.window_start < now() - ${windowSeconds}::int * interval '1 second'
        then now() else rate_limits.window_start end,
      count = case
        when rate_limits.window_start < now() - ${windowSeconds}::int * interval '1 second'
        then 1 else rate_limits.count + 1 end
    returning count
  `;
  return row.count <= limit;
}
