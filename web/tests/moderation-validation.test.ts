import assert from "node:assert/strict";
import test from "node:test";
import {
  moderationQueueFilterSchema,
  manageStaffSchema,
  resolveReportSchema,
  restoreAccountSchema,
  reviewReportSchema,
  suspendAccountSchema,
} from "../src/lib/validation/moderation.ts";

const reportId = "11111111-1111-4111-8111-111111111111";
const targetUserId = "22222222-2222-4222-8222-222222222222";

test("moderasyon filtreleri yalnızca bilinen durumları kabul eder", () => {
  assert.equal(moderationQueueFilterSchema.safeParse("pending").success, true);
  assert.equal(moderationQueueFilterSchema.safeParse("all").success, true);
  assert.equal(moderationQueueFilterSchema.safeParse("unknown").success, false);
});

test("incelemeye alma geçerli şikâyet kimliği gerektirir", () => {
  assert.equal(reviewReportSchema.safeParse({ reportId }).success, true);
  assert.equal(reviewReportSchema.safeParse({ reportId: "gecersiz" }).success, false);
});

test("şikâyet sonucu açıklayıcı not gerektirir", () => {
  assert.equal(resolveReportSchema.safeParse({
    reportId,
    status: "resolved",
    note: "İnceleme tamamlandı ve kayıt kapatıldı.",
  }).success, true);
  assert.equal(resolveReportSchema.safeParse({
    reportId,
    status: "pending",
    note: "Yeterince uzun bir açıklama.",
  }).success, false);
  assert.equal(resolveReportSchema.safeParse({
    reportId,
    status: "dismissed",
    note: "kısa",
  }).success, false);
});

test("askıya alma geçerli şikâyet ve gerekçe gerektirir", () => {
  assert.equal(suspendAccountSchema.safeParse({
    reportId,
    reason: "Manuel inceleme sonucunda hesap askıya alındı.",
  }).success, true);
  assert.equal(suspendAccountSchema.safeParse({ reportId, reason: "kısa" }).success, false);
});

test("geri açma geçerli kullanıcı ve gerekçe gerektirir", () => {
  assert.equal(restoreAccountSchema.safeParse({
    targetUserId,
    reason: "İtiraz incelemesi sonucunda hesap geri açıldı.",
  }).success, true);
  assert.equal(restoreAccountSchema.safeParse({ targetUserId: "x", reason: "yetersiz" }).success, false);
});

test("personel yönetimi UUID, rol ve etkinlik durumunu doğrular", () => {
  const parsed = manageStaffSchema.safeParse({
    userId: targetUserId,
    role: "moderator",
    isActive: "true",
  });

  assert.equal(parsed.success, true);
  if (parsed.success) assert.equal(parsed.data.isActive, true);
  assert.equal(manageStaffSchema.safeParse({
    userId: "gecersiz",
    role: "owner",
    isActive: "yes",
  }).success, false);
});
