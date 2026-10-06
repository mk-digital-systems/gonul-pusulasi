"use client";

import { useState } from "react";
import { buttonStyles } from "./ui";

export function InviteShare({ inviteUrl, sample = false }: { inviteUrl: string; sample?: boolean }) {
  const [copied, setCopied] = useState(false);
  const shareText = `Ciddi ilişki arayanlar için yeni bir tanışma uygulaması hazırlanıyor: Gönül Pusulası. Göz atmak istersen: ${inviteUrl}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-2xl bg-sand/70 p-6 text-left">
      <p className="font-semibold text-ink">Arkadaşını Öner</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Ciddi bir ilişki arayan bir arkadaşın mı var? Bu bağlantıyı ona kendin gönderebilirsin. Biz
        kimseye senin adına mesaj göndermeyiz.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <code className="flex-1 truncate rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink-soft">
          {inviteUrl}
        </code>
        <button type="button" onClick={copy} className={buttonStyles.secondary}>
          {copied ? "Kopyalandı" : "Kopyala"}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonStyles.primary}
        >
          WhatsApp’ta paylaş
        </a>
      </div>
      {sample ? (
        <p className="mt-2 text-xs text-ink-muted">Önizleme: bağlantıdaki kod örnektir.</p>
      ) : null}
    </div>
  );
}
