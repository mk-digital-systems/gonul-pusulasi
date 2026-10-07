import type { ReactNode } from "react";
import Link from "next/link";
import { CompassMark } from "./compass-mark";
import { Container, buttonStyles } from "./ui";
import { signOutAction } from "@/app/actions/auth";
import { SITE } from "@/lib/site";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-ink/10 bg-paper">
        <Container className="flex min-h-16 items-center justify-between gap-4 py-3">
          <Link href="/hesabim" className="flex items-center gap-2.5 text-ink">
            <CompassMark className="h-8 w-8" />
            <span className="font-script text-[1.7rem] leading-none">{SITE.name}</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm" aria-label="Hesap menüsü">
            <Link href="/kesfet" className="font-medium text-ink-soft hover:text-ink">
              Keşfet
            </Link>
            <Link href="/uyum" className="font-medium text-ink-soft hover:text-ink">
              İlişki Pusulan
            </Link>
            <Link href="/kapi-sorularim" className="font-medium text-ink-soft hover:text-ink">
              Kapı sorularım
            </Link>
            <Link href="/talepler" className="font-medium text-ink-soft hover:text-ink">
              Başvurular
            </Link>
            <Link href="/profil" className="font-medium text-ink-soft hover:text-ink">
              Profili düzenle
            </Link>
            <form action={signOutAction}>
              <button className={`${buttonStyles.secondary} px-4 py-2`} type="submit">
                Çıkış
              </button>
            </form>
          </nav>
        </Container>
      </header>
      <main className="flex-1 bg-sand/30 py-10 sm:py-14">
        <Container className="max-w-3xl">{children}</Container>
      </main>
    </>
  );
}
