import { redirect } from "next/navigation";
import { unblockUserAction } from "@/app/actions/safety";
import { MessageBanner } from "@/components/form-controls";
import { buttonStyles } from "@/components/ui";
import { getMyBlockedUsers } from "@/lib/data/safety";
import { getMyAccountAndProfile } from "@/lib/data/profile";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export default async function BlockedUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; bildirim?: string }>;
}) {
  const [accountData, blockedUsers, { hata, bildirim }] = await Promise.all([
    getMyAccountAndProfile(),
    getMyBlockedUsers(),
    searchParams,
  ]);

  if (!accountData.account.onboarding_completed_at) redirect("/onboarding");

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
        Güvenlik
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink">Engellediğin kullanıcılar</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
        Engellediğin kişiler seni keşifte göremez; aranızda yeni başvuru, görüşme veya mesaj
        oluşturulamaz. Engel kaldırıldığında kapanmış görüşmeler yeniden açılmaz.
      </p>

      <div className="mt-8">
        <MessageBanner error={hata} notice={bildirim} />
      </div>

      {blockedUsers.length === 0 ? (
        <p className="mt-6 rounded-[2rem] border border-ink/10 bg-paper p-6 text-sm text-ink-muted">
          Engellediğin bir kullanıcı yok.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {blockedUsers.map((blockedUser) => (
            <article
              key={blockedUser.blocked_user_id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-ink/10 bg-paper p-5 sm:p-6"
            >
              <div>
                <h2 className="font-display text-2xl text-ink">{blockedUser.display_name}</h2>
                <p className="mt-1 text-xs text-ink-muted">
                  Engelleme zamanı: {formatDate(blockedUser.blocked_at)}
                </p>
              </div>
              <form action={unblockUserAction}>
                <input type="hidden" name="targetUserId" value={blockedUser.blocked_user_id} />
                <button type="submit" className={buttonStyles.secondary}>Engeli kaldır</button>
              </form>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
