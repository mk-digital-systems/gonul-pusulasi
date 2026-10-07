import Link from "next/link";
import { notFound } from "next/navigation";
import {
  resolveReportAction,
  restoreSuspendedUserAction,
  startReportReviewAction,
  suspendUserForReportAction,
} from "@/app/actions/moderation";
import { FormField, MessageBanner, TextArea } from "@/components/form-controls";
import { buttonStyles } from "@/components/ui";
import {
  getModerationReports,
  getMyStaffRole,
  type ModerationReportStatus,
} from "@/lib/data/moderation";
import { moderationQueueFilterSchema } from "@/lib/validation/moderation";
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

function categoryLabel(category: string) {
  return REPORT_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? category;
}

export default async function ModerationReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; hata?: string; bildirim?: string }>;
}) {
  const [{ durum, hata, bildirim }, staffRole] = await Promise.all([
    searchParams,
    getMyStaffRole(),
  ]);

  if (!staffRole) notFound();

  const parsedFilter = moderationQueueFilterSchema.safeParse(durum ?? "pending");
  const filter = parsedFilter.success ? parsedFilter.data : "pending";
  const reports = await getModerationReports(
    filter === "all" ? null : (filter as ModerationReportStatus),
  );

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
        Yönetim · {staffRole === "admin" ? "Admin" : "Moderatör"}
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink">Şikâyet kuyruğu</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
        Bu ekran kullanıcının şikâyet açıklamasını gösterir; özel sohbet içeriğine erişim vermez.
        Hesap yaptırımları otomatik değil, kayıtlı manuel kararlardır.
      </p>

      <div className="mt-8">
        <MessageBanner error={hata} notice={bildirim} />
      </div>

      {staffRole === "admin" ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/yonetim/islemler" className={buttonStyles.secondary}>
            Moderasyon işlem geçmişi
          </Link>
          <Link href="/yonetim/ekip" className={buttonStyles.secondary}>
            Moderasyon ekibi
          </Link>
        </div>
      ) : null}

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Şikâyet durumu filtresi">
        {[
          ["pending", "Bekleyen"],
          ["reviewing", "İncelenen"],
          ["resolved", "Çözülen"],
          ["dismissed", "Reddedilen"],
          ["all", "Tümü"],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={`/yonetim/sikayetler?durum=${value}`}
            className={filter === value ? buttonStyles.primary : buttonStyles.secondary}
          >
            {label}
          </Link>
        ))}
      </nav>

      {reports.length === 0 ? (
        <p className="mt-6 rounded-[2rem] border border-ink/10 bg-paper p-6 text-sm text-ink-muted">
          Bu durumda şikâyet bulunmuyor.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          {reports.map((report) => (
            <article key={report.report_id} className="rounded-[2rem] border border-ink/10 bg-paper p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ember">
                    {categoryLabel(report.category)}
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-ink">
                    {report.reported_display_name ?? "Silinmiş kullanıcı"}
                  </h2>
                  <p className="mt-1 text-xs text-ink-muted">
                    Bildiren: {report.reporter_display_name ?? "Silinmiş kullanıcı"} · {formatDate(report.created_at)}
                  </p>
                </div>
                <span className="rounded-full bg-sand px-3 py-1.5 text-xs font-semibold text-ink-soft">
                  {STATUS_LABELS[report.report_status]}
                </span>
              </div>

              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Hesap durumu</dt>
                  <dd className="mt-1 text-ink">{report.reported_account_status ?? "Silinmiş"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Görüşme</dt>
                  <dd className="mt-1 break-all text-ink">{report.conversation_id ?? "—"}</dd>
                </div>
              </dl>

              <div className="mt-5 rounded-xl bg-sand/60 p-4 text-sm leading-relaxed text-ink-soft">
                {report.details ?? "Kullanıcı ek açıklama yazmadı."}
              </div>

              <div className="mt-4">
                <Link
                  href={`/yonetim/sikayetler/${report.report_id}`}
                  className="text-sm font-semibold text-ember-deep underline underline-offset-4"
                >
                  Şikâyet bağlamını ve kapı cevaplarını incele
                </Link>
              </div>

              {report.resolution_note ? (
                <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                  <strong>Sonuç notu:</strong> {report.resolution_note}
                </p>
              ) : null}

              {report.report_status === "pending" ? (
                <form action={startReportReviewAction} className="mt-5">
                  <input type="hidden" name="reportId" value={report.report_id} />
                  <button type="submit" className={buttonStyles.secondary}>İncelemeye al</button>
                </form>
              ) : null}

              {report.report_status === "pending" || report.report_status === "reviewing" ? (
                <form action={resolveReportAction} className="mt-5 space-y-4 border-t border-ink/10 pt-5">
                  <input type="hidden" name="reportId" value={report.report_id} />
                  <FormField label="Sonuç notu" hint="Sonuçlandırmak için 10–1000 karakter yaz.">
                    <TextArea name="note" rows={3} minLength={10} maxLength={1000} required />
                  </FormField>
                  <div className="flex flex-wrap gap-3">
                    <button type="submit" name="status" value="resolved" className={buttonStyles.primary}>
                      Çözüldü olarak kapat
                    </button>
                    <button type="submit" name="status" value="dismissed" className={buttonStyles.secondary}>
                      Şikâyeti reddet
                    </button>
                  </div>
                </form>
              ) : null}

              {staffRole === "admin" && report.reported_user_id ? (
                report.reported_account_status === "suspended" ? (
                  <form action={restoreSuspendedUserAction} className="mt-5 space-y-4 border-t border-ink/10 pt-5">
                    <input type="hidden" name="targetUserId" value={report.reported_user_id} />
                    <FormField label="Geri açma gerekçesi">
                      <TextArea name="reason" rows={3} minLength={10} maxLength={1000} required />
                    </FormField>
                    <button type="submit" className={buttonStyles.secondary}>Hesabı geri aç</button>
                  </form>
                ) : report.reported_account_status !== "deletion_requested" &&
                  (report.report_status === "pending" || report.report_status === "reviewing") ? (
                  <form action={suspendUserForReportAction} className="mt-5 space-y-4 border-t border-ember/20 pt-5">
                    <input type="hidden" name="reportId" value={report.report_id} />
                    <FormField label="Askıya alma gerekçesi">
                      <TextArea name="reason" rows={3} minLength={10} maxLength={1000} required />
                    </FormField>
                    <button
                      type="submit"
                      className="rounded-full border border-ember px-5 py-2.5 text-sm font-semibold text-ember hover:bg-ember-soft"
                    >
                      Hesabı askıya al
                    </button>
                  </form>
                ) : null
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
