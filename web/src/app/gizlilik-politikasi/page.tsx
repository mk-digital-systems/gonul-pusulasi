import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { ORG, SITE } from "@/lib/site";

const PATH = "/gizlilik-politikasi";

export const metadata: Metadata = {
  title: `Gizlilik Politikası | ${SITE.name}`,
  description:
    "Gönül Pusulası internet sitesinde hangi bilgilerin işlendiğini, neden işlendiğini ve nasıl korunduğunu sade bir dille anlatır.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Gizlilik Politikası"
      path={PATH}
      intro={
        <p>
          Gizlilik, Gönül Pusulası’nın ek bir özelliği değil, temelidir. Bu sayfa, bu internet
          sitesinde bugün gerçekte ne olduğunu sade bir dille anlatır. Hukuki bilgilendirmenin tamamı{" "}
          <Link href="/kvkk-aydinlatma-metni" className="text-ember underline underline-offset-2">
            KVKK Aydınlatma Metni
          </Link>
          ’nde yer alır.
        </p>
      }
      sections={[
        {
          id: "kisaca",
          title: "Kısaca",
          content: (
            <ul>
              <li>Bu sitede kayıt formu, bekleme listesi veya ön talep yok.</li>
              <li>Senden ad, e-posta, telefon, doğum tarihi veya şehir gibi bilgiler istemiyoruz.</li>
              <li>Çerez, reklam takibi veya ziyaretçi analitiği kullanmıyoruz.</li>
              <li>“İlişki Pusulan” testi tarayıcında çalışır; cevapların bize gelmez.</li>
              <li>Bilgilerini satmıyor, reklam amacıyla kimseyle paylaşmıyoruz.</li>
            </ul>
          ),
        },
        {
          id: "hangi-bilgiler",
          title: "Hangi bilgiler işleniyor?",
          content: (
            <>
              <p>
                <strong>Siteyi ziyaret ettiğinde:</strong> Her internet sitesinde olduğu gibi,
                sitenin sana ulaşabilmesi için barındırma altyapısı IP adresini, bağlantı zamanını,
                açtığın sayfayı ve tarayıcı türünü teknik kayıt olarak işler. Bu bilgiler siteyi
                sunmak ve saldırılara karşı korumak için kullanılır.
              </p>
              <p>
                <strong>Bize e-posta yazdığında:</strong> E-posta adresin, paylaşırsan adın ve
                mesajın, yalnızca sana cevap vermek ve talebini sonuçlandırmak için kullanılır.
              </p>
            </>
          ),
        },
        {
          id: "saklama",
          title: "Ne kadar süre saklanıyor?",
          content: (
            <>
              <p>
                <strong>Teknik kayıtlar</strong>, barındırma sağlayıcısının güvenlik ve işletim
                amaçlı kayıt süreleriyle sınırlı tutulur. Bu kayıtları ayrıca kopyalamıyor, profil
                oluşturmak veya reklam için kullanmıyoruz.
              </p>
              <p>
                <strong>E-posta yazışmaları</strong>, talebin sonuçlandıktan sonra en fazla 2 yıl
                saklanır ve ardından silinir. Bir uyuşmazlık veya kanuni saklama yükümlülüğü varsa
                yazışma, bu durum sona erene kadar saklanabilir.
              </p>
            </>
          ),
        },
        {
          id: "ucuncu-taraflar",
          title: "Hangi hizmet sağlayıcıları kullanıyoruz?",
          content: (
            <>
              <ul>
                <li>
                  <strong>Vercel Inc. (ABD):</strong> sitenin barındırılması ve ziyaretçilere
                  ulaştırılması.
                </li>
                <li>
                  <strong>Google (Google Workspace):</strong> {ORG.email} adresine gelen e-postaların
                  alınması ve saklanması.
                </li>
              </ul>
              <p>
                Bu sağlayıcılar hizmetlerini yurt dışındaki altyapıları üzerinden sunar; bu nedenle
                ilgili bilgiler yurt dışına aktarılmış olur. Sitedeki yazı tipleri sitenin kendi
                sunucusundan yüklenir; sayfayı açtığında başka bir hizmete (ör. yazı tipi, harita veya
                sosyal medya servisleri) istek gönderilmez.
              </p>
            </>
          ),
        },
        {
          id: "guvenlik",
          title: "Bilgileri nasıl koruyoruz?",
          content: (
            <ul>
              <li>Site yalnızca şifreli bağlantı (HTTPS) üzerinden sunulur.</li>
              <li>Amaç için gerekmeyen hiçbir bilgiyi istemiyor ve toplamıyoruz.</li>
              <li>Hizmet hesaplarına erişim yetkili kişilerle sınırlıdır ve korunur.</li>
            </ul>
          ),
        },
        {
          id: "uyelik",
          title: "Üyelik açıldığında",
          content: (
            <p>
              Gönül Pusulası üyeliği henüz açık değildir. Üyelik açıldığında hangi bilgilerin neden
              işleneceği, nerede saklanacağı ve ne kadar tutulacağı, üye olmadan önce ayrı bir
              aydınlatma metni ve üyelik koşullarıyla açıkça anlatılacaktır.
            </p>
          ),
        },
        {
          id: "haklarin",
          title: "Hakların ve iletişim",
          content: (
            <p>
              KVKK kapsamındaki hakların ve başvuru yöntemi{" "}
              <Link href="/kvkk-aydinlatma-metni#haklariniz">KVKK Aydınlatma Metni</Link>’nde
              anlatılmıştır. Gizlilikle ilgili her sorun için{" "}
              <a href={`mailto:${ORG.email}`}>{ORG.email}</a> adresine yazabilirsin.
            </p>
          ),
        },
        {
          id: "degisiklikler",
          title: "Değişiklikler",
          content: (
            <p>
              Bu politika, sitede bilgi işleme şekli değiştiğinde güncellenir. Örneğin ileride
              ziyaretçi analitiği kullanmaya karar verirsek bunu önce bu sayfada ve{" "}
              <Link href="/cerez-politikasi">Çerez Politikası</Link>’nda duyurur, gerekiyorsa
              iznini isteriz.
            </p>
          ),
        },
      ]}
    />
  );
}
