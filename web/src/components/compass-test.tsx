"use client";

import { useState } from "react";
import { CompassMark } from "./compass-mark";
import { Container, Eyebrow, buttonStyles } from "./ui";
import {
  QUESTIONS,
  RESULTS,
  scoreAnswers,
  type Direction,
} from "@/lib/compass-test";
import { SITE } from "@/lib/site";

// Seçenekleri soru sırasına göre kaydırır; "hep ilk şık" etkisini önler.
function rotated<T>(items: T[], by: number): T[] {
  const n = by % items.length;
  return [...items.slice(n), ...items.slice(0, n)];
}

type Stage = "intro" | "questions" | "result";

export function CompassTest() {
  const [stage, setStage] = useState<Stage>("intro");
  const [answers, setAnswers] = useState<Direction[]>([]);
  const [shareNote, setShareNote] = useState("");

  const index = answers.length;
  const total = QUESTIONS.length;

  function choose(direction: Direction) {
    const next = [...answers, direction];
    setAnswers(next);
    if (next.length === total) setStage("result");
  }

  function restart() {
    setAnswers([]);
    setShareNote("");
    setStage("questions");
  }

  async function share(title: string) {
    const text = `İlişki pusulam: ${title}. Seninki ne? ${SITE.domain}`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareNote("Metin panoya kopyalandı.");
    } catch {
      // Kullanıcı paylaşımı iptal etti
    }
  }

  return (
    <section id="iliski-pusulan" className="py-20 sm:py-28">
      <Container>
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-ink/10 bg-white p-6 shadow-[0_24px_60px_-34px_rgba(30,38,56,0.35)] sm:p-10">
          <div aria-live="polite">
            {stage === "intro" && (
              <div className="text-center">
                <CompassMark className="mx-auto h-16 w-16 text-ink" angle={-20} />
                <div className="mt-6">
                  <Eyebrow>Mini test</Eyebrow>
                </div>
                <h2 className="mt-3 font-display text-3xl font-medium text-ink sm:text-4xl">
                  İlişki Pusulan hangi yönü gösteriyor?
                </h2>
                <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ink-soft">
                  {total} kısa soruda, bir ilişkide en çok neye yöneldiğini keşfet. Yaklaşık iki dakika sürer.
                </p>
                <button type="button" onClick={restart} className={`${buttonStyles.primary} mt-8`}>
                  Teste Başla
                </button>
                <p className="mx-auto mt-6 max-w-md text-xs leading-relaxed text-ink-muted">
                  Bilimsel bir psikolojik değerlendirme değildir; kendini düşünmen için hazırlandı.
                  Cevapların ve sonucun hiçbir yere kaydedilmez.
                </p>
              </div>
            )}

            {stage === "questions" && index < total && (
              <div>
                <div className="flex items-center justify-between text-sm text-ink-muted">
                  <span>
                    Soru {index + 1} / {total}
                  </span>
                  {index > 0 ? (
                    <button
                      type="button"
                      onClick={() => setAnswers(answers.slice(0, -1))}
                      className="font-medium text-ink-soft underline-offset-4 hover:underline"
                    >
                      Geri
                    </button>
                  ) : null}
                </div>
                <div
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-sand"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={index}
                  aria-label="Test ilerlemesi"
                >
                  <div
                    className="h-full rounded-full bg-ember transition-all duration-300"
                    style={{ width: `${(index / total) * 100}%` }}
                  />
                </div>
                <h3 className="mt-8 font-display text-2xl leading-snug text-ink sm:text-3xl">
                  {QUESTIONS[index].text}
                </h3>
                <ul className="mt-7 grid gap-3">
                  {rotated(QUESTIONS[index].options, index).map((o) => (
                    <li key={o.text}>
                      <button
                        type="button"
                        onClick={() => choose(o.direction)}
                        className="w-full rounded-2xl border border-ink/15 px-5 py-4 text-left text-base leading-snug text-ink transition-colors hover:border-ember hover:bg-ember-soft/40"
                      >
                        {o.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {stage === "result" &&
              (() => {
                const { primary, secondary } = scoreAnswers(answers);
                const r = RESULTS[primary];
                return (
                  <div>
                    <div className="text-center">
                      <CompassMark className="mx-auto h-20 w-20 text-ink" angle={r.angle} />
                      <div className="mt-6">
                        <Eyebrow>Senin pusulan</Eyebrow>
                      </div>
                      <h3 className="mt-3 font-display text-4xl font-medium text-ink">{r.title}</h3>
                      <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">
                        {r.summary}
                      </p>
                    </div>
                    <dl className="mt-9 grid gap-4 sm:grid-cols-3">
                      {[
                        ["Güçlü yanın", r.strengths],
                        ["Dikkat etmen gereken", r.watchOut],
                        ["Sana iyi gelebilecek kişi", r.goodMatch],
                      ].map(([label, text]) => (
                        <div key={label} className="rounded-2xl bg-sand/70 p-5">
                          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ember">
                            {label}
                          </dt>
                          <dd className="mt-2 text-sm leading-relaxed text-ink">{text}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-6 text-center text-sm text-ink-muted">
                      Yan yönün: <span className="font-semibold text-ink">{RESULTS[secondary].title}</span>
                    </p>
                    <div className="mt-9 rounded-2xl border border-ember/30 bg-ember-soft/40 p-6 text-center">
                      <p className="font-display text-xl text-ink">
                        Gönül Pusulası’nda uyum, iki tarafın gerçek cevaplarıyla çok daha ayrıntılı
                        hesaplanacak.
                      </p>
                      <a href="#nasil-calisir" className={`${buttonStyles.primary} mt-5`}>
                        Nasıl çalışacağını gör
                      </a>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
                      <button
                        type="button"
                        onClick={() => share(r.title)}
                        className="font-medium text-ink-soft underline-offset-4 hover:underline"
                      >
                        Sonucu paylaş
                      </button>
                      <button
                        type="button"
                        onClick={restart}
                        className="font-medium text-ink-soft underline-offset-4 hover:underline"
                      >
                        Testi yeniden çöz
                      </button>
                    </div>
                    {shareNote ? (
                      <p className="mt-3 text-center text-xs text-moss">{shareNote}</p>
                    ) : null}
                    <p className="mx-auto mt-8 max-w-md text-center text-xs leading-relaxed text-ink-muted">
                      Bilimsel bir psikolojik değerlendirme değildir. Sonucun hiçbir yere kaydedilmez.
                    </p>
                  </div>
                );
              })()}
          </div>
        </div>
      </Container>
    </section>
  );
}
