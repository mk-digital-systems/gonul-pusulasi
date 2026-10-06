"use client";

import { useActionState } from "react";
import { buttonStyles } from "@/components/ui";
import { deleteWaitlist, type DeleteState } from "@/lib/waitlist/actions";

const INITIAL: DeleteState = { status: "idle" };

export function DeleteForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(deleteWaitlist, INITIAL);

  if (state.status === "deleted") {
    return (
      <div role="status">
        <h1 className="font-display text-3xl text-ink">Kaydın silindi.</h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-soft">
          E-posta adresin ve verdiğin bütün bilgiler erken erişim listesinden kalıcı olarak silindi.
          Sana bir daha e-posta göndermeyeceğiz.
        </p>
      </div>
    );
  }

  if (!token || state.status === "invalid") {
    return (
      <div role="status">
        <h1 className="font-display text-3xl text-ink">Bu bağlantı geçerli değil.</h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-soft">
          Kaydın zaten silinmiş olabilir. Her yeni e-postamızda güncel bir bağlantı bulunur; en son
          gelen e-postadaki bağlantıyı kullan.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <h1 className="font-display text-3xl text-ink">Kaydını sil</h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-soft">
        Erken erişim kaydını silersen e-posta adresin ve verdiğin bütün bilgiler kalıcı olarak
        silinir; uygulama açıldığında sana haber veremeyiz. Bu işlem geri alınamaz.
      </p>
      {state.status === "error" ? (
        <p role="alert" className="mt-6 rounded-xl bg-ember-soft/60 px-4 py-3 text-sm text-ember-deep">
          Şu an kaydını silemedik. Lütfen biraz sonra tekrar dene.
        </p>
      ) : null}
      <label className="mx-auto mt-8 flex max-w-md items-start gap-3 text-left text-sm leading-relaxed text-ink">
        <input type="checkbox" name="confirm" required className="mt-1 h-4 w-4 shrink-0 accent-ember" />
        <span>Kaydımın kalıcı olarak silineceğini anlıyorum.</span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className={`${buttonStyles.primary} mt-6 px-8 py-3.5 text-base disabled:opacity-60`}
      >
        {pending ? "Siliniyor…" : "Kaydımı sil"}
      </button>
    </form>
  );
}
