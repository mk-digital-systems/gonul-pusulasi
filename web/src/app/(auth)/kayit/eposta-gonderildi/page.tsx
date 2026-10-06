import Link from "next/link";
import { resendVerificationAction } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { MessageBanner } from "@/components/form-controls";
import { buttonStyles } from "@/components/ui";

export default async function EmailSentPage({ searchParams }: { searchParams: Promise<{ email?: string; bildirim?: string }> }) {
  const { email, bildirim } = await searchParams;
  return (
    <AuthShell title="E-postanı kontrol et" intro="Hesabını etkinleştirmek için doğrulama bağlantısına tıkla.">
      <MessageBanner notice={bildirim} />
      <p className="mt-4 rounded-xl bg-sand p-4 text-sm leading-relaxed text-ink-soft">
        {email ? <><strong className="text-ink">{email}</strong> adresine bir bağlantı gönderdik. </> : null}
        E-posta birkaç dakika içinde gelmezse spam klasörünü de kontrol et.
      </p>
      {email ? (
        <form action={resendVerificationAction} className="mt-4 text-center">
          <input type="hidden" name="email" value={email} />
          <button type="submit" className="text-sm font-medium text-ember underline underline-offset-4">
            Doğrulama e-postasını yeniden gönder
          </button>
        </form>
      ) : null}
      <Link href="/giris" className={`${buttonStyles.secondary} mt-6 w-full`}>Giriş sayfasına dön</Link>
    </AuthShell>
  );
}
