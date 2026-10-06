import type { ReactNode } from "react";
import Link from "next/link";
import { CompassMark } from "./compass-mark";
import { SITE } from "@/lib/site";

export function AuthShell({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-sand/60 px-4 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-ink/10 bg-paper p-6 shadow-[0_24px_70px_-38px_rgba(42,32,39,0.5)] sm:p-9">
        <Link href="/" className="flex items-center gap-2.5 text-ink">
          <CompassMark className="h-9 w-9" />
          <span className="font-script text-3xl leading-none">{SITE.name}</span>
        </Link>
        <h1 className="mt-8 font-display text-3xl text-ink">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{intro}</p>
        <div className="mt-7">{children}</div>
      </div>
    </main>
  );
}
