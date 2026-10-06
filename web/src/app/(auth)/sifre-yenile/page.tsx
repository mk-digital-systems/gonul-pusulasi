import { updatePasswordAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { FormField, MessageBanner, TextInput } from "@/components/form-controls";
import { buttonStyles } from "@/components/ui";

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ hata?: string }> }) {
  const { hata } = await searchParams;
  return (
    <AuthShell title="Yeni şifreni belirle" intro="Yeni şifren daha önce kullandıklarından farklı ve tahmin edilmesi zor olsun.">
      <MessageBanner error={hata} />
      <form action={updatePasswordAction} className="mt-5 space-y-5">
        <FormField label="Yeni şifre"><TextInput name="password" type="password" autoComplete="new-password" minLength={10} required /></FormField>
        <FormField label="Yeni şifreyi tekrar yaz"><TextInput name="passwordConfirm" type="password" autoComplete="new-password" minLength={10} required /></FormField>
        <button type="submit" className={`${buttonStyles.primary} w-full`}>Şifremi güncelle</button>
      </form>
    </AuthShell>
  );
}
