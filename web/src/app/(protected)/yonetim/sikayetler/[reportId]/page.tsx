import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonStyles } from "@/components/ui";
import {
  getModerationReportContext,
  getMyStaffRole,
} from "@/lib/data/moderation";
import { reviewReportSchema } from "@/lib/validation/moderation";
import { REPORT_CATEGORY_OPTIONS } from "@/lib/validation/safety";

const STATUS_LABELS = {
  pending: "Bekliyor",
  reviewing: "İnceleniyor",
  resolved: "Çözüldü",
  dismissed: "Reddedildi",
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export default async function ModerationReportContextPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const [{ reportId }, staffRole] = await Promise.all([params, getMyStaffRole()]);
  if (!staffRole) notFound();

  const parsed = reviewReportSchema.safeParse({ reportId });
  if (!parsed.success) notFound();

  const context = await getModerationReportContext(parsed.data.reportId);
  if (!context) notFound();

  const { report, doorAnswers } = context;
  const category =
    REPORT_CATEGORY_OPTIONS.find((option) => option.value === report.category)?.label ??
    report.category;

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
        Yönetim · Şikâyet bağlamı
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink">
        {report.reported_display_name ?? "Silinmiş kullanıcı"}
      </h1>
      <p className="mt-3 text-sm text-ink-soft">
        {category} · {STATUS_LABELS[report.report_status]} · {formatDate(report.created_at)}
      </p>

      <div className="mt-6 rounded-2xl border border-ember/20 bg-ember-soft p-5 text-sm leading-relaxed text-ink-soft">
        Bu görünüm yalnızca şikâyete bağlı tanışma başvurusunun kapı sorusu cevaplarını içerir.
        Özel görüşme mesajları moderasyon ekranına getirilmez.
      </div>

      <dl className="mt-6 grid gap-4 rounded-[2rem] border border-ink/10 bg-paper p-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Bildiren</dt>
          <dd className="mt-1 text-ink">{report.reporter_display_name ?? "Silinmiş kullanıcı"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Hesap durumu</dt>
          <dd className="mt-1 text-ink">{report.reported_account_status ?? "Silinmiş"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Şikâyet açıklaması</dt>
          <dd className="mt-2 leading-relaxed text-ink-soft">
            {report.details ?? "Kullanıcı ek açıklama yazmadı."}
          </dd>
        </div>
      </dl>

      <section className="mt-8">
        <h2 className="font-display text-2xl text-ink">Kapı sorusu cevapları</h2>
        {doorAnswers.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-ink/10 bg-paper p-5 text-sm text-ink-muted">
            Bu şikâyete bağlı kapı cevabı bulunmuyor.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {doorAnswers.map((answer) => (
              <article
                key={`${answer.displayOrder}-${answer.prompt}`}
                className="rounded-2xl border border-ink/10 bg-paper p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                  {answer.displayOrder}. soru · {answer.answeringDisplayName ?? "Silinmiş kullanıcı"}
                </p>
                <h3 className="mt-2 font-semibold text-ink">{answer.prompt}</h3>
                <p className="mt-3 whitespace-pre-wrap leading-relaxed text-ink-soft">{answer.answer}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8">
        <Link href="/yonetim/sikayetler" className={buttonStyles.secondary}>
          Şikâyet kuyruğuna dön
        </Link>
      </div>
    </section>
  );
}
