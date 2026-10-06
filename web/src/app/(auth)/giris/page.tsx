import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { FormField, MessageBanner, TextInput } from "@/components/form-controls";
import { buttonStyles } from "@/components/ui";
import { signInAction } from "@/app/actions/auth";

export const metadata: Metadata = { title: "Giriş | Gönül Pusulası" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; bildirim?: string }>;
}) {
  const { hata, bildirim } = await searchParams;
  return (
    <AuthShell title="Hesabına giriş yap" intro="E-posta adresin ve şifrenle devam et.">
      <MessageBanner error={hata} notice={bildirim} />
      <form action={signInAction} className="mt-5 space-y-5">
        <FormField label="E-posta">
          <TextInput name="email" type="email" autoComplete="email" required />
        </FormField>
        <FormField label="Şifre">
          <TextInput name="password" type="password" autoComplete="current-password" required />
        </FormField>
        <button type="submit" className={`${buttonStyles.primary} w-full`}>Giriş yap</button>
      </form>
      <div className="mt-6 flex flex-col gap-2 text-center text-sm">
        <Link href="/sifremi-unuttum" className="text-ember underline underline-offset-4">Şifremi unuttum</Link>
        <Link href="/kayit" className="text-ink-soft underline underline-offset-4">Hesap oluştur</Link>
      </div>
    </AuthShell>
  );
}
