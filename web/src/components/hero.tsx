import Image from "next/image";
import Link from "next/link";
import { Container, Eyebrow, buttonStyles } from "./ui";
import brandVisual from "../../public/brand/gonul-pusulasi-gorsel.jpg";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(60%_60%_at_80%_20%,var(--color-ember-soft),transparent_70%)]"
      />
      <Container className="relative grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:py-24">
        <div>
          <Eyebrow>30 yaş ve üzeri · Ciddi ilişki</Eyebrow>
          <h1 className="mt-5 font-display text-4xl leading-[1.08] font-medium text-ink sm:text-5xl lg:text-6xl">
            Birini değil, <span className="text-ember italic">sana uyan</span> birini bul.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Gönül Pusulası; sonsuz kaydırma yerine, beklentileri ve değerleri sana gerçekten uyan
            insanlarla tanışman için hazırlanıyor. Daha az aday, daha anlamlı tanışmalar.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/kayit" className={buttonStyles.primary}>
              Ücretsiz hesap oluştur
            </Link>
            <Link href="/giris" className={buttonStyles.secondary}>
              Giriş yap
            </Link>
          </div>
          <p className="mt-5 text-sm text-ink-muted">
            Önce kendini daha yakından tanımak istersen{" "}
            <a href="#iliski-pusulan" className="font-medium text-ember underline underline-offset-4">
              mini İlişki Pusulan testini çözebilirsin.
            </a>
          </p>
        </div>
        <div className="overflow-hidden rounded-[2rem] shadow-[0_30px_80px_-40px_rgba(138,61,69,0.6)]">
          <Image
            src={brandVisual}
            alt="Gönül Pusulası: altın bir pusulanın önünde birbirine uzanan iki el"
            priority
            placeholder="blur"
            sizes="(min-width: 1024px) 560px, 100vw"
            className="h-auto w-full"
          />
        </div>
      </Container>
    </section>
  );
}
