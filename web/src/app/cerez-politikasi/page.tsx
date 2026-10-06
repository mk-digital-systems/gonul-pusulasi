import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { ORG, SITE } from "@/lib/site";

const PATH = "/cerez-politikasi";

export const metadata: Metadata = {
  alternates: { canonical: PATH },
  title: `Çerez Politikası | ${SITE.name}`,
  description: "Gönül Pusulası internet sitesi çerez ve benzeri teknolojileri kullanmaz.",
};

export default function CookiePage() {
  return (
    <LegalPage
      title="Çerez Politikası"
      path={PATH}
      intro={<p>Kısa cevap: Bu site çerez kullanmaz.</p>}
      sections={[
        {
          id: "cerez-nedir",
          title: "Çerez nedir?",
          content: (
            <p>
              Çerezler, ziyaret ettiğin internet sitelerinin tarayıcına kaydettiği küçük metin
              dosyalarıdır. Tarayıcı depolaması (localStorage, sessionStorage) ve takip pikselleri
              de benzer amaçlarla kullanılabilen teknolojilerdir.
            </p>
          ),
        },
        {
          id: "kullanim-durumu",
          title: "Bu sitede neler kullanılıyor?",
          content: (
            <>
              <p>{SITE.domain} adresinde:</p>
              <ul>
                <li>çerez kullanılmaz,</li>
                <li>tarayıcı depolamasına (localStorage, sessionStorage) bilgi yazılmaz,</li>
                <li>ziyaretçi analitiği, reklam veya pazarlama amaçlı takip araçları bulunmaz,</li>
                <li>
                  üçüncü taraf betikleri, gömülü sosyal medya içerikleri veya harici yazı tipi
                  servisleri yüklenmez.
                </li>
              </ul>
              <p>
                Bu nedenle sitede çerez izni penceresi yoktur; izin istenecek bir teknoloji
                kullanılmamaktadır.
              </p>
            </>
          ),
        },
        {
          id: "teknik-kayitlar",
          title: "Teknik bağlantı kayıtları",
          content: (
            <p>
              Siteyi barındıran altyapı, bağlantının kurulabilmesi ve güvenlik için IP adresi gibi
              teknik bilgileri sunucu kayıtlarında işler. Bu işlem çerez kullanılarak yapılmaz;
              ayrıntılar <Link href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</Link> ve{" "}
              <Link href="/gizlilik-politikasi">Gizlilik Politikası</Link>’nda yer alır.
            </p>
          ),
        },
        {
          id: "gelecekte",
          title: "İleride değişirse",
          content: (
            <p>
              Sitede ileride zorunlu olmayan bir çerez veya benzeri teknoloji kullanmaya karar
              verirsek, bunu kullanmaya başlamadan önce bu politikayı güncelleyecek ve açık iznini
              alacağız. İzin vermemen, sitenin temel içeriğine erişimini engellemeyecektir.
            </p>
          ),
        },
        {
          id: "iletisim",
          title: "İletişim",
          content: (
            <p>
              Sorularını <a href={`mailto:${ORG.email}`}>{ORG.email}</a> adresine iletebilirsin.
            </p>
          ),
        },
      ]}
    />
  );
}
