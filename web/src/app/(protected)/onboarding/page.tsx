import { redirect } from "next/navigation";
import { completeOnboardingAction } from "@/app/actions/profile";
import { FormField, MessageBanner, SelectInput, TextInput } from "@/components/form-controls";
import { EditableProfileFields } from "@/components/profile-form-fields";
import { buttonStyles } from "@/components/ui";
import { getMyAccountAndProfile, getProfileOptions } from "@/lib/data/profile";
import { maximumBirthDateForMinimumAge } from "@/lib/profile-rules";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ hata?: string }> }) {
  const [{ account }, options, { hata }] = await Promise.all([
    getMyAccountAndProfile(),
    getProfileOptions(),
    searchParams,
  ]);

  if (account.onboarding_completed_at) redirect("/hesabim");

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">Profil kurulumu</p>
      <h1 className="mt-3 font-display text-4xl text-ink">Seni tanımaya başlayalım.</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
        Bu bilgiler Faz 1’de yalnızca hesabını ve temel tercihlerini oluşturur. Henüz aday keşfi veya mesajlaşma yapılmaz.
      </p>
      <div className="mt-8"><MessageBanner error={hata} /></div>
      <form action={completeOnboardingAction} className="mt-6 space-y-6 rounded-[2rem] border border-ink/10 bg-paper p-6 sm:p-8">
        <EditableProfileFields cities={options.cities} goals={options.goals} />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Doğum tarihi" hint="Onayladıktan sonra normal profil düzenlemesinden değiştirilemez.">
            <TextInput name="dateOfBirth" type="date" max={maximumBirthDateForMinimumAge()} required />
          </FormField>
          <FormField label="Cinsiyet">
            <SelectInput name="gender" defaultValue="" required>
              <option value="" disabled>Seçiniz</option>
              <option value="woman">Kadın</option>
              <option value="man">Erkek</option>
            </SelectInput>
          </FormField>
        </div>
        <label className="flex items-start gap-3 rounded-xl bg-sand/70 p-4 text-sm leading-relaxed text-ink-soft">
          <input name="birthDateConfirmed" type="checkbox" required className="mt-1 h-4 w-4 accent-ember" />
          <span>Doğum tarihimin doğru olduğunu ve profil tamamlandıktan sonra destek süreci olmadan değiştirilemeyeceğini onaylıyorum.</span>
        </label>
        <button type="submit" className={`${buttonStyles.primary} w-full sm:w-auto`}>Profili tamamla</button>
      </form>
    </section>
  );
}
