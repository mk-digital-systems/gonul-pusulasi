import { CheckIcon, Container, SectionHeading } from "./ui";

const SAFETY = [
  "Telefon numarası doğrulaması",
  "Bizim ürettiğimiz sahte veya bot profil yoktur. Bu bir taahhüttür.",
  "Para, IBAN veya yatırım isteyen mesajlara karşı uyarılar",
  "Tek dokunuşla şikâyet ve engelleme, insan moderasyonu",
  "Yanlış bilgi verenlerin üyeliği kalıcı olarak kapatılır",
];

const PRIVACY = [
  "Kesin konumun asla gösterilmez, yalnızca şehrin görünür",
  "Biriyle tanışma sürecinde olduğun kimseye açıklanmaz",
  "Görmesini istemediğin kişilerden gizlenebilme",
  "Kilit ekranında ayrıntı göstermeyen gizli bildirimler",
];

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-ink/10 bg-paper p-7 sm:p-8">
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <ul className="mt-6 space-y-4">
        {items.map((item) => (
          <li key={item} className="flex gap-3 leading-snug text-ink-soft">
            <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-moss" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SafetyPrivacy() {
  return (
    <section id="guvenlik" className="border-y border-ink/10 bg-sand/60 py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Güvenlik ve gizlilik"
          title="Ek bir özellik değil, temelin kendisi."
          intro="Uygulama açıldığında seni bunlar bekliyor olacak. Güvenlik ve gizlilik hiçbir zaman ücretli olmayacak."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <List title="Güvenlik" items={SAFETY} />
          <List title="Gizlilik" items={PRIVACY} />
        </div>
      </Container>
    </section>
  );
}
