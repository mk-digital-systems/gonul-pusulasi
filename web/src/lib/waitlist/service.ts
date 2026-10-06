import "server-only";
import postgres from "postgres";
import { db } from "@/lib/server/db";
import { INVITE_CODE_RE, hashToken, newInviteCode, newToken } from "@/lib/server/tokens";
import type { WaitlistInput } from "./form";

export type Source = {
  referredBy: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
};

export type JoinOutcome =
  | { kind: "verify"; verifyToken: string; manageToken: string }
  | { kind: "already-verified"; inviteCode: string; manageToken: string }
  | { kind: "silent" };

const VERIFY_TTL_HOURS = 72;
const MAX_VERIFY_EMAILS_PER_DAY = 3;

/** Davet kodu biçimce geçerli ve doğrulanmış bir kayda aitse döner. */
export async function findReferrer(code: string | null) {
  const normalized = code?.trim().toUpperCase() ?? "";
  if (!INVITE_CODE_RE.test(normalized)) return null;
  const rows = await db()`
    select 1 from public.waitlist where invite_code = ${normalized} and verified_at is not null
  `;
  return rows.length > 0 ? normalized : null;
}

/**
 * Yeni kayıt ya da doğrulanmamış kaydın güncellenmesi. Her durumda çağırana aynı
 * yanıt verilir; hangi e-postanın gönderileceğine burada karar verilir.
 */
export async function joinWaitlist(input: WaitlistInput, source: Source): Promise<JoinOutcome> {
  const sql = db();
  const verify = newToken();
  const manage = newToken();

  // Doğrulanmamış kayıtta bilgiler güncellenir ve yeni bağlantı gönderilir
  // (24 saatte en fazla 3 kez). Kaynak bilgisi ilk kayıttaki gibi kalır.
  const upserted = await sql`
    insert into public.waitlist (
      email, name, birth_year, gender, city, goal, platform, nearby_cities,
      referred_by, utm_source, utm_medium, utm_campaign,
      verify_token_hash, verify_expires_at, manage_token_hash
    ) values (
      ${input.email}, ${input.name}, ${input.birthYear}, ${input.gender}, ${input.city},
      ${input.goal}, ${input.platform}, ${input.nearbyCities},
      ${source.referredBy}, ${source.utmSource}, ${source.utmMedium}, ${source.utmCampaign},
      ${verify.hash}, now() + ${VERIFY_TTL_HOURS}::int * interval '1 hour', ${manage.hash}
    )
    on conflict (email) do update set
      name = excluded.name,
      birth_year = excluded.birth_year,
      gender = excluded.gender,
      city = excluded.city,
      goal = excluded.goal,
      platform = excluded.platform,
      nearby_cities = excluded.nearby_cities,
      verify_token_hash = excluded.verify_token_hash,
      verify_expires_at = excluded.verify_expires_at,
      manage_token_hash = excluded.manage_token_hash,
      verify_sent_count = case
        when waitlist.last_email_at < now() - interval '24 hours' then 1
        else waitlist.verify_sent_count + 1 end,
      last_email_at = now()
    where waitlist.verified_at is null
      and (waitlist.last_email_at < now() - interval '24 hours'
           or waitlist.verify_sent_count < ${MAX_VERIFY_EMAILS_PER_DAY})
    returning id
  `;
  if (upserted.length > 0) {
    return { kind: "verify", verifyToken: verify.token, manageToken: manage.token };
  }

  // Zaten doğrulanmış adres: günde en fazla bir bilgilendirme e-postası.
  const [verified] = await sql<{ invite_code: string }[]>`
    update public.waitlist
       set manage_token_hash = ${manage.hash}, last_email_at = now()
     where email = ${input.email}
       and verified_at is not null
       and last_email_at < now() - interval '24 hours'
    returning invite_code
  `;
  if (verified) {
    return { kind: "already-verified", inviteCode: verified.invite_code, manageToken: manage.token };
  }

  return { kind: "silent" };
}

/** E-posta doğrulaması. Başarılıysa davet kodu ve yeni yönetim belirteci döner. */
export async function confirmRegistration(token: string) {
  if (!token) return null;
  const sql = db();
  const manage = newToken();

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const [row] = await sql<{ email: string; invite_code: string }[]>`
        update public.waitlist
           set verified_at = now(),
               verify_token_hash = null,
               verify_expires_at = null,
               invite_code = ${newInviteCode()},
               manage_token_hash = ${manage.hash},
               last_email_at = now()
         where verify_token_hash = ${hashToken(token)}
           and verify_expires_at > now()
           and verified_at is null
        returning email, invite_code
      `;
      if (!row) return null;
      return { email: row.email, inviteCode: row.invite_code, manageToken: manage.token };
    } catch (error) {
      // Davet kodu çakışması (çok düşük olasılık): yeni kodla tekrar dene
      if (error instanceof postgres.PostgresError && error.code === "23505") continue;
      throw error;
    }
  }
  throw new Error("Benzersiz davet kodu üretilemedi.");
}

/** Kaydı tamamen siler. */
export async function deleteRegistration(token: string) {
  if (!token) return false;
  const rows = await db()`
    delete from public.waitlist where manage_token_hash = ${hashToken(token)} returning id
  `;
  return rows.length > 0;
}
