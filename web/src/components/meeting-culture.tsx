import { Container, SectionHeading } from "./ui";

const RULES = [
  {
    figure: "3",
    title: "Aynı anda en fazla 3 kişi",
    text: "Kimse uzun bir listedeki isimlerden biri olmaz. Her sohbete gerçekten zaman ayrılır.",
  },
  {
    figure: "4",
    unit: "gün",
    title: "Tanımak için 4 gün",
    text: "Sohbet başladığında 4 günün var. Bu sürede devam etmek istersen “Tanışmayı Başlat” teklif edersin.",
  },
  {
    figure: "1",
    title: "Tanışırken tek kişi",
    text: "İkiniz de “Tanışmayı Başlat” dediğinizde yeni aday aramaya ara verilir. Diğer görüşmeler nazikçe kapanır.",
  },
  {
    figure: "24",
    unit: "saat",
    title: "Yeni tanışmadan önce bir nefes",
    text: "Bir tanışma sona erdiğinde, yeni bir tanışma başlatmadan önce 24 saat beklenir.",
  },
];

export function MeetingCulture() {
  return (
    <section id="tanisma-kulturu" className="bg-night py-20 text-paper sm:py-28">
      <Container>
        <SectionHeading
          tone="light"
          eyebrow="Tanışma kültürü"
          title="Tanışmanın da bir kültürü var."
          intro="Aynı anda onlarca kişiyle yüzeysel konuşmalar yerine, bir kişiye gerçekten zaman ayırmanı sağlayan sade kurallar."
        />
        <ul className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-paper/10 sm:grid-cols-2 lg:grid-cols-4">
          {RULES.map((r) => (
            <li key={r.title} className="bg-night p-7">
              <p className="font-display text-5xl text-ember-soft">
                {r.figure}
                {r.unit ? <span className="ml-1 text-2xl text-sand-deep">{r.unit}</span> : null}
              </p>
              <h3 className="mt-5 text-lg font-semibold text-paper">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-sand/80">{r.text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-base text-sand">
          <span className="font-semibold text-paper">Bu kurallar satılık değil.</span> Hiçbir ücretli
          paket aynı anda daha fazla kişiyle konuşmanı, süreleri uzatmanı ya da beklemeyi atlamanı sağlamaz.
        </p>
        <div className="mt-8 rounded-2xl border border-paper/15 p-6 sm:flex sm:items-start sm:gap-6">
          <p className="shrink-0 font-display text-xl text-paper">Nazikçe Vedalaş</p>
          <p className="mt-2 text-sm leading-relaxed text-sand/80 sm:mt-1">
            Devam etmek istemediğinde sessizce kaybolmak zorunda değilsin. Saygılı, hazır bir cümleyle
            görüşmeyi kapatabilirsin: “Tanıştığımıza memnun oldum fakat aradığım uyumu hissedemedim.
            Umarım aradığın kişiyi bulursun.”
          </p>
        </div>
      </Container>
    </section>
  );
}
