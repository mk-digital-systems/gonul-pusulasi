import type { ReactNode } from "react";
import Link from "next/link";
import { CompassMark } from "./compass-mark";
import { Container } from "./ui";
import { SITE } from "@/lib/site";

// Doğrulama ve kayıt yönetimi gibi tek amaçlı sayfaların çerçevesi.
export function SimplePage({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-ink/10 bg-paper">
        <Container className="flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2.5 text-ink">
            <CompassMark className="h-8 w-8" />
            <span className="font-script text-[1.7rem] leading-none whitespace-nowrap">{SITE.name}</span>
          </Link>
        </Container>
      </header>
      <main className="flex-1 bg-sand/60 py-16 sm:py-24">
        <Container className="max-w-xl">
          <div className="rounded-[2rem] border border-ink/10 bg-paper p-6 text-center sm:p-10">
            {children}
          </div>
        </Container>
      </main>
    </>
  );
}
