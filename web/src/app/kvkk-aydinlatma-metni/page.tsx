import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { ORG, SITE } from "@/lib/site";

const PATH = "/kvkk-aydinlatma-metni";

export const metadata: Metadata = {
  title: `KVKK Aydınlatma Metni | ${SITE.name}`,
  description:
    "Gönül Pusulası internet sitesi ziyaretçileri ve bizimle iletişime geçen kişiler için 6698 sayılı KVKK kapsamında aydınlatma metni.",
};

export default function KvkkPage() {
  return (
    <LegalPage
      title="KVKK Aydınlatma Metni"
      path={PATH}
      intro={
        <p>
          Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu’nun (“KVKK”) 10. maddesi ve
          Aydınlatma Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ
          uyarınca, {SITE.domain} internet sitesini ziyaret eden ve bizimle iletişime geçen kişileri
          bilgilendirmek amacıyla hazırlanmıştır.
        </p>
      }
      sections={[
        {
          id: "veri-sorumlusu",
          title: "Veri sorumlusu",
          content: (
            <>
              <p>
                Gönül Pusulası, <strong>{ORG.brand}</strong> markası altında yürütülmektedir. KVKK
                kapsamında veri sorumlusu, {ORG.brand} markasını kullanan gerçek kişi{" "}
                <strong>{ORG.controller}</strong>’dir.
              </p>
              <p>
                İletişim: <a href={`mailto:${ORG.email}`}>{ORG.email}</a> · {ORG.location}
              </p>
            </>
          ),
        },
        {
          id: "kapsam",
          title: "Bu metnin kapsamı",
          content: (
            <>
              <p>
                Gönül Pusulası şu anda hazırlık aşamasındadır. Bu internet sitesinde{" "}
                <strong>üyelik, kayıt formu, bekleme listesi veya ön talep bulunmamaktadır</strong>;
                ziyaretçilerden ad, e-posta, telefon, doğum tarihi, şehir veya benzeri bilgiler
                istenmez.
              </p>
              <p>Bu metin yalnızca aşağıdaki iki durumu kapsar:</p>
              <ul>
                <li>{SITE.domain} ve {SITE.altDomain} adreslerini ziyaret etmeniz,</li>
                <li>bize e-posta yoluyla yazmanız.</li>
              </ul>
              <p>
                Gönül Pusulası üyeliği açıldığında, üyelik kapsamında işlenecek kişisel veriler için
                üyelikten önce ayrı bir aydınlatma metni sunulacaktır.
              </p>
            </>
          ),
        },
        {
          id: "islenen-veriler",
          title: "İşlenen kişisel veriler",
          content: (
            <>
              <h3>a) Teknik bağlantı verileri (işlem güvenliği)</h3>
              <p>
                Siteyi ziyaret ettiğinizde, sitenin barındırıldığı altyapı tarafından bağlantının
                kurulabilmesi ve güvenliğin sağlanabilmesi için otomatik olarak IP adresiniz,
                bağlantının tarih ve saati, istenen sayfa adresi ile tarayıcı ve cihaz türüne ilişkin
                bilgiler gibi teknik kayıtlar işlenir.
              </p>
              <h3>b) İletişim verileri</h3>
              <p>
                Bize e-posta gönderirseniz e-posta adresiniz, paylaşmanız hâlinde adınız, mesajınızın
                içeriği ve eklediğiniz dosyalar işlenir. Lütfen yazışmalarda sağlık, din, mezhep,
                siyasi görüş gibi özel nitelikli kişisel verilerinizi veya kimlik belgesi görüntüsü
                paylaşmayın; talebinizi yanıtlamak için bunlara ihtiyacımız yoktur.
              </p>
              <h3>c) İşlenmeyen veriler</h3>
              <p>
                Sitede çerez, reklam veya ziyaretçi analitiği araçları kullanılmaz. Sitedeki “İlişki
                Pusulan” testi tamamen tarayıcınızda çalışır; cevaplarınız ve sonucunuz bize
                gönderilmez ve hiçbir yerde saklanmaz.
              </p>
            </>
          ),
        },
        {
          id: "amaclar-ve-hukuki-sebepler",
          title: "İşleme amaçları ve hukuki sebepler",
          content: (
            <div className="overflow-x-auto">
              <table>
                <thead>
                  <tr>
                    <th>Veri</th>
                    <th>Amaç</th>
                    <th>Hukuki sebep (KVKK m.5/2)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Teknik bağlantı verileri</td>
                    <td>
                      Sitenin sunulması, bilgi güvenliğinin sağlanması, saldırı ve kötüye
                      kullanımın önlenmesi, teknik hataların giderilmesi
                    </td>
                    <td>(f) Veri sorumlusunun meşru menfaati</td>
                  </tr>
                  <tr>
                    <td>Teknik bağlantı verileri</td>
                    <td>Yetkili kurum ve yargı mercilerinden gelen taleplerin karşılanması</td>
                    <td>(ç) Hukuki yükümlülüğün yerine getirilmesi</td>
                  </tr>
                  <tr>
                    <td>İletişim verileri</td>
                    <td>Soru, öneri ve taleplerinizin yanıtlanması</td>
                    <td>(f) Veri sorumlusunun meşru menfaati</td>
                  </tr>
                  <tr>
                    <td>İletişim verileri</td>
                    <td>KVKK kapsamındaki başvurularınızın sonuçlandırılması</td>
                    <td>(ç) Hukuki yükümlülüğün yerine getirilmesi</td>
                  </tr>
                  <tr>
                    <td>Her iki veri türü</td>
                    <td>Olası uyuşmazlıklarda hakların tesisi, kullanılması ve korunması</td>
                    <td>(e) Bir hakkın tesisi, kullanılması veya korunması</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-4">
                Bu kapsamda açık rızanıza dayanan bir işleme faaliyeti bulunmamaktadır.
              </p>
            </div>
          ),
        },
        {
          id: "toplama-yontemi",
          title: "Kişisel verilerin toplanma yöntemi",
          content: (
            <p>
              Teknik bağlantı verileri, siteyi ziyaret ettiğinizde barındırma altyapısının sunucu
              kayıtları aracılığıyla otomatik yollarla; iletişim verileri ise bize e-posta
              gönderdiğinizde doğrudan sizden toplanır.
            </p>
          ),
        },
        {
          id: "aktarim",
          title: "Kişisel verilerin aktarılması",
          content: (
            <>
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Alıcı</th>
                      <th>Aktarılan veri</th>
                      <th>Amaç</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Vercel Inc. (ABD) — barındırma ve içerik dağıtım hizmeti</td>
                      <td>Teknik bağlantı verileri</td>
                      <td>Sitenin sunulması ve güvenliği</td>
                    </tr>
                    <tr>
                      <td>Google (Google Workspace) — e-posta hizmeti</td>
                      <td>İletişim verileri</td>
                      <td>E-posta yazışmalarının alınması, saklanması ve yanıtlanması</td>
                    </tr>
                    <tr>
                      <td>Yetkili kamu kurum ve kuruluşları, yargı mercileri</td>
                      <td>Talep edilen veriler</td>
                      <td>Kanuni yükümlülüklerin yerine getirilmesi</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Vercel ve Google hizmetlerini yurt dışındaki altyapıları üzerinden sunduğundan, bu
                hizmet sağlayıcılarına yapılan aktarımlar KVKK’nın 9. maddesi kapsamında yurt dışına
                aktarım niteliğindedir. Kişisel verileriniz satılmaz, reklam veya pazarlama amacıyla
                üçüncü kişilerle paylaşılmaz.
              </p>
            </>
          ),
        },
        {
          id: "haklariniz",
          title: "KVKK m.11 kapsamındaki haklarınız",
          content: (
            <>
              <p>Veri sorumlusuna başvurarak:</p>
              <ol>
                <li>kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
                <li>işlenmişse buna ilişkin bilgi talep etme,</li>
                <li>işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
                <li>yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
                <li>eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
                <li>
                  KVKK’nın 7. maddesindeki şartlar çerçevesinde silinmesini veya yok edilmesini
                  isteme,
                </li>
                <li>
                  düzeltme, silme veya yok etme işlemlerinin verilerin aktarıldığı üçüncü kişilere
                  bildirilmesini isteme,
                </li>
                <li>
                  işlenen verilerin münhasıran otomatik sistemlerle analiz edilmesi suretiyle
                  aleyhinize bir sonucun ortaya çıkmasına itiraz etme,
                </li>
                <li>
                  kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın giderilmesini
                  talep etme
                </li>
              </ol>
              <p>haklarına sahipsiniz.</p>
            </>
          ),
        },
        {
          id: "basvuru",
          title: "Başvuru yöntemi",
          content: (
            <>
              <p>
                Haklarınıza ilişkin taleplerinizi, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında
                Tebliğ’e uygun olarak aşağıdaki yollarla iletebilirsiniz:
              </p>
              <ul>
                <li>
                  güvenli elektronik imza veya mobil imza ile imzalanmış başvurunuzu{" "}
                  <a href={`mailto:${ORG.email}`}>{ORG.email}</a> adresine göndererek,
                </li>
                <li>
                  daha önce bizimle yazıştığınız ve sistemimizde kayıtlı bulunan e-posta adresinizden{" "}
                  <a href={`mailto:${ORG.email}`}>{ORG.email}</a> adresine yazarak.
                </li>
              </ul>
              <p>
                Başvurunuzda adınız ve soyadınız, T.C. kimlik numaranız (yabancılar için uyruk ile
                pasaport veya kimlik numarası), tebligata esas yerleşim yeri veya iş yeri adresiniz,
                varsa bildirime esas e-posta adresiniz ve telefon numaranız ile talebinizin konusu yer
                almalıdır.
              </p>
              <p>
                Başvurunuz en kısa sürede ve en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.
                İşlemin ayrıca bir maliyet gerektirmesi hâlinde Kişisel Verileri Koruma Kurulu’nca
                belirlenen tarifedeki ücret alınabilir. Başvurunuzun reddedilmesi, cevabın yetersiz
                bulunması veya süresinde cevap verilmemesi hâlinde Kişisel Verileri Koruma Kurulu’na
                şikâyette bulunabilirsiniz.
              </p>
            </>
          ),
        },
        {
          id: "guncellemeler",
          title: "Güncellemeler",
          content: (
            <p>
              Bu metin, veri işleme faaliyetlerimiz değiştiğinde güncellenir. Güncel sürüm her zaman
              bu sayfada yayımlanır. Sitedeki veri işlemenin sade bir anlatımı için{" "}
              <Link href="/gizlilik-politikasi">Gizlilik Politikası</Link>’na bakabilirsiniz.
            </p>
          ),
        },
      ]}
    />
  );
}
