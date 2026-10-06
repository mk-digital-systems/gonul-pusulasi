// İlişki Pusulan mini testi.
// Sonuç tarayıcıda hesaplanır ve hiçbir yere kaydedilmez.
// Her yön 9 soru boyunca tam 6 seçenekte geçer; dağılım dengelidir.

export type Direction =
  | "huzur"
  | "iletisim"
  | "gelecek"
  | "alan"
  | "kesif"
  | "sefkat";

export type Option = { text: string; direction: Direction };
export type Question = { text: string; options: Option[] };

export type Result = {
  title: string;
  summary: string;
  strengths: string;
  watchOut: string;
  goodMatch: string;
  // Pusula iğnesinin açısı (derece)
  angle: number;
};

// Eşitlik durumunda bu sıra kullanılır.
export const DIRECTION_ORDER: Direction[] = [
  "huzur",
  "iletisim",
  "gelecek",
  "alan",
  "kesif",
  "sefkat",
];

export const QUESTIONS: Question[] = [
  {
    text: "Yoğun bir haftanın sonunda partnerinle ideal akşamın hangisi?",
    options: [
      { text: "Evde sakin bir akşam; telefonlar bir kenarda.", direction: "huzur" },
      { text: "Uzun bir yürüyüş ve içten bir sohbet.", direction: "iletisim" },
      { text: "Hiç gitmediğimiz bir yeri keşfetmek.", direction: "kesif" },
      { text: "Herkes biraz kendi işine, sonra birlikte bir yemek.", direction: "alan" },
    ],
  },
  {
    text: "Partnerin önemli bir planı son dakikada iptal etti. İlk düşüncen ne olur?",
    options: [
      { text: "Bir sebebi vardır; anlatmasını beklerim.", direction: "huzur" },
      { text: "Konuşalım; ne olduğunu açıkça bilmek isterim.", direction: "iletisim" },
      { text: "İyi mi? Önce onun için endişelenirim.", direction: "sefkat" },
      { text: "Sorun değil, yeni bir gün belirleriz.", direction: "gelecek" },
    ],
  },
  {
    text: "Bir ilişkide seni en çok ne yorar?",
    options: [
      { text: "Belirsizlik ve tutarsızlık.", direction: "huzur" },
      { text: "Söylenmeyen şeyler, uzayan küslükler.", direction: "iletisim" },
      { text: "Geleceğe dair hiç konuşulmaması.", direction: "gelecek" },
      { text: "Rutinin her şeyi ele geçirmesi.", direction: "kesif" },
    ],
  },
  {
    text: "Yeni tanıştığın birinde ilk neyi fark edersin?",
    options: [
      { text: "Sözünün eri olup olmadığını.", direction: "huzur" },
      { text: "Beni gerçekten dinleyip dinlemediğini.", direction: "iletisim" },
      { text: "İnsanlara nasıl davrandığını.", direction: "sefkat" },
      { text: "Hayattan keyif alıp almadığını.", direction: "kesif" },
    ],
  },
  {
    text: "Beş yıl sonrası için hangisi sana daha yakın?",
    options: [
      { text: "Kurulmuş bir düzen, ortak bir ev, belki büyüyen bir aile.", direction: "gelecek" },
      { text: "Birbirine hâlâ özenle bakan iki insan.", direction: "sefkat" },
      { text: "Birlikte görülmüş yeni yerler, yeni deneyimler.", direction: "kesif" },
      { text: "Birbirinin hayallerine alan açan iki bağımsız insan.", direction: "alan" },
    ],
  },
  {
    text: "Zor bir gün geçirdiğinde partnerinden ne beklersin?",
    options: [
      { text: "Sarılması, küçük bir jest yapması.", direction: "sefkat" },
      { text: "Çözüm aramadan, sadece beni dinlemesi.", direction: "iletisim" },
      { text: "Biraz yalnız kalmama izin vermesi.", direction: "alan" },
      { text: "Birlikte bir plan yapıp ileriye bakmamız.", direction: "gelecek" },
    ],
  },
  {
    text: "Aile ve ilişki dengesi konusunda hangisi seni daha iyi anlatır?",
    options: [
      { text: "İki ailenin de içinde olduğu geniş bir hayat isterim.", direction: "gelecek" },
      { text: "Önce ikimizin dengesi oturmalı, gerisi onun üzerine kurulur.", direction: "huzur" },
      { text: "Sevdiklerime gösterdiğim özeni partnerimin de anlamasını isterim.", direction: "sefkat" },
      { text: "Herkesin kendi alanı ve sınırları korunmalı.", direction: "alan" },
    ],
  },
  {
    text: "Bir tartışmanın ardından ne olmasını istersin?",
    options: [
      { text: "Aynı gün konuşup çözmek.", direction: "iletisim" },
      { text: "Biraz sakinleşip sonra konuşmak.", direction: "alan" },
      { text: "Kırgınlığın şefkatle onarıldığını hissetmek.", direction: "sefkat" },
      { text: "Bir gülüşle, hafif bir jestle havanın yumuşaması.", direction: "kesif" },
    ],
  },
  {
    text: "Hayatına biri girdiğinde neyi korumak istersin?",
    options: [
      { text: "Arkadaşlarımı ve kendi uğraşlarımı.", direction: "alan" },
      { text: "Sakin, öngörülebilir düzenimi.", direction: "huzur" },
      { text: "Ailemle olan bağımı.", direction: "gelecek" },
      { text: "Merakımı ve yeni şeyler deneme isteğimi.", direction: "kesif" },
    ],
  },
];

