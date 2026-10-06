import { CompatibilityCard } from "./compatibility-card";
import { Container, SectionHeading } from "./ui";

const ITEMS = [
  {
    title: "Sonsuz kaydırma yok",
    text: "Kotayı doldurmak için aday göstermeyiz. Sana uygun kimse yoksa bunu dürüstçe söyleriz.",
  },
  {
    title: "Açıklanabilir uyum",
    text: "“%94 ruh eşisiniz” gibi uydurma sayılar yok. Uyumun nedenini, ortak ve farklı noktalarınızla birlikte görürsün.",
  },
  {
    title: "Karşılıklı tercihler",
    text: "Sadece senin tercihlerine değil, onunkilere de bakılır. Birbirine uygun olan iki kişi öne çıkar.",
  },
  {
    title: "Sorularla başlayan sohbet",
    text: "Herkes, kendisine yazmak isteyenlerin cevaplaması gereken soruları seçer. İlk mesaj “Slm” değil, gerçek bir cevaptır.",
  },
  {
    title: "Gerçek bir ses",
    text: "Kısa bir sesli tanıtımla, bir fotoğrafın anlatamadığını anlatabilirsin. İsteğe bağlıdır.",
  },
  {
    title: "Başarı, uygulamadan ayrılmak",
    text: "Amacımız seni uygulamada tutmak değil. Doğru kişiyi bulup ayrılman, bizim için en büyük başarı.",
  },
];

export function WhyDifferent() {
  return (
    <section id="neden-farkli" className="py-20 sm:py-28">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
          <SectionHeading
            eyebrow="Neden farklı?"
            title="Daha çok eşleşme değil, daha doğru tanışma."
            intro="Her önerinin yanında, neden önerildiğini görürsün: ortak beklentileriniz ve farklı düşündüğünüz konular birlikte."
          />
          <div className="flex justify-center lg:justify-end">
            <CompatibilityCard />
          </div>
        </div>
        <ul className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <li key={item.title} className="border-t border-ink/15 pt-6">
              <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{item.text}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
