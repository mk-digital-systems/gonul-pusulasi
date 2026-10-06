import { z } from "zod";

const email = z
  .string()
  .trim()
  .email("Geçerli bir e-posta adresi girin.")
  .max(254, "E-posta adresi çok uzun.");

const password = z
  .string()
  .min(10, "Şifre en az 10 karakter olmalı.")
  .max(72, "Şifre en fazla 72 karakter olabilir.")
  .regex(/[A-Za-zÇĞİÖŞÜçğıöşü]/, "Şifre en az bir harf içermeli.")
  .regex(/[0-9]/, "Şifre en az bir rakam içermeli.");

export const signUpSchema = z
  .object({
    email,
    password,
    passwordConfirm: z.string(),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: "Şifreler aynı olmalı.",
    path: ["passwordConfirm"],
  });

export const signInSchema = z.object({ email, password: z.string().min(1) });
export const resetRequestSchema = z.object({ email });
export const updatePasswordSchema = z
  .object({ password, passwordConfirm: z.string() })
  .refine((value) => value.password === value.passwordConfirm, {
    message: "Şifreler aynı olmalı.",
    path: ["passwordConfirm"],
  });