export const RESULTS: Record<Direction, Result> = {
  huzur: {
    title: "Huzur & Güven",
    summary:
      "İlişkide heyecandan önce güven, tutarlılık ve sakin bir liman arıyorsun. Senin için sevgi, verilen sözün tutulmasıdır.",
    strengths:
      "Güvenilirsin; sözünün arkasında durursun. Zor anlarda sakin kalır, ilişkiyi dengede tutarsın.",
    watchOut:
      "Belirsizlik seni çabuk yorabilir. Her sessizliği bir işaret olarak okumamaya çalış.",
    goodMatch:
      "Tutarlı, sözünün eri ve duygularını sakinlikle ifade edebilen biri.",
    angle: 0,
  },
  iletisim: {
    title: "Derin Sohbet & Açıklık",
    summary:
      "Senin için ilişki, iki insanın birbirini gerçekten duymasıdır. Söylenmeyen şeyler seni, yüksek sesle söylenenlerden daha çok yorar.",
    strengths:
      "Dinlemeyi bilirsin; sorunları büyümeden konuşursun. Zor konulardan kaçmazsın.",
    watchOut:
      "Herkes duygularını aynı hızda açamaz. Karşındakine zaman tanımak da bir iletişim biçimidir.",
    goodMatch:
      "Merak eden, soru soran ve zor konuları konuşmaktan çekinmeyen biri.",
    angle: 60,
  },
  gelecek: {
    title: "Ortak Yol & Aile",
    summary:
      "Bir ilişkiyi, birlikte kurulacak bir hayatın başlangıcı olarak görüyorsun. Planlar, aile ve ortak hedefler senin için sevginin somut hâli.",
    strengths:
      "Sorumluluk alırsın; ilişkiye emek ve süreklilik katarsın.",
    watchOut:
      "Geleceği planlarken bugünün tadını kaçırma. Karşındakine kendi hızında gelme alanı tanı.",
    goodMatch:
      "Ciddi niyetli, aile değerlerine önem veren ve geleceğe dair konuşmaktan çekinmeyen biri.",
    angle: 120,
  },
  alan: {
    title: "Özgürlük & Saygı",
    summary:
      "Sağlıklı bir ilişkinin, iki bütün insanın birbirine alan tanımasıyla mümkün olduğuna inanıyorsun. Yakınlığı, sınırların korunduğu yerde hissedersin.",
    strengths:
      "Karşındakinin hayatına ve kararlarına saygı duyarsın; kıskançlıkla değil güvenle bağ kurarsın.",
    watchOut:
      "Alan ihtiyacını açıkça anlatmazsan, mesafen ilgisizlik gibi algılanabilir.",
    goodMatch:
      "Kendi hayatı ve uğraşları olan, yakınlığı kontrol değil paylaşım olarak gören biri.",
    angle: 180,
  },
  kesif: {
    title: "Neşe & Keşif",
    summary:
      "Bir ilişkinin canlı olduğunu, birlikte gülmekten ve yeni şeyler denemekten anlarsın. Rutin değil, merak seni besler.",
    strengths:
      "İlişkiye hayat, mizah ve yenilenme getirirsin.",
    watchOut:
      "Sakin, olaysız dönemler de bir ilişkinin parçası. Durgunluğu sorun sanmamaya dikkat et.",
    goodMatch: "Meraklı, esprili ve hayatı birlikte keşfetmeye açık biri.",
    angle: 240,
  },
  sefkat: {
    title: "Şefkat & İlgi",
    summary:
      "Sevgiyi küçük jestlerde, gösterilen özende ve zor anda yanında olunmasında görürsün. Senin için ilgi, sevginin dilidir.",
    strengths:
      "İnsanlara iyi gelirsin; karşındakinin ihtiyaçlarını sezersin.",
    watchOut:
      "Başkalarına gösterdiğin özeni kendinden esirgeme. İhtiyaçlarını söylemek de ilişkinin parçası.",
    goodMatch: "Sıcak, özenli ve sevgisini davranışlarıyla gösteren biri.",
    angle: 300,
  },
};

export function scoreAnswers(answers: Direction[]): {
  primary: Direction;
  secondary: Direction;
} {
  const counts = Object.fromEntries(
    DIRECTION_ORDER.map((d) => [d, 0]),
  ) as Record<Direction, number>;
  for (const a of answers) counts[a] += 1;

  const ranked = [...DIRECTION_ORDER].sort(
    (a, b) =>
      counts[b] - counts[a] ||
      DIRECTION_ORDER.indexOf(a) - DIRECTION_ORDER.indexOf(b),
  );
  return { primary: ranked[0], secondary: ranked[1] };
}
