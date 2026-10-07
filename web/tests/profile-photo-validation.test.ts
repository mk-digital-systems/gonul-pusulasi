import assert from "node:assert/strict";
import test from "node:test";
import {
  PROFILE_PHOTO_MAX_INPUT_BYTES,
  moderateProfilePhotoSchema,
  profilePhotoModerationFilterSchema,
  validateProfilePhotoFile,
} from "../src/lib/validation/profile-photo.ts";

const userId = "11111111-1111-4111-8111-111111111111";

test("profil fotoğrafı yalnızca desteklenen tür ve boyutu kabul eder", () => {
  assert.equal(validateProfilePhotoFile({ size: 1024, type: "image/jpeg" }), null);
  assert.equal(validateProfilePhotoFile({ size: 1024, type: "image/svg+xml" }) !== null, true);
  assert.equal(validateProfilePhotoFile({
    size: PROFILE_PHOTO_MAX_INPUT_BYTES + 1,
    type: "image/png",
  }) !== null, true);
});

test("fotoğraf moderasyon filtresi yalnızca bilinen durumları kabul eder", () => {
  assert.equal(profilePhotoModerationFilterSchema.safeParse("pending").success, true);
  assert.equal(profilePhotoModerationFilterSchema.safeParse("all").success, true);
  assert.equal(profilePhotoModerationFilterSchema.safeParse("unknown").success, false);
});

test("fotoğraf reddi açıklayıcı gerekçe gerektirir", () => {
  assert.equal(moderateProfilePhotoSchema.safeParse({
    userId,
    status: "approved",
    note: "",
  }).success, true);
  assert.equal(moderateProfilePhotoSchema.safeParse({
    userId,
    status: "approved",
    note: "kısa",
  }).success, false);
  assert.equal(moderateProfilePhotoSchema.safeParse({
    userId,
    status: "rejected",
    note: "kısa",
  }).success, false);
  assert.equal(moderateProfilePhotoSchema.safeParse({
    userId,
    status: "rejected",
    note: "Fotoğraf topluluk kurallarına uygun değil.",
  }).success, true);
});
