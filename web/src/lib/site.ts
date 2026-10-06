// Önizleme modunda form verileri hiçbir yere gönderilmez.
// Gerçek kayıt için ortam değişkeni: NEXT_PUBLIC_PREVIEW_MODE=false
export const PREVIEW_MODE = process.env.NEXT_PUBLIC_PREVIEW_MODE !== "false";

export const SITE = {
  name: "Gönül Pusulası",
  domain: "gonulpusulasi.com",
  url: "https://gonulpusulasi.com",
  slogan: "Birini değil, sana uyan birini bul.",
  minAge: 30,
};

// Ön kayıt: 1930–1996 (üst yaş sınırı yok; 1930 yazım hatalarını ayıklamak için teknik alt değer)
export const BIRTH_YEAR_MAX = 1996;
export const BIRTH_YEAR_MIN = 1930;

export const BIRTH_YEARS = Array.from(
  { length: BIRTH_YEAR_MAX - BIRTH_YEAR_MIN + 1 },
  (_, i) => BIRTH_YEAR_MAX - i,
);
