import { Container, SectionHeading } from "./ui";

const FAQ = [
  {
    q: "Gönül Pusulası ne zaman açılacak?",
    a: "Uygulama hazırlık aşamasında. Kesin tarihi henüz açıklamıyoruz; erken erişim listesindekilere ilk biz haber vereceğiz.",
  },
  {
    q: "Hangi şehirlerde açılacak?",
    a: "Henüz karar vermedik ve bunu bilinçli olarak yapıyoruz. Erken erişim taleplerini şehir şehir inceleyip, uygulamayı herkesin yeterince uygun adayla karşılaşabileceği yerlerde açacağız.",
  },
  {
    q: "Kimler katılabilir?",
    a: "30 yaş ve üzeri, ciddi ve uzun vadeli bir ilişki arayan kadın ve erkekler. Üst yaş sınırı yoktur. Gönül Pusulası kadın ve erkek üyeleri birbiriyle tanıştırır.",
  },
  {
    q: "Neden aynı anda en fazla 3 kişiyle konuşabiliyorum?",
    a: "Çünkü onlarca kişiyle yüzeysel konuşmak yerine birkaç kişiye gerçekten zaman ayırmanın daha anlamlı tanışmalar getirdiğine inanıyoruz. Bu sınır hiçbir ücretli paketle değişmez.",
  },
  {
    q: "4 gün dolunca ne oluyor?",
    a: "Tanışmaya devam etmeye karar vermediyseniz görüşme kapanır. Bu bir ret değildir; ileride yeniden karşılaşmanız mümkündür.",
  },
  {
    q: "“Tanışmayı Başlat” ne demek?",
    a: "Bir kişiyle daha ciddi tanışmak istediğinde ona teklif edersin. O da kabul ederse ikiniz için yeni aday aramaya ara verilir ve diğer görüşmeler nazikçe kapanır. Tanışmayı istediğin an sona erdirebilirsin.",
  },
  {
    q: "Tanışma sürecinde olduğum başkalarına görünür mü?",
    a: "Hayır. Tanışma sürecinde olduğun ve kiminle tanıştığın kimseye açıklanmaz. O an açık görüşmen olan kişiler yalnızca “Görüşme sona erdi” bildirimi alır; sebebi gösterilmez.",
  },
  {
    q: "Fotoğraf yüklemek zorunlu mu?",
    a: "Hayır. Fotoğraf ve sesli tanıtım isteğe bağlıdır. Her hesap telefon numarasıyla doğrulanır; yanlış bilgi verenlerin üyeliği kalıcı olarak kapatılır.",
  },
  {
    q: "Uyum nasıl hesaplanıyor?",
    a: "Uyum soruları üzerinden; senin cevapların, karşı tarafta kabul ettiğin cevaplar ve her konunun senin için ne kadar önemli olduğu karşılıklı olarak değerlendirilir. Sonuç “Çok Güçlü”, “Güçlü” veya “İyi Uyum” gibi bantlarla ve gerekçeleriyle gösterilir. Uydurma yüzdeler kullanmıyoruz.",
  },
  {
    q: "Eski eşim, iş arkadaşım ya da bir tanıdığım beni görebilir mi?",
    a: "Uygulamada görünürlüğünü kontrol edebileceğin ve belirlediğin kişilerden gizlenebileceğin seçenekler olacak. Kesin konumun hiçbir zaman gösterilmeyecek.",
  },
  {
    q: "Ücretli mi olacak?",
    a: "Hesap oluşturmak, profilleri ve uyum önerilerini görmek ücretsiz olacak. Mesajlaşma ve tanışma Premium üyelikle mümkün olacak. Güvenlik ve gizlilik özellikleri herkes için her zaman ücretsiz. Fiyatları açılıştan önce açıkça paylaşacağız.",
  },
  {
    q: "Ön kayıtta neden bu bilgileri istiyorsunuz?",
    a: "Doğum yılı, cinsiyet, şehir ve ilişki amacı; nerede ve kimler için açılmamız gerektiğini anlamamızı sağlar. E-posta yalnızca kaydını doğrulamak ve açılışta haber vermek içindir. TC kimlik numarası, soyad veya adres istemiyoruz.",
  },
  {
    q: "Sahte profillerle nasıl mücadele edeceksiniz?",
    a: "Telefon doğrulaması, şüpheli mesajlara karşı uyarılar, şikâyet ve engelleme ile insan moderasyonu. Yanlış bilgi verdiği anlaşılan üyenin üyeliği kalıcı olarak kapatılır. Gönül Pusulası hiçbir zaman kendisi sahte veya bot profil oluşturmaz.",
  },
];

export function Faq() {
  return (
    <section id="sss" className="py-20 sm:py-28">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeading eyebrow="SSS" title="Sık sorulan sorular" />
        <div className="divide-y divide-ink/10 border-y border-ink/10">
          {FAQ.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer items-start justify-between gap-6 text-left text-base font-semibold text-ink">
                {item.q}
                <span
                  aria-hidden
                  className="mt-0.5 text-xl leading-none text-ember transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 pr-8 leading-relaxed text-ink-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
