import { redirect } from "next/navigation";
import { saveCompatibilityAnswersAction } from "@/app/actions/compatibility";
import { MessageBanner, SelectInput } from "@/components/form-controls";
import { buttonStyles } from "@/components/ui";
import {
  getCompatibilityQuestionnaire,
  getMyCompatibilityState,
} from "@/lib/data/compatibility";
import { getMyAccountAndProfile } from "@/lib/data/profile";

const IMPORTANCE_OPTIONS = [
  { value: "not_important", label: "Fark etmez" },
  { value: "important", label: "Önemli" },
  { value: "very_important", label: "Çok önemli" },
] as const;

export default async function CompatibilityPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; bildirim?: string }>;
}) {
  const [accountData, questionnaire, state, { hata, bildirim }] =
    await Promise.all([
      getMyAccountAndProfile(),
      getCompatibilityQuestionnaire(),
      getMyCompatibilityState(),
      searchParams,
    ]);

  if (!accountData.account.onboarding_completed_at) redirect("/onboarding");
  if (accountData.account.status !== "active") redirect("/hesabim");

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
        İlişki Pusulan
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink">
        Sana gerçekten uyan kişiyi tarif et.
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
        Her soruda önce kendi cevabını, sonra karşı tarafta kabul edebileceğin
        cevapları seç. En fazla 5 başlığı “Çok önemli” olarak işaretleyebilirsin.
        Sonuçlarda yapay bir yüzde yerine açıklanabilir uyum bantları gösterilir.
      </p>

      <div className="mt-8">
        <MessageBanner error={hata} notice={bildirim} />
      </div>

      {state.completedAt ? (
        <p className="mt-6 rounded-xl border border-moss/25 bg-moss/10 px-4 py-3 text-sm text-moss">
          Uyum profilin hazır. Cevaplarını istediğin zaman güncelleyebilirsin.
        </p>
      ) : null}

      <form action={saveCompatibilityAnswersAction} className="mt-8 space-y-6">
        {questionnaire.questions.map((question, index) => {
          const saved = state.answers.get(question.code);
          return (
            <fieldset
              key={question.code}
              className="rounded-[2rem] border border-ink/10 bg-paper p-6 sm:p-8"
            >
              <legend className="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-ember">
                {index + 1} / {questionnaire.questions.length}
              </legend>
              <h2 className="font-display text-2xl leading-snug text-ink">
                {question.prompt}
              </h2>
              {question.help_text ? (
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {question.help_text}
                </p>
              ) : null}

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-ink">Benim cevabım</p>
                  <div className="mt-3 space-y-2">
                    {question.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink/10 px-4 py-3 text-sm text-ink-soft transition hover:border-ember/40 hover:bg-ember-soft/30"
                      >
                        <input
                          type="radio"
                          name={`answer:${question.code}`}
                          value={option.id}
                          defaultChecked={saved?.answerOptionId === option.id}
                          required
                          className="mt-0.5 h-4 w-4 accent-ember"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-ink">
                    Karşı tarafta kabul edebileceklerim
                  </p>
                  <div className="mt-3 space-y-2">
                    {question.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink/10 px-4 py-3 text-sm text-ink-soft transition hover:border-ember/40 hover:bg-ember-soft/30"
                      >
                        <input
                          type="checkbox"
                          name={`accepted:${question.code}`}
                          value={option.id}
                          defaultChecked={saved?.acceptedOptionIds.includes(option.id)}
                          className="mt-0.5 h-4 w-4 accent-ember"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <label className="mt-6 block max-w-xs text-sm font-semibold text-ink">
                Bu konu benim için
                <SelectInput
                  name={`importance:${question.code}`}
                  defaultValue={saved?.importance ?? "important"}
                  required
                >
                  {IMPORTANCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectInput>
              </label>
            </fieldset>
          );
        })}

        <div className="sticky bottom-4 rounded-2xl border border-ink/10 bg-paper/95 p-4 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-4">
          <p className="text-sm leading-relaxed text-ink-muted">
            Kaydettiğinde keşif sonuçların güncel cevaplarına göre yeniden hesaplanır.
          </p>
          <button
            type="submit"
            className={`${buttonStyles.primary} mt-3 w-full shrink-0 sm:mt-0 sm:w-auto`}
          >
            Uyum profilimi kaydet
          </button>
        </div>
      </form>
    </section>
  );
}
