import Link from "next/link";
import { redirect } from "next/navigation";
import { sendIntroductionRequestAction } from "@/app/actions/introductions";
import { MessageBanner, TextArea } from "@/components/form-controls";
import { buttonStyles } from "@/components/ui";
import { getCandidateDoorQuestions } from "@/lib/data/introductions";
import { getMyAccountAndProfile } from "@/lib/data/profile";

export default async function IntroductionRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ candidateId: string }>;
  searchParams: Promise<{ hata?: string; bildirim?: string }>;
}) {
  const [{ candidateId }, { hata, bildirim }, accountData] = await Promise.all([
    params,
    searchParams,
    getMyAccountAndProfile(),
  ]);

  if (!accountData.account.onboarding_completed_at) redirect("/onboarding");
  if (accountData.account.status !== "active") redirect("/hesabim");

  const questions = await getCandidateDoorQuestions(candidateId);
  const candidateName = questions[0]?.candidate_display_name ?? "Bu aday";

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
        Tanışma başvurusu
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink">
        {candidateName} için kapı soruları
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
        Cevapların yalnızca bu başvurunun alıcısı tarafından görülebilir. Başvuru
        48 saat içinde yanıtlanmazsa sona erer.
      </p>

      <div className="mt-8">
        <MessageBanner error={hata} notice={bildirim} />
      </div>

      {questions.length !== 3 ? (
        <div className="mt-8 rounded-[2rem] border border-ink/10 bg-paper p-8 text-center">
          <h2 className="font-display text-2xl text-ink">Aday henüz başvuru almıyor</h2>
          <p className="mt-3 text-sm text-ink-soft">
            Kapı soruları tamamlandığında yeniden deneyebilirsin.
          </p>
          <Link href="/kesfet" className={`${buttonStyles.secondary} mt-6`}>
            Keşfe dön
          </Link>
        </div>
      ) : (
        <form action={sendIntroductionRequestAction} className="mt-8 space-y-5">
          <input type="hidden" name="candidateId" value={candidateId} />
          {questions.map((question, index) => (
            <label
              key={question.question_code}
              className="block rounded-[2rem] border border-ink/10 bg-paper p-6 text-sm font-semibold text-ink sm:p-8"
            >
              <span className="text-xs uppercase tracking-[0.14em] text-ember">
                {index + 1} / 3
              </span>
              <span className="mt-2 block font-display text-2xl leading-snug">
                {question.prompt}
              </span>
              <TextArea
                name={`answer:${question.question_code}`}
                minLength={20}
                maxLength={500}
                rows={5}
                required
                placeholder="En az 20 karakterle, kendi sözlerinle yanıtla."
              />
            </label>
          ))}
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={buttonStyles.primary}>
              Başvuruyu gönder
            </button>
            <Link href="/kesfet" className={buttonStyles.secondary}>
              Vazgeç
            </Link>
          </div>
        </form>
      )}
    </section>
  );
}
