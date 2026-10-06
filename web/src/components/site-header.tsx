import { CompassMark } from "./compass-mark";
import { Container, buttonStyles } from "./ui";
import { PREVIEW_MODE } from "@/lib/site";

const NAV = [
  { href: "#nasil-calisir", label: "Nasıl Çalışır" },
  { href: "#tanisma-kulturu", label: "Tanışma Kültürü" },
  { href: "#guvenlik", label: "Güvenlik" },
  { href: "#iliski-pusulan", label: "İlişki Pusulan" },
  { href: "#sss", label: "SSS" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur">
      {PREVIEW_MODE ? (
        <div className="bg-ink px-4 py-1.5 text-center text-xs text-sand">
          Önizleme sürümü: form verileri hiçbir yere gönderilmez ve kaydedilmez.
        </div>
      ) : null}
      <Container className="flex h-16 items-center justify-between gap-4">
        <a href="#top" className="flex shrink-0 items-center gap-2.5 text-ink">
          <CompassMark className="h-8 w-8" />
          <span className="font-script text-[1.7rem] leading-none whitespace-nowrap">Gönül Pusulası</span>
        </a>
        <nav aria-label="Ana menü" className="hidden lg:block">
          <ul className="flex items-center gap-7 text-sm font-medium text-ink-soft">
            {NAV.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="transition-colors hover:text-ink">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a href="#erken-erisim" className={`${buttonStyles.primary} whitespace-nowrap px-4 py-2.5 sm:px-5`}>
          <span className="sm:hidden">Katıl</span>
          <span className="hidden sm:inline">Erken Erişime Katıl</span>
        </a>
      </Container>
    </header>
  );
}
