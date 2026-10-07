import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { sendConversationMessageAction } from "@/app/actions/conversations";
import { MessageBanner, TextArea } from "@/components/form-controls";
import { buttonStyles } from "@/components/ui";
import { getConversation } from "@/lib/data/conversations";
import { getMyAccountAndProfile } from "@/lib/data/profile";
import { conversationIdSchema, MESSAGE_MAX_LENGTH } from "@/lib/validation/conversation";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ hata?: string; bildirim?: string }>;
}) {
  const [{ conversationId }, { hata, bildirim }, accountData] = await Promise.all([
    params,
    searchParams,
    getMyAccountAndProfile(),
  ]);

  if (!accountData.account.onboarding_completed_at) redirect("/onboarding");
  if (!conversationIdSchema.safeParse(conversationId).success) notFound();

  const conversation = await getConversation(conversationId);
  if (!conversation) notFound();

  const { details, messages } = conversation;
  const isOpen = details.conversation_status === "pre_meeting";

  return (
    <section>
      <Link href="/gorusmeler" className="text-sm font-semibold text-ember hover:text-ember-deep">
        ← Görüşmelere dön
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
            96 saatlik ön görüşme
          </p>
          <h1 className="mt-3 font-display text-4xl text-ink">{details.other_display_name}</h1>
        </div>
        <span className={`rounded-full px-4 py-2 text-xs font-semibold ${
          isOpen ? "bg-moss/10 text-moss" : "bg-sand text-ink-muted"
        }`}>
          {isOpen ? "Ön görüşme açık" : "Görüşme sona erdi"}
        </span>
      </div>

      <p className="mt-4 text-sm text-ink-muted">
        Süre sonu: {formatDate(details.pre_meeting_expires_at)}
      </p>
      <p className="mt-3 rounded-xl border border-ink/10 bg-paper px-4 py-3 text-sm leading-relaxed text-ink-soft">
        Güvenliğin için telefon, adres, iş yeri veya ödeme bilgisi paylaşma. Okundu bilgisi ve
        çevrimiçi durum gösterilmez.
      </p>

      <div className="mt-6">
        <MessageBanner error={hata} notice={bildirim} />
      </div>

      <div className="mt-6 space-y-3 rounded-[2rem] border border-ink/10 bg-paper p-4 sm:p-6">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-muted">
            {isOpen ? "Henüz mesaj yok. İlk mesajı nazik ve sade tutabilirsin." : "Bu görüşme mesajlaşmaya kapalı."}
          </p>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === accountData.user.id;
            return (
              <div key={message.message_id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                  isMine ? "bg-ember text-white" : "bg-sand text-ink"
                }`}>
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.body}</p>
                  <time className={`mt-2 block text-[0.7rem] ${isMine ? "text-white/75" : "text-ink-muted"}`}>
                    {formatDate(message.created_at)}
                  </time>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isOpen ? (
        <form action={sendConversationMessageAction} className="mt-5 rounded-[2rem] border border-ink/10 bg-paper p-5 sm:p-6">
          <input type="hidden" name="conversationId" value={details.conversation_id} />
          <label className="block text-sm font-medium text-ink">
            Mesajın
            <TextArea
              name="body"
              rows={4}
              maxLength={MESSAGE_MAX_LENGTH}
              required
              placeholder="Kendini rahat hissettiğin kadarını paylaş..."
            />
          </label>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-ink-muted">En fazla {MESSAGE_MAX_LENGTH} karakter</span>
            <button type="submit" className={buttonStyles.primary}>Mesaj gönder</button>
          </div>
        </form>
      ) : null}

      {isOpen ? (
        <div className="mt-4 text-center">
          <Link href={`/gorusmeler/${details.conversation_id}`} className="text-sm font-semibold text-ink-soft hover:text-ink">
            Yeni mesajları kontrol et
          </Link>
        </div>
      ) : null}
    </section>
  );
}
