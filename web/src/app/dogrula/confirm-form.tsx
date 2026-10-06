"use client";

import { useActionState } from "react";
import Link from "next/link";
import { InviteShare } from "@/components/invite-share";
import { buttonStyles } from "@/components/ui";
import { confirmWaitlist, type ConfirmState } from "@/lib/waitlist/actions";

const INITIAL: ConfirmState = { status: "idle" };

export function ConfirmForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(confirmWaitlist, INITIAL);

  if (state.status === "ok") {
    return (
      <div role="status">
        <h1 className="font-display text-3xl text-ink">Kaydın tamamlandı.</h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-soft">
          Gönül Pusulası açıldığında sana haber vereceğiz. Davet bağlantını ayrıca e-postana da
          gönderdik.
        </p>
        <div className="mt-10">
          <InviteShare inviteUrl={state.inviteUrl} />
        </div>
      </div>
    );
  }

  if (!token || state.status === "invalid") {
    return (
      <div role="status">
        <h1 className="font-display text-3xl text-ink">Bu bağlantı geçerli değil.</h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-soft">
          Bağlantının süresi dolmuş, daha önce kullanılmış ya da yerine yenisi gönderilmiş olabilir.
          Kaydını zaten doğruladıysan yapman gereken bir şey yok. Değilse formu yeniden doldurarak
          yeni bir bağlantı isteyebilirsin.
        </p>
        <Link href="/#erken-erisim" className={`${buttonStyles.secondary} mt-8`}>
          Erken erişim formuna dön
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <h1 className="font-display text-3xl text-ink">E-posta adresini doğrula</h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-soft">
        Erken erişim kaydını tamamlamak için aşağıdaki düğmeye bas.
      </p>
      {state.status === "error" ? (
        <p role="alert" className="mt-6 rounded-xl bg-ember-soft/60 px-4 py-3 text-sm text-ember-deep">
          Şu an doğrulama yapamadık. Lütfen biraz sonra tekrar dene.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={`${buttonStyles.primary} mt-8 px-8 py-3.5 text-base disabled:opacity-60`}
      >
        {pending ? "Doğrulanıyor…" : "Kaydımı doğrula"}
      </button>
    </form>
  );
}
