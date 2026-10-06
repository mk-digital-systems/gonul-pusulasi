import "server-only";

export type Mail = { to: string; subject: string; text: string; html: string };

// Sağlayıcı Adım 3'te seçilecek. O zamana kadar yalnızca "console" sürücüsü var:
// e-posta gönderilmez, içeriği sunucu günlüğüne yazılır (yalnızca geliştirmede).
function driver() {
  return process.env.EMAIL_DRIVER || "console";
}

export function emailConfigured() {
  return driver() !== "console" || process.env.NODE_ENV !== "production";
}

export async function sendMail(mail: Mail) {
  if (driver() === "console") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("E-posta sağlayıcısı yapılandırılmadı.");
    }
    console.info(`\n[e-posta] Kime: ${mail.to}\nKonu: ${mail.subject}\n\n${mail.text}\n`);
    return;
  }
  throw new Error(`Bilinmeyen EMAIL_DRIVER: ${driver()}`);
}
