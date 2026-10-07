import { z } from "zod";

export const MESSAGE_MAX_LENGTH = 2000;

export const conversationIdSchema = z.string().uuid();

export const conversationMessageSchema = z.object({
  conversationId: conversationIdSchema,
  body: z
    .string()
    .trim()
    .min(1, "Mesaj boş olamaz.")
    .max(MESSAGE_MAX_LENGTH, `Mesaj en fazla ${MESSAGE_MAX_LENGTH} karakter olabilir.`),
});
