import { redirect } from "next/navigation";
import { updateProfileAction } from "@/app/actions/profile";
import { MessageBanner } from "@/components/form-controls";
import { EditableProfileFields } from "@/components/profile-form-fields";
import { buttonStyles } from "@/components/ui";
import { getMyAccountAndProfile, getProfileOptions } from "@/lib/data/profile";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ hata?: string; bildirim?: string }> }) {
  const [{ account, profile }, options, { hata, bildirim }] = await Promise.all([
    getMyAccountAndProfile(),
    getProfileOptions(),
    searchParams,
  ]);

  if (!account.onboarding_completed_at) redirect("/onboarding");
  if (account.status === "deletion_requested" || account.status === "suspended") redirect("/hesabim");

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">Profil</p>
      <h1 className="mt-3 font-display text-4xl text-ink">Profilini düzenle</h1>
      <p className="mt-4 leading-relaxed text-ink-soft">
        Doğum tarihi ve cinsiyet, ilk onaydan sonra normal profil düzenlemesinden değiştirilemez.
      </p>
      <div className="mt-8"><MessageBanner error={hata} notice={bildirim} /></div>
      <form action={updateProfileAction} className="mt-6 space-y-6 rounded-[2rem] border border-ink/10 bg-paper p-6 sm:p-8">
        <EditableProfileFields cities={options.cities} goals={options.goals} profile={profile} />
        <button type="submit" className={buttonStyles.primary}>Değişiklikleri kaydet</button>
      </form>
    </section>
  );
}
