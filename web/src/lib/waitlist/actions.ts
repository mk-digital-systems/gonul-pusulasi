"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { PREVIEW_MODE } from "@/lib/site";
import { isDisposableEmail } from "@/lib/server/disposable-email";
import { emailConfigured, sendMail, type Mail } from "@/lib/server/email";
import { env } from "@/lib/server/env";
import { hitRateLimit } from "@/lib/server/rate-limit";
import { keyedHash } from "@/lib/server/tokens";
import { verifyTurnstile } from "@/lib/server/turnstile";
import { alreadyRegisteredEmail, verificationEmail, welcomeEmail } from "./emails";
import { parseWaitlistForm, type FieldErrors } from "./form";
import { confirmRegistration, deleteRegistration, findReferrer, joinWaitlist } from "./service";

export type JoinState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "error"; errors?: FieldErrors; message?: string };

const GENERIC_FAILURE = "Şu an kaydını alamadık. Lütfen biraz sonra tekrar dene.";

function inviteUrl(code: string) {
  return `${env.appUrl}/?ref=${code}`;
}

function manageUrl(token: string) {
  return `${env.appUrl}/kaydim?t=${token}`;
}

function utm(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 100) : null;
}

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** E-postayı yanıttan sonra gönderir: yanıt süresi kaydın durumunu ele vermez. */
function sendAfterResponse(mail: Mail) {
  after(async () => {
    try {
      await sendMail(mail);
    } catch (error) {
      console.error("E-posta gönderilemedi", error);
    }
  });
}

export async function submitWaitlist(_prev: JoinState, data: FormData): Promise<JoinState> {
  // Bot tuzağı: insanlar bu gizli alanı görmez ve doldurmaz.
  if (data.get("website")) return { status: "ok" };

  const parsed = parseWaitlistForm(data);
  if (!parsed.ok) return { status: "error", errors: parsed.errors };

  if (PREVIEW_MODE) return { status: "ok" };

  if (!emailConfigured()) {
    console.error("Kayıt reddedildi: e-posta sağlayıcısı yapılandırılmadı.");
    return { status: "error", message: GENERIC_FAILURE };
  }

  try {
    const allowed = await hitRateLimit(`join:${keyedHash(await clientIp())}`, 5, 10 * 60);
    if (!allowed) {
      return { status: "error", message: "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene." };
    }

    if (!(await verifyTurnstile(String(data.get("turnstileToken") ?? "")))) {
      return {
        status: "error",
        message: "Güvenlik doğrulaması tamamlanamadı. Sayfayı yenileyip tekrar dene.",
      };
    }

    const { input } = parsed;
    if (isDisposableEmail(input.email)) {
      return {
        status: "error",
        errors: { email: "Lütfen geçici olmayan, kalıcı bir e-posta adresi kullan." },
      };
    }

    const outcome = await joinWaitlist(input, {
      referredBy: await findReferrer(String(data.get("ref") ?? "")),
      utmSource: utm(data, "utm_source"),
      utmMedium: utm(data, "utm_medium"),
      utmCampaign: utm(data, "utm_campaign"),
    });

    if (outcome.kind === "verify") {
      sendAfterResponse(
        verificationEmail(
          input.email,
          `${env.appUrl}/dogrula?t=${outcome.verifyToken}`,
          manageUrl(outcome.manageToken),
        ),
      );
    } else if (outcome.kind === "already-verified") {
      sendAfterResponse(
        alreadyRegisteredEmail(
          input.email,
          inviteUrl(outcome.inviteCode),
          manageUrl(outcome.manageToken),
        ),
      );
    }
    // Yeni, mevcut veya sınıra takılmış: yanıt her durumda aynı.
    return { status: "ok" };
  } catch (error) {
    console.error("Erken erişim kaydı başarısız", error);
    return { status: "error", message: GENERIC_FAILURE };
  }
}

export type ConfirmState =
  | { status: "idle" }
  | { status: "ok"; inviteUrl: string }
  | { status: "invalid" }
  | { status: "error" };

export async function confirmWaitlist(_prev: ConfirmState, data: FormData): Promise<ConfirmState> {
  try {
    const result = await confirmRegistration(String(data.get("token") ?? ""));
    if (!result) return { status: "invalid" };
    const url = inviteUrl(result.inviteCode);
    sendAfterResponse(welcomeEmail(result.email, url, manageUrl(result.manageToken)));
    return { status: "ok", inviteUrl: url };
  } catch (error) {
    console.error("E-posta doğrulaması başarısız", error);
    return { status: "error" };
  }
}

export type DeleteState = { status: "idle" | "deleted" | "invalid" | "error" };

export async function deleteWaitlist(_prev: DeleteState, data: FormData): Promise<DeleteState> {
  if (!data.get("confirm")) return { status: "idle" };
  try {
    const deleted = await deleteRegistration(String(data.get("token") ?? ""));
    return { status: deleted ? "deleted" : "invalid" };
  } catch (error) {
    console.error("Kayıt silme başarısız", error);
    return { status: "error" };
  }
}
