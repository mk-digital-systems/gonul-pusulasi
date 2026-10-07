import { z } from "zod";

const noteSchema = z
  .string()
  .trim()
  .min(10, "Moderasyon notu en az 10 karakter olmalıdır.")
  .max(1000, "Moderasyon notu en fazla 1000 karakter olabilir.");

export const moderationStatusSchema = z.enum([
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
]);

export const moderationQueueFilterSchema = z.enum([
  "all",
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
]);

export const reviewReportSchema = z.object({
  reportId: z.string().uuid(),
});

export const resolveReportSchema = reviewReportSchema.extend({
  status: z.enum(["resolved", "dismissed"]),
  note: noteSchema,
});

export const suspendAccountSchema = reviewReportSchema.extend({
  reason: noteSchema,
});

export const restoreAccountSchema = z.object({
  targetUserId: z.string().uuid(),
  reason: noteSchema,
});
