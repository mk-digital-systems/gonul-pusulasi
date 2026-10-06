import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { SITE } from "@/lib/site";

const PATH = "/topluluk-kurallari";

export const metadata: Metadata = {
  title: `Topluluk Kuralları | ${SITE.name}`,
  description:
    "Gönül Pusulası üyeliği açıldığında tüm üyelerin uyacağı davranış kuralları, şikâyet, engelleme ve moderasyon ilkeleri.",
};

export default function CommunityPage() {
  return (
    <LegalPage
      eyebrow="Topluluk"
      title="Topluluk Kuralları"
      path={PATH}
      intro={
        <>
          <p>
            Gönül Pusulası, ciddi bir ilişki arayan yetişkinlerin birbirine saygıyla yaklaştığı bir
            yer olacak. Bu kurallar, üyelik açıldığında tüm üyeler için geçerli olacak ve üyelik
            koşullarının bir parçası olacaktır.
          </p>
        </>
      }
      sections={[
        {
          id: "temel-ilkeler",
          title: "Temel ilkeler",
          content: (
            <ul>
              <li>
                <strong>Gerçek ol.</strong> Kendi adına, tek bir hesapla ve doğru bilgilerle var ol.
              </li>
              <li>
                <strong>Saygılı ol.</strong> Karşındaki kişi, senin gibi doğru insanı arayan biri.
              </li>
              <li>
                <strong>Açık ol.</strong> Devam etmek istemediğinde sessizce kaybolmak yerine nazikçe
                vedalaş.
              </li>
              <li>
                <strong>Güvende tut.</strong> Kendini ve başkalarını riske atacak davranışlardan
                kaçın; şüpheli durumları bildir.
              </li>
            </ul>
          ),
        },
        {
          id: "uyelik-sarti",
          title: "Kimler üye olabilir?",
          content: (
            <p>
              Gönül Pusulası yalnızca <strong>30 yaş ve üzeri</strong> kişilere açıktır; üst yaş
              sınırı yoktur. 30 yaşını doldurmamış kişiler ve reşit olmayanlar üye olamaz; bu kişilere
              ait olduğu anlaşılan hesaplar kapatılır.
            </p>
          ),
        },
        {
          id: "yasaklar",
          title: "Yasak olan davranışlar",
          content: (
            <>
              <h3>Kimlik ve hesap</h3>
              <ul>
                <li>sahte profil oluşturmak, başka biri gibi davranmak,</li>
                <li>başka bir kişiye ait fotoğraf veya ses kaydı kullanmak,</li>
                <li>bot veya otomatik araçlarla hesap yönetmek,</li>
                <li>birden fazla hesap açmak ya da kapatılan hesabın yerine yeni hesap açmak,</li>
                <li>yaş, cinsiyet, medeni durum gibi konularda yanlış bilgi vermek.</li>
              </ul>
              <h3>Taciz ve zarar verici içerik</h3>
              <ul>
                <li>taciz, tehdit, ısrarlı ve istenmeyen iletişim,</li>
                <li>nefret söylemi ve ayrımcılık,</li>
                <li>istenmeyen cinsel içerik, çıplaklık veya müstehcen içerik,</li>
                <li>
                  bir başkasının kişisel bilgilerini, fotoğraflarını veya yazışmalarını izinsiz
                  paylaşmak (ifşa, “doxxing”),
                </li>
                <li>yasa dışı içerik paylaşmak veya yasa dışı faaliyete aracılık etmek.</li>
              </ul>
              <h3>Dolandırıcılık ve kötüye kullanım</h3>
              <ul>
                <li>herhangi bir gerekçeyle para, hediye veya maddi yardım istemek,</li>
                <li>IBAN, hesap numarası veya ödeme bağlantısı göndererek para talep etmek,</li>
                <li>yatırım, kripto para veya “kazanç” teklifleri sunmak,</li>
                <li>romantik ilişki görüntüsü altında güven kazanıp çıkar sağlamaya çalışmak,</li>
                <li>
                  şüpheli bağlantılarla şifre, kart bilgisi veya doğrulama kodu ele geçirmeye
                  çalışmak (oltalama / phishing),
                </li>
                <li>spam, reklam, ürün veya hizmet satışı gibi ticari amaçlı kullanım.</li>
              </ul>
            </>
          ),
        },
        {
          id: "icerik",
          title: "Fotoğraf, ses ve diğer içerikler",
          content: (
            <>
              <p>
                Profil fotoğrafı ve sesli tanıtım zorunlu olmayacaktır. Paylaştığın fotoğraf, ses ve
                metinler sana ait olmalı ve başkalarının haklarını ihlal etmemelidir.
              </p>
              <ul>
                <li>
                  İçeriğinin sahibi sen olmaya devam edersin. Gönül Pusulası, içeriğini yalnızca
                  hizmeti sunmak için gerekli ölçüde barındırır, diğer üyelere gösterir, teknik
                  olarak işler, güvenliği sağlar ve denetler.
                </li>
                <li>
                  Fotoğrafların ve ses kaydın, ayrıca iznin olmadan reklam veya tanıtım amacıyla
                  kullanılmaz.
                </li>
                <li>
                  Telefon numarası, adres, iş yeri gibi bilgileri profilinde paylaşmamanı öneririz.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "sikayet-engelleme",
          title: "Şikâyet ve engelleme",
          content: (
            <>
              <p>
                Rahatsız olduğun bir kişiyi tek dokunuşla engelleyebilecek ve şikâyet edebileceksin.
                Engellediğin kişi seni görmez ve sana ulaşamaz. Şikâyet ettiğin kişiye şikâyetçinin
                kim olduğu bildirilmez.
              </p>
              <p>
                Engelleme ve şikâyet, tanışma kurallarındaki bekleme sürelerinden etkilenmez; güvenlik
                gerektiren durumlarda beklemeden kullanılabilir.
              </p>
            </>
          ),
        },
        {
          id: "moderasyon",
          title: "Moderasyon ve yazışmaların gizliliği",
          content: (
            <>
              <p>
                Profiller, fotoğraflar ve şikâyet edilen içerikler; otomatik kontroller ve yetkili
                ekip üyeleri tarafından incelenebilir.
              </p>
              <p>
                Yazışmalar rutin olarak okunmaz. Ancak bir şikâyet, güvenlik veya dolandırıcılık
                şüphesi, taciz bildirimi ya da kanuni bir yükümlülük olduğunda, yalnızca yetkili ve
                sınırlı sayıda ekip üyesi, incelemeye gerekli olan yazışmalara erişebilir. Bu
                erişimler en aza indirilir ve kayıt altına alınır.
              </p>
            </>
          ),
        },
        {
          id: "yaptirimlar",
          title: "Kurallara uyulmazsa",
          content: (
            <>
              <p>İhlalin ağırlığına göre şu önlemler uygulanabilir:</p>
              <ul>
                <li>uyarı,</li>
                <li>içeriğin kaldırılması,</li>
                <li>hesabın geçici olarak askıya alınması,</li>
                <li>hesabın kalıcı olarak kapatılması ve yeniden üyeliğin engellenmesi.</li>
              </ul>
              <p>
                Yanlış bilgi verdiği tespit edilen kişinin hesabı askıya alınır ve kalıcı olarak
                kapatılabilir. Dolandırıcılık, tehdit veya suç teşkil edebilecek durumlarda yetkili
                makamlarla kanunun öngördüğü ölçüde iş birliği yapılır. Alınan karara itiraz
                edebileceğin bir yol sunulacaktır.
              </p>
            </>
          ),
        },
        {
          id: "guvenlik-sinirlari",
          title: "Güvenlik önlemlerinin sınırları",
          content: (
            <p>
              Doğrulama, şikâyet ve moderasyon sistemleri riski azaltır ancak tamamen ortadan
              kaldıramaz. Tanıştığın kişilerle iletişimde dikkatli olmanı ve{" "}
              <Link href="/guvenli-tanisma">Güvenli Tanışma</Link> rehberini okumanı öneririz.
            </p>
          ),
        },
      ]}
    />
  );
}
