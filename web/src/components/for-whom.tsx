import { Container, SectionHeading } from "./ui";

const PEOPLE = [
  "Hiç evlenmemiş ama artık doğru kişiyi arayanlar",
  "Boşanmış ve yeniden başlamaya hazır olanlar",
  "Çocuk sahibi olup hayatına uyum sağlayacak birini arayanlar",
  "Eşini kaybetmiş, yeniden paylaşmaya hazır olanlar",
  "Yüzeysel tanışmalardan yorulanlar",
  "Evlilik düşüncesine açık olanlar",
];

export function ForWhom() {
  return (
    <section id="kimler-icin" className="border-y border-ink/10 bg-sand/60 py-20 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Kimler için?"
          title="Ciddi ve uzun vadeli bir ilişki arayan yetişkinler için."
          intro="Gönül Pusulası, 30 yaş ve üzeri kadın ve erkekler için tasarlanıyor. Üst yaş sınırı yok. Yeniden başlamanın bir yaşı yoktur."
        />
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PEOPLE.map((p) => (
            <li
              key={p}
              className="rounded-2xl border border-ink/10 bg-paper px-5 py-5 text-base leading-snug text-ink"
            >
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-ink-muted">
          Gönül Pusulası kadın ve erkek üyeleri birbiriyle tanıştırır.
        </p>
      </Container>
    </section>
  );
}
