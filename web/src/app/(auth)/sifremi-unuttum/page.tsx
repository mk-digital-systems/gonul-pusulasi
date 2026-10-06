import Link from "next/link";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { FormField, MessageBanner, TextInput } from "@/components/form-controls";
import { buttonStyles } from "@/components/ui";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ hata?: string; bildirim?: string }> }) {
  const { hata, bildirim } = await searchParams;
  return (
    <AuthShell title="Şifreni yenile" intro="Hesabında kullandığın e-posta adresini gir.">
      <MessageBanner error={hata} notice={bildirim} />
      <form action={requestPasswordResetAction} className="mt-5 space-y-5">
        <FormField label="E-posta"><TextInput name="email" type="email" autoComplete="email" required /></FormField>
        <button type="submit" className={`${buttonStyles.primary} w-full`}>Yenileme bağlantısı gönder</button>
      </form>
      <Link href="/giris" className="mt-6 block text-center text-sm text-ember underline underline-offset-4">Girişe dön</Link>
    </AuthShell>
  );
}
