import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { ORG, SITE } from "@/lib/site";

const PATH = "/kullanim-kosullari";

export const metadata: Metadata = {
  alternates: { canonical: PATH },
  title: `Kullanım Koşulları | ${SITE.name}`,
  description: "Gönül Pusulası internet sitesinin kullanım koşulları.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Kullanım Koşulları"
      path={PATH}
      intro={
        <p>
          Bu koşullar, {SITE.domain} internet sitesinin (“Site”) kullanımına ilişkindir. Siteyi
          kullanarak bu koşulları okuduğunu kabul edersin.
        </p>
      }
      sections={[
        {
          id: "taraflar",
          title: "Site ve işletici",
          content: (
            <p>
              Site, {ORG.brand} markası altında işletilir ({ORG.location}). İçerik sağlayıcıya
              ilişkin bilgiler <Link href="/iletisim">İletişim</Link> sayfasında yer alır. Bu metinde
              “biz” ifadesi Gönül Pusulası’nı ve {ORG.brand}’i ifade eder.
            </p>
          ),
        },
        {
          id: "hizmetin-durumu",
          title: "Sitenin amacı ve hizmetin durumu",
          content: (
            <>
              <p>
                Site, hazırlık aşamasındaki Gönül Pusulası tanışma hizmetini tanıtmak amacıyla
                yayımlanır. Şu anda Site üzerinden <strong>üyelik, kayıt, ön talep, mesajlaşma veya
                ücretli hizmet sunulmamaktadır</strong>.
              </p>
              <p>
                Sitede anlatılan özellikler, hizmetin planlanan işleyişini tanıtır. Açılış tarihi,
                açılış şehirleri ve özelliklerin ayrıntıları değişebilir; Site’deki tanıtım bir
                açılış veya özellik taahhüdü değildir.
              </p>
            </>
          ),
        },
        {
          id: "uyelik-kurallari",
          title: "Üyelik açıldığında geçerli olacak temel kurallar",
          content: (
            <>
              <p>
                Gönül Pusulası üyeliği açıldığında aşağıdaki temel kurallar uygulanacaktır. Üyelik,
                ücretli hizmetler, iptal ve iade koşulları; üyelik açılmadan önce ayrı bir
                sözleşmeyle ve satın alma ekranında açıkça sunulacaktır.
              </p>
              <ul>
                <li>
                  Hizmet yalnızca <strong>30 yaş ve üzeri</strong> kişiler içindir; üst yaş sınırı
                  yoktur. 30 yaşını doldurmamış kişiler üye olamaz.
                </li>
                <li>Hizmet, ciddi ve uzun vadeli ilişki arayan kadın ve erkekleri tanıştırır.</li>
                <li>Bir üye aynı anda en fazla 3 kişiyle ön tanışma yürütebilir.</li>
                <li>Ön tanışma süresi 96 saattir (4 gün).</li>
                <li>
                  Aktif tanışma iki tarafın karşılıklı onayıyla başlar; başladığında diğer
                  görüşmeler kapanır ve tanışma sürerken yeni adaylarla görüşme açılamaz.
                </li>
                <li>Her iki taraf da aktif tanışmayı istediği an tek taraflı sonlandırabilir.</li>
                <li>
                  Normal sonlandırmanın ardından yeni bir tanışma başlatmadan önce 24 saatlik bekleme
                  süresi uygulanabilir; engelleme, şikâyet ve güvenlik durumları bu süreden istisna
                  tutulabilir.
                </li>
                <li>
                  Hiçbir ücretli paket bu kuralları değiştirmez; güvenlik ve gizlilik özellikleri
                  ücretli değildir.
                </li>
                <li>
                  Kayıt sırasında doğru bilgi vermek zorunludur. Yanlış bilgi verdiği tespit edilen
                  kişinin üyeliği askıya alınır ve kalıcı olarak kapatılabilir.
                </li>
              </ul>
              <p>
                Üyelikte uyulması gereken davranış kuralları{" "}
                <Link href="/topluluk-kurallari">Topluluk Kuralları</Link>’nda yer alır.
              </p>
            </>
          ),
        },
        {
          id: "iliski-pusulan",
          title: "İlişki Pusulan testi",
          content: (
            <p>
              Sitedeki “İlişki Pusulan” testi, ilişkide neye önem verdiğini düşünmene yardımcı olmak
              için hazırlanmış eğlenceli bir öz farkındalık aracıdır. Bilimsel bir psikolojik
              değerlendirme, teşhis veya profesyonel ilişki danışmanlığı değildir. Test tarayıcında
              çalışır; cevapların ve sonucun bize gönderilmez.
            </p>
          ),
        },
        {
          id: "uyum-garanti-degil",
          title: "Uyum ilişki garantisi değildir",
          content: (
            <p>
              Gönül Pusulası’nın uyum bantları, kişilerin kendi verdikleri cevapların karşılaştırılmasına
              dayanır. Bir uyum sonucu; ilişki, evlilik veya karşı tarafın davranışı hakkında garanti
              vermez. Gönül Pusulası psikolojik değerlendirme veya profesyonel danışmanlık hizmeti
              sunmaz.
            </p>
          ),
        },
        {
          id: "resmi-kanallar",
          title: "Resmi kanallar ve dolandırıcılık uyarısı",
          content: (
            <>
              <p>
                Gönül Pusulası’nın resmi alan adları <strong>{SITE.domain}</strong> ve{" "}
                <strong>{SITE.altDomain}</strong>’dir.
              </p>
              <p>
                Şu anda hiçbir kanaldan üye kabul etmiyor, ödeme almıyor ve kişisel bilgi
                toplamıyoruz. Gönül Pusulası adına üyelik, ödeme, kimlik bilgisi veya doğrulama kodu
                isteyen mesajlara itibar etme ve bize bildir.
              </p>
            </>
          ),
        },
        {
          id: "yasak-kullanim",
          title: "Siteyi kullanırken yasak olan davranışlar",
          content: (
            <ul>
              <li>Site’nin güvenliğini, işleyişini veya erişilebilirliğini bozmaya çalışmak,</li>
              <li>
                Site içeriğini otomatik araçlarla toplu olarak kopyalamak veya Site’ye aşırı yük
                bindirmek,
              </li>
              <li>
                Gönül Pusulası’nın veya {ORG.brand}’in adını, logosunu ya da görünümünü kullanarak
                sahte site, hesap veya ileti oluşturmak,
              </li>
              <li>Site’yi yürürlükteki mevzuata aykırı herhangi bir amaçla kullanmak.</li>
            </ul>
          ),
        },
        {
          id: "fikri-mulkiyet",
          title: "Fikri mülkiyet",
          content: (
            <p>
              Site’deki metinler, tasarım, “Gönül Pusulası” adı, logo, pusula işareti, İlişki Pusulan
              testi ve diğer içerikler üzerindeki haklar saklıdır. Bu içerikler izin alınmadan
              kopyalanamaz, çoğaltılamaz veya ticari amaçla kullanılamaz. Site’ye bağlantı vermek ve
              test sonucunu kişisel olarak paylaşmak serbesttir.
            </p>
          ),
        },
        {
          id: "sorumluluk",
          title: "Sorumluluğun sınırları",
          content: (
            <>
              <p>
                Site’deki bilgiler genel bilgilendirme amacıyla, özenle ve güncel tutulmaya
                çalışılarak sunulur. Site’nin kesintisiz veya hatasız çalışacağı garanti edilmez;
                bakım, güncelleme veya teknik sorunlar nedeniyle erişim geçici olarak durabilir.
              </p>
              <p>
                Site’den bağlantı verilen üçüncü kişi sitelerinin içeriğinden ve uygulamalarından o
                sitelerin sahipleri sorumludur. Kanunen sorumluluğun sınırlandırılamayacağı hâller
                saklıdır.
              </p>
            </>
          ),
        },
        {
          id: "degisiklikler",
          title: "Değişiklikler",
          content: (
            <p>
              Bu koşullar güncellenebilir. Güncel sürüm, son güncelleme tarihiyle birlikte bu
              sayfada yayımlanır.
            </p>
          ),
        },
        {
          id: "hukuk",
          title: "Uygulanacak hukuk",
          content: (
            <p>
              Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Tüketici sıfatıyla sahip olduğun,
              6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında tüketici hakem heyetlerine
              ve tüketici mahkemelerine başvurma hakkın saklıdır.
            </p>
          ),
        },
      ]}
    />
  );
}
