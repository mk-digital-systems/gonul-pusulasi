import Link from "next/link";
import { CheckIcon, Container, SectionHeading, buttonStyles } from "./ui";

const POINTS = [
  "Bekleme listesi veya ön kayıt yok; üyelik açıldığında doğrudan katılabileceksin.",
  "Uygulama açılmadan senden ad, e-posta veya telefon gibi hiçbir bilgi istemiyoruz.",
  "Bu sitede çerez, reklam takibi veya ziyaretçi analitiği yok.",
];

export function LaunchInfo() {
  return (
    <section id="acilis" className="border-t border-ink/10 bg-sand/60 py-20 sm:py-28">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <SectionHeading
            eyebrow="Açılış"
            title="Gönül Pusulası hazırlanıyor."
            intro="Üyelik açıldığında Gönül Pusulası’na bu siteden ve mobil uygulamadan katılabileceksin. Açılış duyurusunu burada yapacağız."
          />
          <div className="rounded-[2rem] border border-ink/10 bg-paper p-6 sm:p-9">
            <ul className="space-y-4">
              {POINTS.map((p) => (
                <li key={p} className="flex gap-3 leading-snug text-ink-soft">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-moss" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm leading-relaxed text-ink-muted">
              Açılışa hazırlanırken tanışma kurallarımızı ve güvenlik önerilerimizi okuyabilirsin.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link href="/topluluk-kurallari" className={buttonStyles.primary}>
                Topluluk Kuralları
              </Link>
              <Link href="/guvenli-tanisma" className={buttonStyles.secondary}>
                Güvenli Tanışma Rehberi
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
