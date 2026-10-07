import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonStyles } from "@/components/ui";
import { getModerationActionLog, getMyStaffRole } from "@/lib/data/moderation";

const ACTION_LABELS = {
  account_suspended: "Hesap askıya alındı",
  account_restored: "Hesap geri açıldı",
} as const;

const STATUS_LABELS: Record<string, string> = {
  active: "Etkin",
  paused: "Duraklatıldı",
  deletion_requested: "Silme talebi",
  suspended: "Askıda",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export default async function ModerationActionLogPage() {
  const staffRole = await getMyStaffRole();
  if (staffRole !== "admin") notFound();

  const actions = await getModerationActionLog();

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
        Yönetim · Admin
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink">Moderasyon işlem geçmişi</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
        Manuel hesap askıya alma ve geri açma kararlarının gerekçeli denetim kaydıdır.
        Bu sayfa yalnızca admin rolüne açıktır.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/yonetim/sikayetler" className={buttonStyles.secondary}>
          Şikâyet kuyruğuna dön
        </Link>
        <Link href="/yonetim/ekip" className={buttonStyles.secondary}>
          Moderasyon ekibi
        </Link>
      </div>

      {actions.length === 0 ? (
        <p className="mt-6 rounded-[2rem] border border-ink/10 bg-paper p-6 text-sm text-ink-muted">
          Henüz kayıtlı moderasyon işlemi yok.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {actions.map((action) => (
            <article
              key={action.action_id}
              className="rounded-[2rem] border border-ink/10 bg-paper p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ember">
                    {ACTION_LABELS[action.action]}
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-ink">
                    {action.target_display_name ?? "Silinmiş kullanıcı"}
                  </h2>
                </div>
                <time className="text-xs text-ink-muted" dateTime={action.created_at}>
                  {formatDate(action.created_at)}
                </time>
              </div>

              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                    İşlemi yapan
                  </dt>
                  <dd className="mt-1 text-ink">
                    {action.staff_display_name ?? "Silinmiş personel"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
                    Durum geçişi
                  </dt>
                  <dd className="mt-1 text-ink">
                    {STATUS_LABELS[action.previous_status] ?? action.previous_status}
                    {" → "}
                    {STATUS_LABELS[action.new_status] ?? action.new_status}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 rounded-xl bg-sand/60 p-4 text-sm leading-relaxed text-ink-soft">
                {action.reason}
              </div>

              {action.report_id ? (
                <Link
                  href={`/yonetim/sikayetler/${action.report_id}`}
                  className="mt-4 inline-block text-sm font-semibold text-ember-deep underline underline-offset-4"
                >
                  İlgili şikâyeti incele
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
