import assert from "node:assert/strict";
import test from "node:test";
import {
  reportUserSchema,
  safetyTargetSchema,
} from "../src/lib/validation/safety.ts";

const targetUserId = "11111111-1111-4111-8111-111111111111";
const conversationId = "22222222-2222-4222-8222-222222222222";

test("engelleme geçerli kullanıcı kimliği gerektirir", () => {
  assert.equal(safetyTargetSchema.safeParse({ targetUserId }).success, true);
  assert.equal(safetyTargetSchema.safeParse({ targetUserId: "gecersiz" }).success, false);
});

test("şikâyet geçerli kategori ve görüşme kimliği kabul eder", () => {
  assert.equal(reportUserSchema.safeParse({
    targetUserId,
    conversationId,
    category: "harassment",
    details: "Rahatsız edici mesajlar gönderildi.",
  }).success, true);
});

test("şikâyet açıklaması isteğe bağlıdır", () => {
  const result = reportUserSchema.safeParse({
    targetUserId,
    conversationId,
    category: "scam",
    details: "",
  });
  assert.equal(result.success, true);
});

test("bilinmeyen şikâyet kategorisi reddedilir", () => {
  assert.equal(reportUserSchema.safeParse({
    targetUserId,
    conversationId,
    category: "unknown",
    details: "",
  }).success, false);
});

test("çok kısa ve 1000 karakteri aşan açıklama reddedilir", () => {
  assert.equal(reportUserSchema.safeParse({
    targetUserId,
    conversationId,
    category: "other",
    details: "kısa",
  }).success, false);
  assert.equal(reportUserSchema.safeParse({
    targetUserId,
    conversationId,
    category: "other",
    details: "a".repeat(1001),
  }).success, false);
});
