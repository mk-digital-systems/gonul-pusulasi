import Link from "next/link";
import { CompassMark } from "./compass-mark";
import { Container } from "./ui";
import { LEGAL_PAGES, ORG, SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-night py-14 text-sand">
      <Container className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5 text-paper">
            <CompassMark className="h-8 w-8" />
            <span className="font-script text-3xl leading-none">{SITE.name}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-sand/80">{SITE.slogan}</p>
          <p className="mt-6 text-sm leading-relaxed text-sand/80">
            {ORG.brand}
            <br />
            {ORG.location}
          </p>
        </div>
        <nav aria-label="Hukuki bilgiler">
          <ul className="space-y-2.5 text-sm">
            {LEGAL_PAGES.map((page) => (
              <li key={page.href}>
                <Link href={page.href} className="text-sand/80 transition-colors hover:text-paper">
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <Container className="mt-12 border-t border-paper/10 pt-6 text-xs text-sand/50">
        © {new Date().getFullYear()} {SITE.name} · {ORG.brand}
      </Container>
    </footer>
  );
}
