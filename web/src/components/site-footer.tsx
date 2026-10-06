import { CompassMark } from "./compass-mark";
import { Container } from "./ui";
import { SITE } from "@/lib/site";

// Hukuki sayfalar avukat incelemesinden sonra eklenecek.
const LEGAL = [
  "KVKK Aydınlatma Metni",
  "Gizlilik Politikası",
  "Ön Kayıt Koşulları",
  "Çerez Politikası",
  "İletişim",
];

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
        </div>
        <ul className="space-y-2.5 text-sm">
          {LEGAL.map((item) => (
            <li key={item} className="text-sand/80">
              {item} <span className="text-xs text-sand/50">(hazırlanıyor)</span>
            </li>
          ))}
        </ul>
      </Container>
      <Container className="mt-12 border-t border-paper/10 pt-6 text-xs text-sand/50">
        © {new Date().getFullYear()} {SITE.name}
      </Container>
    </footer>
  );
}
