import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { ORG, SITE } from "@/lib/site";

const PATH = "/iletisim";

export const metadata: Metadata = {
  title: `İletişim | ${SITE.name}`,
  description: "Gönül Pusulası ile iletişim bilgileri.",
};

export default function ContactPage() {
  return (
    <LegalPage
      eyebrow="İletişim"
      title="İletişim"
      path={PATH}
      intro={<p>Soruların, önerilerin ve bildirimlerin için bize e-postayla ulaşabilirsin.</p>}
      sections={[
        {
          id: "bize-ulasin",
          title: "Bize ulaşın",
          content: (
            <>
              <p>
                <strong>{SITE.name}</strong>
                <br />
                {ORG.brand}
                <br />
                {ORG.location}
              </p>
              <p>
                E-posta: <a href={`mailto:${ORG.email}`}>{ORG.email}</a>
              </p>
              <p>
                Gelen e-postaları sırayla yanıtlıyoruz. Lütfen e-postanda kimlik belgesi, şifre,
                kart bilgisi veya özel nitelikli kişisel veri paylaşma.
              </p>
            </>
          ),
        },
        {
          id: "kvkk-basvurulari",
          title: "Kişisel veri başvuruları",
          content: (
            <p>
              KVKK kapsamındaki haklarına ilişkin başvuruların için yöntem ve gerekli bilgiler{" "}
              <Link href="/kvkk-aydinlatma-metni#basvuru">KVKK Aydınlatma Metni</Link>’nde yer alır.
            </p>
          ),
        },
        {
          id: "icerik-saglayici",
          title: "İçerik sağlayıcı bilgileri",
          content: (
            <p>
              5651 sayılı Kanun kapsamında içerik sağlayıcı: <strong>{ORG.controller}</strong> (
              {ORG.brand})
              <br />
              E-posta: <a href={`mailto:${ORG.email}`}>{ORG.email}</a>
            </p>
          ),
        },
        {
          id: "resmi-kanallar",
          title: "Resmi alan adlarımız",
          content: (
            <>
              <p>
                Gönül Pusulası’nın resmi internet adresleri <strong>{SITE.domain}</strong> ve{" "}
                <strong>{SITE.altDomain}</strong>’dir.
              </p>
              <p>
                Gönül Pusulası şu anda üye kabul etmiyor ve ödeme almıyor. Adımıza üyelik, ödeme veya
                kişisel bilgi isteyen bir mesaj alırsan yanıt verme ve bize{" "}
                <a href={`mailto:${ORG.email}`}>{ORG.email}</a> adresinden bildir.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}
