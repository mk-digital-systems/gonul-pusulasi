import Link from "next/link";
import { redirect } from "next/navigation";
import { respondToIntroductionRequestAction } from "@/app/actions/introductions";
import { MessageBanner } from "@/components/form-controls";
import { buttonStyles } from "@/components/ui";
import { getMyIntroductionRequests } from "@/lib/data/introductions";
import { getMyAccountAndProfile } from "@/lib/data/profile";

const STATUS_LABELS = {
  pending: "Yanıt bekliyor",
  accepted: "Kabul edildi",
  declined: "Reddedildi",
  cancelled: "İptal edildi",
  expired: "Süresi doldu",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; bildirim?: string }>;
}) {
  const [accountData, requests, { hata, bildirim }] = await Promise.all([
    getMyAccountAndProfile(),
    getMyIntroductionRequests(),
    searchParams,
  ]);

  if (!accountData.account.onboarding_completed_at) redirect("/onboarding");

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
        Tanışma başvuruları
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink">Başvurularını yönet.</h1>
      <p className="mt-4 leading-relaxed text-ink-soft">
        Bekleyen başvurular 48 saat geçerlidir. Kabul edildiğinde 96 saatlik ön
        görüşme süreci başlar.
      </p>

      <div className="mt-8">
        <MessageBanner error={hata} notice={bildirim} />
      </div>

      {requests.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-ink/10 bg-paper p-8 text-center">
          <h2 className="font-display text-2xl text-ink">Henüz başvuru yok</h2>
          <p className="mt-3 text-sm text-ink-soft">
            Gönderdiğin ve aldığın tanışma başvuruları burada görünecek.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {requests.map((request) => (
            <article
              key={request.request_id}
              className="rounded-[2rem] border border-ink/10 bg-paper p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ember">
                    {request.direction === "incoming" ? "Gelen başvuru" : "Gönderilen başvuru"}
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-ink">
                    {request.other_display_name}
                  </h2>
                </div>
                <span className="rounded-full bg-sand px-4 py-2 text-xs font-semibold text-ink-soft">
                  {STATUS_LABELS[request.status]}
                </span>
              </div>

              <p className="mt-3 text-xs text-ink-muted">
                Oluşturuldu: {formatDate(request.created_at)} · Son yanıt: {formatDate(request.expires_at)}
              </p>

              <div className="mt-6 space-y-4">
                {request.answers.map((answer) => (
                  <div key={answer.questionCode} className="rounded-xl bg-sand/60 p-4">
                    <h3 className="text-sm font-semibold text-ink">{answer.prompt}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                      {answer.answer}
                    </p>
                  </div>
                ))}
              </div>

              {request.status === "accepted" && request.pre_meeting_expires_at ? (
                <div className="mt-5 rounded-xl border border-moss/25 bg-moss/10 px-4 py-3 text-sm text-moss">
                  <p>Ön görüşme başladı. Süre sonu: {formatDate(request.pre_meeting_expires_at)}</p>
                  {request.conversation_id ? (
                    <Link
                      href={`/gorusmeler/${request.conversation_id}`}
                      className="mt-3 inline-flex font-semibold underline underline-offset-4"
                    >
                      Görüşmeye git
                    </Link>
                  ) : null}
                </div>
              ) : null}

              {request.status === "pending" ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  {request.direction === "incoming" ? (
                    <>
                      <form action={respondToIntroductionRequestAction}>
                        <input type="hidden" name="requestId" value={request.request_id} />
                        <input type="hidden" name="action" value="accept" />
                        <button type="submit" className={buttonStyles.primary}>Kabul et</button>
                      </form>
                      <form action={respondToIntroductionRequestAction}>
                        <input type="hidden" name="requestId" value={request.request_id} />
                        <input type="hidden" name="action" value="decline" />
                        <button type="submit" className={buttonStyles.secondary}>Nazikçe reddet</button>
                      </form>
                    </>
                  ) : (
                    <form action={respondToIntroductionRequestAction}>
                      <input type="hidden" name="requestId" value={request.request_id} />
                      <input type="hidden" name="action" value="cancel" />
                      <button type="submit" className={buttonStyles.secondary}>Başvuruyu iptal et</button>
                    </form>
                  )}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
