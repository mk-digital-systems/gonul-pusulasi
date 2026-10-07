import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageBanner } from "@/components/form-controls";
import { buttonStyles } from "@/components/ui";
import {
  getDiscoveryCandidates,
  getMyCompatibilityState,
} from "@/lib/data/compatibility";
import { getMyAccountAndProfile } from "@/lib/data/profile";

export default async function DiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ hata?: string; bildirim?: string }>;
}) {
  const [accountData, state, { hata, bildirim }] = await Promise.all([
    getMyAccountAndProfile(),
    getMyCompatibilityState(),
    searchParams,
  ]);

  if (!accountData.account.onboarding_completed_at) redirect("/onboarding");
  if (accountData.account.status !== "active") redirect("/hesabim");

  const discovery = state.completedAt
    ? await getDiscoveryCandidates(10)
    : { candidates: [], errorCode: null };
  const { candidates } = discovery;

  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ember">
        Keşfet
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink">
        Kalabalık değil, anlamlı adaylar.
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
        Burada yalnızca karşılıklı yaş tercihinize uyan, etkin ve uyum profilini
        tamamlamış kişiler gösterilir. Ödeme durumu sıralamayı etkilemez.
      </p>

      <div className="mt-8">
        <MessageBanner error={hata} notice={bildirim} />
      </div>

      {!state.completedAt ? (
        <div className="mt-8 rounded-[2rem] border border-ink/10 bg-paper p-8 text-center">
          <h2 className="font-display text-2xl text-ink">Önce İlişki Pusulanı tamamla</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">
            Adayları rastgele sıralamıyoruz. Seni ve kabul edebileceğin cevapları
            bilmeden keşif listesi oluşturmuyoruz.
          </p>
          <Link href="/uyum" className={`${buttonStyles.primary} mt-6`}>
            Uyum sorularına başla
          </Link>
        </div>
      ) : discovery.errorCode ? (
        <div className="mt-8 rounded-[2rem] border border-ember/25 bg-paper p-8 text-center">
          <h2 className="font-display text-2xl text-ink">
            Adaylar şu anda yüklenemedi
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">
            Uyum profilin kayıtlı. Aday listesini oluştururken geçici bir sunucu
            hatası oluştu. Sayfayı yeniden deneyebilir veya cevaplarını gözden
            geçirebilirsin.
          </p>
          <p className="mt-3 text-xs text-ink-muted">
            Teknik hata kodu: {discovery.errorCode}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/kesfet" className={buttonStyles.primary}>
              Yeniden dene
            </Link>
            <Link href="/uyum" className={buttonStyles.secondary}>
              Uyum cevaplarımı gözden geçir
            </Link>
          </div>
        </div>
      ) : candidates.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-ink/10 bg-paper p-8 text-center">
          <h2 className="font-display text-2xl text-ink">Şimdilik uygun aday yok</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-soft">
            Tercihlerini sessizce genişletmiyoruz. Yeni ve karşılıklı uyumlu biri
            olduğunda burada görünecek.
          </p>
          <Link href="/uyum" className={`${buttonStyles.secondary} mt-6`}>
            Uyum cevaplarımı gözden geçir
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5">
          {candidates.map((candidate) => (
            <article
              key={candidate.user_id}
              className="rounded-[2rem] border border-ink/10 bg-paper p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">
                    {candidate.compatibility_band}
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-ink">
                    {candidate.display_name}, {candidate.age}
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    {candidate.city_name} · {candidate.relationship_goal}
                  </p>
                </div>
                <span className="rounded-full bg-sand px-4 py-2 text-xs font-semibold text-ink-soft">
                  Fotoğraf isteğe bağlı
                </span>
              </div>

              {candidate.shared_points.length > 0 ? (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-ink">Öne çıkan ortak noktalar</h3>
                  <ul className="mt-3 space-y-2">
                    {candidate.shared_points.map((point) => (
                      <li key={point} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                        <span aria-hidden className="text-brass">✦</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <p className="mt-6 border-t border-ink/10 pt-4 text-xs leading-relaxed text-ink-muted">
                Tanışma başvurusu ve kapı soruları Faz 3’te etkinleştirilecek.
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
