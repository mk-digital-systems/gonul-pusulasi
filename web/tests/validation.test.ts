import assert from "node:assert/strict";
import test from "node:test";
import { signUpSchema } from "../src/lib/validation/auth.ts";
import { onboardingSchema } from "../src/lib/validation/profile.ts";

function yearsAgo(years: number) {
  const today = new Date();
  const date = new Date(Date.UTC(today.getUTCFullYear() - years, today.getUTCMonth(), today.getUTCDate()));
  return date.toISOString().slice(0, 10);
}

test("kayıt şifresi uzunluk, harf, rakam ve tekrar kurallarını uygular", () => {
  assert.equal(
    signUpSchema.safeParse({
      email: "uye@example.com",
      password: "guvenli1234",
      passwordConfirm: "guvenli1234",
    }).success,
    true,
  );
  assert.equal(
    signUpSchema.safeParse({
      email: "uye@example.com",
      password: "yalnizcaharf",
      passwordConfirm: "farkli1234",
    }).success,
    false,
  );
});

test("onboarding 30 yaş altı doğum tarihini reddeder", () => {
  const result = onboardingSchema.safeParse({
    displayName: "Deneme",
    dateOfBirth: yearsAgo(20),
    gender: "woman",
    cityId: "14",
    relationshipGoal: "long_term_relationship",
    agePreferenceMin: "",
    agePreferenceMax: "",
    birthDateConfirmed: "on",
  });
  assert.equal(result.success, false);
});

test("onboarding kesin yaş aralığını aynen kabul eder", () => {
  const result = onboardingSchema.safeParse({
    displayName: "Deneme",
    dateOfBirth: yearsAgo(40),
    gender: "man",
    cityId: "34",
    relationshipGoal: "marriage",
    agePreferenceMin: "36",
    agePreferenceMax: "43",
    birthDateConfirmed: "on",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.agePreferenceMin, 36);
    assert.equal(result.data.agePreferenceMax, 43);
  }
});

test("onboarding yarım yaş aralığını reddeder", () => {
  const result = onboardingSchema.safeParse({
    displayName: "Deneme",
    dateOfBirth: yearsAgo(40),
    gender: "man",
    cityId: "34",
    relationshipGoal: "marriage",
    agePreferenceMin: "36",
    agePreferenceMax: "",
    birthDateConfirmed: "on",
  });
  assert.equal(result.success, false);
});
