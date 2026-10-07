import Link from "next/link";
import { redirect } from "next/navigation";
import {
  pauseAccountAction,
  requestAccountDeletionAction,
  resumeAccountAction,
} from "@/app/actions/profile";
import { MessageBanner, TextInput } from "@/components/form-controls";
import { buttonStyles } from "@/components/ui";
import { getMyAccountAndProfile, getProfileOptions } from "@/lib/data/profile";
import { ageOn, effectiveAgePreference } from "@/lib/profile-rules";

const STATUS_LABELS = {
  active: "Etkin",
  paused: "Duraklatıldı",
  deletion_requested: "Silme talebi alındı",
  suspended: "Askıya alındı",
} as const;

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ hata?: string; bildirim?: string }> }) {
  const [{ user, account, profile }, options, { hata, bildirim }] = await Promise.all([
    getMyAccountAndProfile(),
    getProfileOptions(),
    searchParams,
  ]);

  if (!account.onboarding_completed_at) redirect("/onboarding");

  const city = options.cities.find((item) => item.id === profile.city_id)?.name ?? "—";
  const goal = options.goals.find((item) => item.code === profile.relationship_goal_code)?.label ?? "—";
  const age = profile.date_of_birth ? ageOn(profile.date_of_birth) : Number.NaN;
  const agePreference = effectiveAgePreference(age, {
    min: profile.age_preference_min,
    max: profile.age_preference_max,
  });

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">Hesabım</p>
      <h1 className="mt-3 font-display text-4xl text-ink">Merhaba, {profile.display_name}.</h1>
      <p className="mt-4 leading-relaxed text-ink-soft">
        Temel profilin hazır. İlişki Pusulanı tamamlayarak karşılıklı yaş ve uyum
        tercihlerine göre adaylarını keşfedebilirsin.
      </p>
      <div className="mt-8"><MessageBanner error={hata} notice={bildirim} /></div>

      <dl className="mt-6 grid gap-4 rounded-[2rem] border border-ink/10 bg-paper p-6 sm:grid-cols-2 sm:p-8">
        {[
          ["Hesap durumu", STATUS_LABELS[account.status]],
          ["E-posta", user.email ?? "—"],
          ["Yaş", Number.isFinite(age) ? String(age) : "—"],
          ["Cinsiyet", profile.gender === "woman" ? "Kadın" : "Erkek"],
          ["Şehir", city],
          ["İlişki amacı", goal],
          ["Yaş tercihi", `${agePreference.min}–${agePreference.max} (${agePreference.source === "default" ? "varsayılan" : "kesin"})`],
        ].map(([label, content]) => (
          <div key={label} className="border-b border-ink/10 pb-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">{label}</dt>
            <dd className="mt-1 text-ink">{content}</dd>
          </div>
        ))}
      </dl>

      {account.status !== "deletion_requested" && account.status !== "suspended" ? (
        <div className="mt-8 flex flex-wrap gap-3">
          {account.status === "active" ? (
            <Link href="/uyum" className={buttonStyles.primary}>İlişki Pusulanı doldur</Link>
          ) : null}
          <Link href="/profil" className={buttonStyles.secondary}>Profili düzenle</Link>
          <Link href="/engellenenler" className={buttonStyles.secondary}>Engellediklerim</Link>
          {account.status === "active" ? (
            <form action={pauseAccountAction}><button type="submit" className={buttonStyles.secondary}>Hesabı duraklat</button></form>
          ) : (
            <form action={resumeAccountAction}><button type="submit" className={buttonStyles.secondary}>Hesabı yeniden etkinleştir</button></form>
          )}
        </div>
      ) : null}

      <section className="mt-12 rounded-2xl border border-ember/20 bg-paper p-6">
        <h2 className="font-display text-2xl text-ink">Hesap silme talebi</h2>
        {account.status === "deletion_requested" ? (
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">Talebiniz alındı. Hesap silme işlemi yetkili süreçte tamamlanacak.</p>
        ) : (
          <form action={requestAccountDeletionAction} className="mt-4 space-y-4">
            <p className="text-sm leading-relaxed text-ink-soft">Talep oluşturmak için aşağıya <strong>HESABIMI SİL</strong> yaz. Bu adım veriyi hemen silmez; denetlenebilir silme sürecini başlatır ve oturumunu kapatır.</p>
            <TextInput name="confirmation" autoComplete="off" aria-label="Silme onayı" required />
            <button type="submit" className="rounded-full border border-ember px-5 py-2.5 text-sm font-semibold text-ember hover:bg-ember-soft">Silme talebi oluştur</button>
          </form>
        )}
      </section>
    </section>
  );
}
