import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageBanner } from "@/components/form-controls";
import { buttonStyles } from "@/components/ui";
import { getMyConversations } from "@/lib/data/conversations";
import { getMyAccountAndProfile } from "@/lib/data/profile";

const STATUS_LABELS = {
  pre_meeting: "Ön görüşme açık",
  decision_window: "Karar penceresi",
  active: "Aktif tanışma",
  ended: "Sona erdi",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

function addHours(value: string, hours: number) {
  return new Date(new Date(value).getTime() + hours * 3_600_000).toISOString();
}

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; bildirim?: string }>;
}) {
  const [accountData, conversations, { hata, bildirim }] = await Promise.all([
    getMyAccountAndProfile(),
    getMyConversations(),
    searchParams,
  ]);

  if (!accountData.account.onboarding_completed_at) redirect("/onboarding");

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
        Ön görüşmeler
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink">Görüşmelerin</h1>
      <p className="mt-4 leading-relaxed text-ink-soft">
        Kabul edilen tanışma başvuruları 96 saat boyunca burada mesajlaşmaya açılır.
      </p>

      <div className="mt-8">
        <MessageBanner error={hata} notice={bildirim} />
      </div>

      {conversations.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-ink/10 bg-paper p-8 text-center">
          <h2 className="font-display text-2xl text-ink">Açılmış görüşme yok</h2>
          <p className="mt-3 text-sm text-ink-soft">
            Bir tanışma başvurusu kabul edildiğinde görüşme burada görünür.
          </p>
          <Link href="/talepler" className={`${buttonStyles.secondary} mt-6`}>
            Başvurulara dön
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {conversations.map((conversation) => (
            <article
              key={conversation.conversation_id}
              className="rounded-[2rem] border border-ink/10 bg-paper p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-3xl text-ink">
                    {conversation.other_display_name}
                  </h2>
                  <p className="mt-2 text-sm text-ink-muted">
                    {conversation.message_count > 0
                      ? `${conversation.message_count} mesaj`
                      : "Henüz mesaj yok"}
                  </p>
                </div>
                <span className="rounded-full bg-sand px-4 py-2 text-xs font-semibold text-ink-soft">
                  {STATUS_LABELS[conversation.conversation_status]}
                </span>
              </div>

              {conversation.last_message_preview ? (
                <p className="mt-5 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                  {conversation.last_message_preview}
                </p>
              ) : null}

              <p className="mt-4 text-xs text-ink-muted">
                {conversation.conversation_status === "decision_window"
                  ? `Karar penceresi sonu: ${formatDate(addHours(conversation.pre_meeting_expires_at, 24))}`
                  : conversation.conversation_status === "active"
                    ? "Karşılıklı devam kararı verildi."
                    : `Ön görüşme sonu: ${formatDate(conversation.pre_meeting_expires_at)}`}
              </p>
              <Link
                href={`/gorusmeler/${conversation.conversation_id}`}
                className={`${buttonStyles.primary} mt-5`}
              >
                Görüşmeyi aç
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
