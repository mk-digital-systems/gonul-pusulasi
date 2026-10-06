import Link from "next/link";
import { CompassMark } from "./compass-mark";
import { Container, buttonStyles } from "./ui";

// Bağlantılar "/#..." biçiminde: hukuki sayfalardan da ana sayfadaki bölümlere gider.
const NAV = [
  { href: "/#nasil-calisir", label: "Nasıl Çalışır" },
  { href: "/#tanisma-kulturu", label: "Tanışma Kültürü" },
  { href: "/#guvenlik", label: "Güvenlik" },
  { href: "/#iliski-pusulan", label: "İlişki Pusulan" },
  { href: "/#sss", label: "SSS" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-ink">
          <CompassMark className="h-8 w-8" />
          <span className="font-script text-[1.7rem] leading-none whitespace-nowrap">Gönül Pusulası</span>
        </Link>
        <nav aria-label="Ana menü" className="hidden lg:block">
          <ul className="flex items-center gap-7 text-sm font-medium text-ink-soft">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-ink">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/giris"
            className={`${buttonStyles.secondary} hidden whitespace-nowrap px-4 py-2.5 sm:inline-flex`}
          >
            Giriş yap
          </Link>
          <Link
            href="/kayit"
            className={`${buttonStyles.primary} whitespace-nowrap px-4 py-2.5 sm:px-5`}
          >
            Hesap oluştur
          </Link>
        </div>
      </Container>
    </header>
  );
}
