import { z } from "zod";

export const reportCategorySchema = z.enum([
  "unwanted_contact",
  "harassment",
  "scam",
  "inappropriate_content",
  "false_information",
  "other",
]);

export type ReportCategory = z.infer<typeof reportCategorySchema>;

export const REPORT_CATEGORY_OPTIONS: ReadonlyArray<{
  value: ReportCategory;
  label: string;
}> = [
  { value: "unwanted_contact", label: "İstenmeyen veya rahatsız edici iletişim" },
  { value: "harassment", label: "Taciz, tehdit veya hakaret" },
  { value: "scam", label: "Dolandırıcılık veya para talebi" },
  { value: "inappropriate_content", label: "Uygunsuz içerik" },
  { value: "false_information", label: "Yanlış profil bilgisi" },
  { value: "other", label: "Diğer" },
];

export const safetyTargetSchema = z.object({
  targetUserId: z.string().uuid(),
});

export const reportUserSchema = safetyTargetSchema.extend({
  conversationId: z.string().uuid(),
  category: reportCategorySchema,
  details: z
    .string()
    .trim()
    .max(1000, "Şikâyet açıklaması en fazla 1000 karakter olabilir.")
    .refine(
      (value) => value.length === 0 || value.length >= 10,
      "Şikâyet açıklaması yazılırsa en az 10 karakter olmalıdır.",
    ),
});
