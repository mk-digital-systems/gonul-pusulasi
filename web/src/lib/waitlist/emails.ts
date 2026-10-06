import "server-only";
import type { Mail } from "@/lib/server/email";
import { SITE } from "@/lib/site";

// Yalnızca hizmet e-postaları: kampanya, indirim veya tanıtım dili kullanılmaz.

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function layout(paragraphs: string[], button: { label: string; url: string }, footer: string) {
  const p = (t: string) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#2a2027">${escapeHtml(t)}</p>`;
  return `<!doctype html>
<html lang="tr"><body style="margin:0;background:#fcf7f5;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:520px;margin:0 auto;padding:32px 24px">
<p style="margin:0 0 24px;font-size:22px;color:#2a2027">${escapeHtml(SITE.name)}</p>
${paragraphs.map(p).join("\n")}
<p style="margin:24px 0"><a href="${escapeHtml(button.url)}" style="display:inline-block;background:#a84f57;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:999px">${escapeHtml(button.label)}</a></p>
<p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#5a4b53">Düğme çalışmazsa bu adresi tarayıcına yapıştır:<br>${escapeHtml(button.url)}</p>
<p style="margin:0;font-size:12px;line-height:1.6;color:#7a6a72">${footer}</p>
</div></body></html>`;
}

function manageFooter(manageUrl: string) {
  return {
    text: `Kaydını silmek istersen: ${manageUrl}`,
    html: `Kaydını silmek istersen <a href="${escapeHtml(manageUrl)}" style="color:#7a6a72">buraya tıkla</a>.`,
  };
}

export function verificationEmail(to: string, verifyUrl: string, manageUrl: string): Mail {
  const lines = [
    "Merhaba,",
    "Gönül Pusulası erken erişim listesine katılmak için e-posta adresini doğrulaman gerekiyor. Bağlantı 72 saat geçerlidir.",
    "Bu kaydı sen yapmadıysan bu e-postayı yok sayabilirsin; doğrulanmayan kayıtlar 7 gün içinde silinir.",
  ];
  const footer = manageFooter(manageUrl);
  return {
    to,
    subject: "E-posta adresini doğrula",
    text: [...lines, "", `Doğrulamak için: ${verifyUrl}`, "", footer.text].join("\n"),
    html: layout(lines, { label: "E-postamı doğrula", url: verifyUrl }, footer.html),
  };
}

export function welcomeEmail(to: string, inviteUrl: string, manageUrl: string): Mail {
  const lines = [
    "Kaydın tamamlandı.",
    "Gönül Pusulası açıldığında sana bu adresten haber vereceğiz. Bunun dışında e-posta göndermeyeceğiz.",
    "Ciddi bir ilişki arayan bir arkadaşın varsa davet bağlantını onunla paylaşabilirsin.",
  ];
  const footer = manageFooter(manageUrl);
  return {
    to,
    subject: "Erken erişim kaydın tamamlandı",
    text: [...lines, "", `Davet bağlantın: ${inviteUrl}`, "", footer.text].join("\n"),
    html: layout(lines, { label: "Davet bağlantımı aç", url: inviteUrl }, footer.html),
  };
}

export function alreadyRegisteredEmail(to: string, inviteUrl: string, manageUrl: string): Mail {
  const lines = [
    "Merhaba,",
    "Bu e-posta adresiyle erken erişim listesine yeni bir kayıt denemesi yapıldı. Adresin zaten listede ve doğrulanmış; yapman gereken bir şey yok.",
    "Bu denemeyi sen yapmadıysan bu e-postayı yok sayabilirsin.",
  ];
  const footer = manageFooter(manageUrl);
  return {
    to,
    subject: "Erken erişim listesinde zaten kayıtlısın",
    text: [...lines, "", `Davet bağlantın: ${inviteUrl}`, "", footer.text].join("\n"),
    html: layout(lines, { label: "Davet bağlantımı aç", url: inviteUrl }, footer.html),
  };
}
