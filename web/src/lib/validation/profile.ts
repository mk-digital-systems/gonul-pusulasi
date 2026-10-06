import { z } from "zod";
import { isAtLeastMinimumAge } from "../profile-rules.ts";

const optionalAge = z.preprocess(
  (value) => (value === "" || value === null ? null : Number(value)),
  z.number().int().min(30).nullable(),
);

export const onboardingSchema = z
  .object({
    displayName: z.string().trim().min(2).max(50),
    dateOfBirth: z.string().date(),
    gender: z.enum(["woman", "man"]),
    cityId: z.coerce.number().int().positive(),
    relationshipGoal: z.string().trim().min(1).max(50),
    agePreferenceMin: optionalAge,
    agePreferenceMax: optionalAge,
    birthDateConfirmed: z.literal("on"),
  })
  .superRefine((value, context) => {
    if (!isAtLeastMinimumAge(value.dateOfBirth)) {
      context.addIssue({
        code: "custom",
        path: ["dateOfBirth"],
        message: "Gönül Pusulası yalnızca 30 yaş ve üzeri kullanıcılar içindir.",
      });
    }

    const oneMissing =
      (value.agePreferenceMin === null) !== (value.agePreferenceMax === null);
    if (oneMissing) {
      context.addIssue({
        code: "custom",
        path: ["agePreferenceMin"],
        message: "Yaş aralığının iki sınırını da girin veya ikisini de boş bırakın.",
      });
    }

    if (
      value.agePreferenceMin !== null &&
      value.agePreferenceMax !== null &&
      value.agePreferenceMin > value.agePreferenceMax
    ) {
      context.addIssue({
        code: "custom",
        path: ["agePreferenceMax"],
        message: "En yüksek yaş, en düşük yaştan küçük olamaz.",
      });
    }
  });

export const profileUpdateSchema = z
  .object({
    displayName: z.string().trim().min(2).max(50),
    cityId: z.coerce.number().int().positive(),
    relationshipGoal: z.string().trim().min(1).max(50),
    agePreferenceMin: optionalAge,
    agePreferenceMax: optionalAge,
  })
  .superRefine((value, context) => {
    const oneMissing =
      (value.agePreferenceMin === null) !== (value.agePreferenceMax === null);
    if (oneMissing) {
      context.addIssue({
        code: "custom",
        path: ["agePreferenceMin"],
        message: "Yaş aralığının iki sınırını da girin veya ikisini de boş bırakın.",
      });
    }

    if (
      value.agePreferenceMin !== null &&
      value.agePreferenceMax !== null &&
      value.agePreferenceMin > value.agePreferenceMax
    ) {
      context.addIssue({ code: "custom", path: ["agePreferenceMax"], message: "Geçersiz yaş aralığı." });
    }
  });
