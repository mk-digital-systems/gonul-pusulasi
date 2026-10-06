// Erken erişim formu: tarayıcıda ve sunucuda aynı kurallarla denetlenir.

import { ABROAD_OPTION, CITIES } from "@/lib/cities";
import { BIRTH_YEAR_MAX, BIRTH_YEAR_MIN } from "@/lib/site";

export const GOALS = [
  { value: "evlilik", label: "Evlilik" },
  { value: "uzun-vadeli", label: "Uzun vadeli ilişki" },
  { value: "once-tanisalim", label: "Önce tanışalım, sonra görürüz" },
] as const;

export const GENDERS = [
  { value: "kadin", label: "Kadın" },
  { value: "erkek", label: "Erkek" },
] as const;

export const PLATFORMS = ["ios", "android"] as const;

export type FieldName = "birthYear" | "gender" | "city" | "email" | "goal" | "ageConfirm";
export type FieldErrors = Partial<Record<FieldName, string>>;

export type WaitlistInput = {
  email: string;
  name: string | null;
  birthYear: number;
  gender: (typeof GENDERS)[number]["value"];
  city: string;
  goal: (typeof GOALS)[number]["value"];
  platform: (typeof PLATFORMS)[number] | null;
  nearbyCities: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const VALID_CITIES = new Set<string>([...CITIES, ABROAD_OPTION]);

function str(data: FormData, key: string) {
  const v = data.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function oneOf<T extends string>(value: string, allowed: readonly { value: T }[]): T | null {
  return allowed.find((a) => a.value === value)?.value ?? null;
}

export function parseWaitlistForm(
  data: FormData,
): { ok: true; input: WaitlistInput } | { ok: false; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const birthYear = Number(str(data, "birthYear"));
  if (!Number.isInteger(birthYear) || birthYear < BIRTH_YEAR_MIN || birthYear > BIRTH_YEAR_MAX) {
    errors.birthYear = "Doğum yılını seç.";
  }

  const gender = oneOf(str(data, "gender"), GENDERS);
  if (!gender) errors.gender = "Cinsiyetini seç.";

  const city = str(data, "city");
  if (!VALID_CITIES.has(city)) errors.city = "Şehrini seç.";

  const email = str(data, "email").toLowerCase();
  if (!email) errors.email = "E-posta adresini yaz.";
  else if (email.length > 254 || !EMAIL_RE.test(email)) errors.email = "Geçerli bir e-posta adresi yaz.";

  const goal = oneOf(str(data, "goal"), GOALS);
  if (!goal) errors.goal = "İlişki amacını seç.";

  if (!data.get("ageConfirm")) errors.ageConfirm = "Devam etmek için bu beyanı onaylaman gerekiyor.";

  if (Object.keys(errors).length > 0 || !gender || !goal) return { ok: false, errors };

  const platform = str(data, "platform");
  return {
    ok: true,
    input: {
      email,
      name: str(data, "name").slice(0, 40) || null,
      birthYear,
      gender,
      city,
      goal,
      platform: (PLATFORMS as readonly string[]).includes(platform)
        ? (platform as WaitlistInput["platform"])
        : null,
      nearbyCities: data.get("nearbyCities") != null,
    },
  };
}
