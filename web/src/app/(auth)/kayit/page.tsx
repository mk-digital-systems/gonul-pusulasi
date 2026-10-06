import type { Metadata } from "next";
import Link from "next/link";
import { signUpAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { FormField, MessageBanner, TextInput } from "@/components/form-controls";
import { buttonStyles } from "@/components/ui";

export const metadata: Metadata = { title: "Hesap Oluştur | Gönül Pusulası" };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ hata?: string }> }) {
  const { hata } = await searchParams;
  return (
    <AuthShell title="Hesap oluştur" intro="Gönül Pusulası yalnızca 30 yaş ve üzeri kullanıcılar içindir.">
      <MessageBanner error={hata} />
      <form action={signUpAction} className="mt-5 space-y-5">
        <FormField label="E-posta">
          <TextInput name="email" type="email" autoComplete="email" required />
        </FormField>
        <FormField label="Şifre" hint="En az 10 karakter; en az bir harf ve bir rakam.">
          <TextInput name="password" type="password" autoComplete="new-password" minLength={10} required />
        </FormField>
        <FormField label="Şifreyi tekrar yaz">
          <TextInput name="passwordConfirm" type="password" autoComplete="new-password" minLength={10} required />
        </FormField>
        <button type="submit" className={`${buttonStyles.primary} w-full`}>Hesabımı oluştur</button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Zaten hesabın var mı? <Link href="/giris" className="text-ember underline underline-offset-4">Giriş yap</Link>
      </p>
    </AuthShell>
  );
}
