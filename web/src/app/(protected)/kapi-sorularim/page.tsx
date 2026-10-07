import { redirect } from "next/navigation";
import { saveDoorQuestionsAction } from "@/app/actions/introductions";
import { MessageBanner } from "@/components/form-controls";
import { buttonStyles } from "@/components/ui";
import { getMyDoorQuestionSettings } from "@/lib/data/introductions";
import { getMyAccountAndProfile } from "@/lib/data/profile";

export default async function DoorQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; bildirim?: string }>;
}) {
  const [accountData, settings, { hata, bildirim }] = await Promise.all([
    getMyAccountAndProfile(),
    getMyDoorQuestionSettings(),
    searchParams,
  ]);

  if (!accountData.account.onboarding_completed_at) redirect("/onboarding");
  if (accountData.account.status !== "active") redirect("/hesabim");

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
        Kapı sorularım
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink">
        Seni tanımak isteyen kişi önce bu soruları yanıtlasın.
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
        Tam olarak 3 soru seç. Tanışma başvurusu gönderen kişiler her soruya
        20–500 karakter arasında cevap verecek.
      </p>

      <div className="mt-8">
        <MessageBanner error={hata} notice={bildirim} />
      </div>

      <form action={saveDoorQuestionsAction} className="mt-8">
        <fieldset className="space-y-3 rounded-[2rem] border border-ink/10 bg-paper p-6 sm:p-8">
          <legend className="px-2 text-sm font-semibold text-ink">
            Katalogdan 3 soru seç
          </legend>
          {settings.catalog.map((question) => (
            <label
              key={question.code}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink/10 px-4 py-4 text-sm leading-relaxed text-ink-soft transition hover:border-ember/40 hover:bg-ember-soft/30"
            >
              <input
                type="checkbox"
                name="questionCodes"
                value={question.code}
                defaultChecked={settings.selectedCodes.includes(question.code)}
                className="mt-0.5 h-4 w-4 accent-ember"
              />
              <span>{question.prompt}</span>
            </label>
          ))}
        </fieldset>
        <button type="submit" className={`${buttonStyles.primary} mt-6`}>
          Kapı sorularımı kaydet
        </button>
      </form>
    </section>
  );
}
