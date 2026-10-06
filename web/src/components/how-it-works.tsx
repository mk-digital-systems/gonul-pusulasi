import { Container, SectionHeading } from "./ui";

const STEPS = [
  {
    title: "Kendini ve beklentilerini anlat",
    text: "Kısa uyum soruları, sana dair birkaç cevap ve istersen 10–15 saniyelik bir sesli tanıtım. Fotoğraf yüklemek zorunlu değil.",
  },
  {
    title: "Pusula sana uyanları bulsun",
    text: "Karşılıklı tercihler ve gerçek cevaplar üzerinden daha az ama daha uygun aday önerilir. Her önerinin nedenini görürsün.",
  },
  {
    title: "Ortak noktalardan gerçekten tanış",
    text: "Sohbet bir “Merhaba” ile değil, karşı tarafın sorularına verdiğin cevaplarla başlar. O onaylarsa sohbet başlar.",
  },
];

export function HowItWorks() {
  return (
    <section id="nasil-calisir" className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Nasıl çalışacak?"
          title="Üç adımda, sana uyan insanlara."
        />
        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <span className="font-display text-5xl text-ember/80">{i + 1}</span>
              <h3 className="mt-4 text-xl font-semibold text-ink">{s.title}</h3>
              <p className="mt-3 leading-relaxed text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
