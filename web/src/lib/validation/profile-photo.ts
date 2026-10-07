import { z } from "zod";

export const PROFILE_PHOTO_MAX_INPUT_BYTES = 8 * 1024 * 1024;
export const PROFILE_PHOTO_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function validateProfilePhotoFile(file: { size: number; type: string }) {
  if (!PROFILE_PHOTO_ALLOWED_TYPES.includes(file.type as (typeof PROFILE_PHOTO_ALLOWED_TYPES)[number])) {
    return "Yalnızca JPEG, PNG veya WebP fotoğraf yükleyebilirsiniz.";
  }
  if (file.size < 1 || file.size > PROFILE_PHOTO_MAX_INPUT_BYTES) {
    return "Fotoğraf en fazla 8 MB olabilir.";
  }
  return null;
}

export const profilePhotoModerationFilterSchema = z.enum([
  "all",
  "pending",
  "approved",
  "rejected",
]);

export const moderateProfilePhotoSchema = z
  .object({
    userId: z.string().uuid(),
    status: z.enum(["approved", "rejected"]),
    note: z.string().trim().max(1000, "Moderasyon notu en fazla 1000 karakter olabilir."),
  })
  .superRefine((value, context) => {
    if (value.note.length > 0 && value.note.length < 10) {
      context.addIssue({
        code: "custom",
        path: ["note"],
        message: "Moderasyon notu en az 10 karakter olmalıdır.",
      });
    }

    if (value.status === "rejected" && value.note.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["note"],
        message: "Ret gerekçesi en az 10 karakter olmalıdır.",
      });
    }
  });
