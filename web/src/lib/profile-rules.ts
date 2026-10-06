export const MINIMUM_AGE = 30;

export type AgePreference = {
  min: number | null;
  max: number | null;
};

export function ageOn(dateOfBirth: string | Date, onDate = new Date()): number {
  const birth =
    typeof dateOfBirth === "string"
      ? new Date(`${dateOfBirth}T00:00:00.000Z`)
      : dateOfBirth;

  if (Number.isNaN(birth.getTime())) return Number.NaN;

  let age = onDate.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    onDate.getUTCMonth() < birth.getUTCMonth() ||
    (onDate.getUTCMonth() === birth.getUTCMonth() &&
      onDate.getUTCDate() < birth.getUTCDate());

  if (beforeBirthday) age -= 1;
  return age;
}

export function isAtLeastMinimumAge(
  dateOfBirth: string,
  onDate = new Date(),
): boolean {
  const age = ageOn(dateOfBirth, onDate);
  return Number.isFinite(age) && age >= MINIMUM_AGE;
}

export function defaultAgePreference(age: number): { min: number; max: number } {
  return {
    min: Math.max(MINIMUM_AGE, age - 5),
    max: age + 5,
  };
}

export function effectiveAgePreference(
  age: number,
  preference: AgePreference,
): { min: number; max: number; source: "default" | "exact" } {
  if (preference.min === null && preference.max === null) {
    return { ...defaultAgePreference(age), source: "default" };
  }

  if (preference.min === null || preference.max === null) {
    throw new Error("Yaş aralığının iki sınırı da belirtilmelidir.");
  }

  if (preference.min < MINIMUM_AGE || preference.max < preference.min) {
    throw new Error("Geçersiz yaş aralığı.");
  }

  return { min: preference.min, max: preference.max, source: "exact" };
}

export function maximumBirthDateForMinimumAge(onDate = new Date()): string {
  const date = new Date(
    Date.UTC(
      onDate.getUTCFullYear() - MINIMUM_AGE,
      onDate.getUTCMonth(),
      onDate.getUTCDate(),
    ),
  );
  return date.toISOString().slice(0, 10);
}
