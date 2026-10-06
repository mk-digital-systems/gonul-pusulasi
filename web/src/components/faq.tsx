import type { ReactNode } from "react";
import Link from "next/link";
import { Container, SectionHeading } from "./ui";

const link = "font-medium text-ember underline underline-offset-2";

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: "Gönül Pusulası ne zaman açılacak?",
    a: "Uygulama hazırlık aşamasında. Kesin tarihi henüz açıklamıyoruz; üyelik açıldığında duyurusunu bu sitede yapacağız.",
  },
  {
    q: "Neden bekleme listesi veya ön kayıt yok?",
    a: "Uygulama açılmadan senden kişisel bilgi toplamak istemiyoruz. Üyelik açıldığında bekleme listesine gerek kalmadan doğrudan katılabileceksin.",
  },
  {
    q: "Hangi şehirlerde açılacak?",
    a: "Açılış şehirlerini henüz açıklamadık. Uygulamayı, herkesin yeterince uygun adayla karşılaşabileceği yerlerde açmayı hedefliyoruz; duyuruyu bu sitede yapacağız.",
  },
  {
    q: "Kimler katılabilecek?",
    a: "30 yaş ve üzeri, ciddi ve uzun vadeli bir ilişki arayan kadın ve erkekler. Üst yaş sınırı yoktur. Gönül Pusulası kadın ve erkek üyeleri birbiriyle tanıştırır.",
  },
  {
    q: "Neden aynı anda en fazla 3 kişiyle konuşabileceğim?",
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
    a: "Hayır. Fotoğraf ve sesli tanıtım isteğe bağlı olacak. Her hesap telefon numarasıyla doğrulanacak; yanlış bilgi verenlerin üyeliği kalıcı olarak kapatılacak.",
  },
  {
    q: "Uyum nasıl hesaplanıyor?",
    a: "Uyum soruları üzerinden; senin cevapların, karşı tarafta kabul ettiğin cevaplar ve her konunun senin için ne kadar önemli olduğu karşılıklı olarak değerlendirilir. Sonuç “Çok Güçlü”, “Güçlü” veya “İyi Uyum” gibi bantlarla ve gerekçeleriyle gösterilir. Uydurma yüzdeler kullanmıyoruz.",
  },
  {
    q: "Uyum sonucu bir ilişki garantisi mi?",
    a: "Hayır. Uyum bantları, iki kişinin verdiği cevapların karşılaştırılmasıdır; ilişki veya evlilik garantisi vermez. Gönül Pusulası psikolojik değerlendirme veya profesyonel ilişki danışmanlığı hizmeti değildir.",
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
    q: "Sahte profillerle nasıl mücadele edeceksiniz?",
    a: (
      <>
        Telefon doğrulaması, şüpheli mesajlara karşı uyarılar, şikâyet ve engelleme ile insan
        moderasyonu. Bu önlemler riski azaltır ama sıfırlamaz; bu yüzden{" "}
        <Link href="/guvenli-tanisma" className={link}>
          Güvenli Tanışma
        </Link>{" "}
        önerilerini okumanı isteriz. Gönül Pusulası hiçbir zaman kendisi sahte veya bot profil
        oluşturmaz.
      </>
    ),
  },
  {
    q: "Bu site kişisel verilerimi topluyor mu?",
    a: (
      <>
        Bu sitede kayıt formu, çerez, reklam takibi veya ziyaretçi analitiği yok. Siteyi sunan
        altyapı, sitenin çalışması ve güvenliği için IP adresi gibi teknik bağlantı bilgilerini
        işler. Ayrıntılar{" "}
        <Link href="/kvkk-aydinlatma-metni" className={link}>
          KVKK Aydınlatma Metni
        </Link>{" "}
        ve{" "}
        <Link href="/gizlilik-politikasi" className={link}>
          Gizlilik Politikası
        </Link>
        ’nda.
      </>
    ),
  },
  {
    q: "İlişki Pusulan sonuçlarım kaydediliyor mu?",
    a: "Hayır. Test tamamen tarayıcında çalışır; cevapların ve sonucun bize gönderilmez ve hiçbir yerde saklanmaz.",
  },
  {
    q: "Gönül Pusulası adına mesaj alırsam ne yapmalıyım?",
    a: (
      <>
        Şu anda üye kabul etmiyor, ödeme almıyor ve kişisel bilgi istemiyoruz. Adımıza böyle bir
        talep alırsan yanıt verme ve{" "}
        <Link href="/iletisim" className={link}>
          bize bildir
        </Link>
        . Resmi adreslerimiz gonulpusulasi.tr ve gonulpusulasi.com.tr’dir.
      </>
    ),
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
