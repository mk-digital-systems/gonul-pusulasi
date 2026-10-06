import type { ReactNode } from "react";
import Link from "next/link";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { Container, Eyebrow } from "./ui";
import { LEGAL_PAGES, LEGAL_UPDATED } from "@/lib/site";

export type LegalSection = { id: string; title: string; content: ReactNode };

// Hukuki ve bilgilendirme sayfalarının ortak düzeni: başlık, içindekiler,
// numaralı bölümler ve diğer sayfalara geçiş.
export function LegalPage({
  eyebrow = "Hukuki bilgiler",
  title,
  intro,
  path,
  sections,
}: {
  eyebrow?: string;
  title: string;
  intro: ReactNode;
  path: string;
  sections: LegalSection[];
}) {
  const related = LEGAL_PAGES.filter((p) => p.href !== path);
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-ink/10 bg-sand/60 py-14 sm:py-20">
          <Container className="max-w-3xl">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="mt-3 font-display text-3xl leading-tight font-medium text-ink sm:text-5xl">
              {title}
            </h1>
            <div className="mt-5 text-base leading-relaxed text-ink-soft sm:text-lg">{intro}</div>
            <p className="mt-6 text-sm text-ink-muted">Son güncelleme: {LEGAL_UPDATED}</p>
          </Container>
        </section>

        <Container className="max-w-3xl py-12 sm:py-16">
          <nav aria-label="İçindekiler" className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
            <p className="text-sm font-semibold text-ink">İçindekiler</p>
            <ol className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-ink-soft underline-offset-4 hover:text-ember hover:underline">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="legal-prose mt-12 space-y-12">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="font-display text-2xl text-ink">
                  {i + 1}. {s.title}
                </h2>
                <div className="mt-4 space-y-4 leading-relaxed text-ink-soft">{s.content}</div>
              </section>
            ))}
          </div>

          <nav aria-label="Diğer sayfalar" className="mt-16 border-t border-ink/10 pt-8">
            <p className="text-sm font-semibold text-ink">Diğer sayfalar</p>
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {related.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className="text-ember underline-offset-4 hover:underline">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
