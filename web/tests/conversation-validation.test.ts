import assert from "node:assert/strict";
import test from "node:test";
import {
  conversationIdSchema,
  conversationMessageSchema,
  MESSAGE_MAX_LENGTH,
} from "../src/lib/validation/conversation.ts";

const conversationId = "50000000-0000-4000-8000-000000000001";

test("geçerli görüşme kimliği kabul edilir", () => {
  assert.equal(conversationIdSchema.safeParse(conversationId).success, true);
  assert.equal(conversationIdSchema.safeParse("gecersiz").success, false);
});

test("mesajın başındaki ve sonundaki boşluklar temizlenir", () => {
  const result = conversationMessageSchema.safeParse({
    conversationId,
    body: "  Merhaba, tanıştığımıza sevindim.  ",
  });

  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.body, "Merhaba, tanıştığımıza sevindim.");
});

test("boş ve sınırı aşan mesaj reddedilir", () => {
  assert.equal(conversationMessageSchema.safeParse({ conversationId, body: "   " }).success, false);
  assert.equal(
    conversationMessageSchema.safeParse({
      conversationId,
      body: "a".repeat(MESSAGE_MAX_LENGTH + 1),
    }).success,
    false,
  );
});
