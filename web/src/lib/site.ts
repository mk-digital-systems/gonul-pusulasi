export const SITE = {
  name: "Gönül Pusulası",
  domain: "gonulpusulasi.tr",
  url: "https://gonulpusulasi.tr",
  altDomain: "gonulpusulasi.com.tr",
  slogan: "Birini değil, sana uyan birini bul.",
  minAge: 30,
};

// Ziyaretçiye açık kurumsal bilgiler. Gerçek kişi adı yalnızca hukuken zorunlu
// alanlarda (KVKK veri sorumlusu, 5651 içerik sağlayıcı bilgisi) kullanılır.
export const ORG = {
  brand: "MK Digital Systems",
  location: "Bolu Merkez / Türkiye",
  email: "iletisim@mk-digitalsystems.com",
  controller: "Mustafa Öner",
  // Yalnızca hukuken zorunlu bölümlerde gösterilir (KVKK veri sorumlusu, 5651 içerik sağlayıcı)
  phone: "0545 659 75 51",
  phoneHref: "tel:+905456597551",
};

export const LEGAL_UPDATED = "6 Ekim 2026";

export const LEGAL_PAGES = [
  { href: "/kvkk-aydinlatma-metni", title: "KVKK Aydınlatma Metni" },
  { href: "/gizlilik-politikasi", title: "Gizlilik Politikası" },
  { href: "/kullanim-kosullari", title: "Kullanım Koşulları" },
  { href: "/cerez-politikasi", title: "Çerez Politikası" },
  { href: "/topluluk-kurallari", title: "Topluluk Kuralları" },
  { href: "/guvenli-tanisma", title: "Güvenli Tanışma" },
  { href: "/iletisim", title: "İletişim" },
] as const;
