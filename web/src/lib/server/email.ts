import "server-only";
import { SITE } from "@/lib/site";

export type Mail = { to: string; subject: string; text: string; html: string };

// Sürücüler:
//  - "console": e-posta gönderilmez, içeriği sunucu günlüğüne yazılır (yalnızca geliştirmede)
//  - "scaleway": Scaleway Transactional Email, Paris (fr-par)
function driver() {
  return process.env.EMAIL_DRIVER || "console";
}

function scalewayConfig() {
  const secretKey = process.env.SCW_SECRET_KEY;
  const projectId = process.env.SCW_PROJECT_ID;
  if (!secretKey || !projectId) return null;
  return {
    secretKey,
    projectId,
    from: process.env.EMAIL_FROM || `bildirim@${SITE.domain}`,
    fromName: process.env.EMAIL_FROM_NAME || SITE.name,
    replyTo: process.env.EMAIL_REPLY_TO || null,
  };
}

export function emailConfigured() {
  switch (driver()) {
    case "console":
      return process.env.NODE_ENV !== "production";
    case "scaleway":
      return scalewayConfig() !== null;
    default:
      return false;
  }
}

export async function sendMail(mail: Mail) {
  switch (driver()) {
    case "console":
      if (process.env.NODE_ENV === "production") {
        throw new Error("E-posta sağlayıcısı yapılandırılmadı.");
      }
      console.info(`\n[e-posta] Kime: ${mail.to}\nKonu: ${mail.subject}\n\n${mail.text}\n`);
      return;
    case "scaleway":
      return sendWithScaleway(mail);
    default:
      throw new Error(`Bilinmeyen EMAIL_DRIVER: ${driver()}`);
  }
}

async function sendWithScaleway(mail: Mail) {
  const config = scalewayConfig();
  if (!config) throw new Error("SCW_SECRET_KEY ve SCW_PROJECT_ID tanımlı olmalı.");

  const res = await fetch(
    "https://api.scaleway.com/transactional-email/v1alpha1/regions/fr-par/emails",
    {
      method: "POST",
      headers: { "X-Auth-Token": config.secretKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: { email: config.from, name: config.fromName },
        to: [{ email: mail.to }],
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        project_id: config.projectId,
        additional_headers: config.replyTo ? [{ key: "Reply-To", value: config.replyTo }] : [],
      }),
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!res.ok) {
    // Yanıt gövdesi hata ayrıntısını içerir; alıcı adresi günlüğe yazılmaz.
    throw new Error(`Scaleway e-posta hatası ${res.status}: ${(await res.text()).slice(0, 500)}`);
  }
}
