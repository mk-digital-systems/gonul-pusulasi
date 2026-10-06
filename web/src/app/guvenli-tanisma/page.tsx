import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { SITE } from "@/lib/site";

const PATH = "/guvenli-tanisma";

export const metadata: Metadata = {
  alternates: { canonical: PATH },
  title: `Güvenli Tanışma | ${SITE.name}`,
  description:
    "İnternette tanıştığın biriyle yazışırken ve buluşurken kendini korumak için pratik öneriler.",
};

export default function SafeDatingPage() {
  return (
    <LegalPage
      eyebrow="Güvenlik"
      title="Güvenli Tanışma"
      path={PATH}
      intro={
        <p>
          Tanıştığın insanların büyük çoğunluğu senin gibi iyi niyetlidir. Yine de birkaç basit
          alışkanlık, seni kötü niyetli az sayıdaki kişiden korur. Bu öneriler yalnızca Gönül
          Pusulası için değil, internette tanıştığın herkes için geçerlidir.
        </p>
      }
      sections={[
        {
          id: "para",
          title: "Para ve maddi talepler",
          content: (
            <ul>
              <li>
                <strong>Tanımadığın birine asla para gönderme.</strong> Hastalık, kaza, gümrük,
                bilet veya “geçici sıkıntı” gibi hikâyeler en yaygın dolandırıcılık yöntemleridir.
              </li>
              <li>Banka, kart, şifre veya doğrulama kodu bilgilerini kimseyle paylaşma.</li>
              <li>
                Yatırım, kripto para, döviz veya “garantili kazanç” tekliflerinden uzak dur.
                Romantik ilgiyle başlayıp yatırıma yönlenen konuşmalar ciddi bir uyarı işaretidir.
              </li>
              <li>Gönül Pusulası çalışanları senden asla şifre, kart bilgisi veya para istemez.</li>
            </ul>
          ),
        },
        {
          id: "cevrimici",
          title: "Yazışırken",
          content: (
            <ul>
              <li>Şüpheli bağlantılara tıklama, tanımadığın kaynaklardan dosya veya uygulama indirme.</li>
              <li>
                Ev adresin, iş yerin, günlük rutinin gibi bilgileri tanışmanın başında paylaşma.
              </li>
              <li>
                Konuşmayı hızla başka bir uygulamaya taşımak için ısrar edilmesi, tutarsız hikâyeler
                ve görüntülü görüşmeden sürekli kaçınılması dikkat edilmesi gereken işaretlerdir.
              </li>
              <li>Mahrem fotoğraf veya video paylaşma; bunlar şantaj amacıyla kullanılabilir.</li>
            </ul>
          ),
        },
        {
          id: "bulusma",
          title: "İlk buluşmada",
          content: (
            <ul>
              <li>İlk buluşmayı kalabalık ve halka açık bir yerde yap.</li>
              <li>
                Bir yakınına kiminle, nerede ve ne zaman buluşacağını söyle; mümkünse buluşma
                sırasında haberleş.
              </li>
              <li>Ulaşımını mümkünse kendin ayarla; dönüş planın sende olsun.</li>
              <li>Kendini rahatsız hissedersen açıklama yapmak zorunda olmadan ayrılabilirsin.</li>
            </ul>
          ),
        },
        {
          id: "bildir",
          title: "Şüphelendiğinde",
          content: (
            <>
              <ul>
                <li>
                  Uygulama açıldığında şüpheli kişiyi tek dokunuşla engelleyebilecek ve
                  şikâyet edebileceksin. Şikâyetçinin kimliği karşı tarafa bildirilmez.
                </li>
                <li>
                  Acil bir tehlikede <strong>112</strong>’yi ara. Kadınlar, Emniyet Genel Müdürlüğü’nün{" "}
                  <strong>KADES</strong> uygulamasıyla tek dokunuşla yardım çağırabilir.
                </li>
                <li>
                  Dolandırıcılığa uğradığını düşünüyorsan bankanı hemen ara ve kolluk kuvvetlerine
                  başvur.
                </li>
              </ul>
            </>
          ),
        },
        {
          id: "sinirlar",
          title: "Doğrulamanın sınırları",
          content: (
            <p>
              Gönül Pusulası’nda telefon doğrulaması, şikâyet ve moderasyon gibi önlemler olacak. Bu
              önlemler riski azaltır ancak sıfırlamaz; hiçbir platform her kişinin niyetini
              doğrulayamaz. Kendi sezgine güven ve{" "}
              <Link href="/topluluk-kurallari">Topluluk Kuralları</Link>’na aykırı her davranışı
              bildir.
            </p>
          ),
        },
      ]}
    />
  );
}
