"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/supabase/env";
import {
  resetRequestSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/lib/validation/auth";

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item : "";
}

function firstError(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Bilgileri kontrol edip yeniden deneyin.";
}

function withMessage(path: string, key: "hata" | "bildirim", message: string) {
  return `${path}?${key}=${encodeURIComponent(message)}`;
}

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    email: value(formData, "email"),
    password: value(formData, "password"),
    passwordConfirm: value(formData, "passwordConfirm"),
  });

  if (!parsed.success) redirect(withMessage("/kayit", "hata", firstError(parsed.error)));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${getSiteUrl()}/auth/callback/signup` },
  });

  if (error) {
    redirect(withMessage("/kayit", "hata", "Kayıt tamamlanamadı. Bilgilerinizi kontrol edip yeniden deneyin."));
  }

  if (data.session) redirect("/onboarding");
  redirect(`/kayit/eposta-gonderildi?email=${encodeURIComponent(parsed.data.email)}`);
}

export async function signInAction(formData: FormData) {
  const parsed = signInSchema.safeParse({
    email: value(formData, "email"),
    password: value(formData, "password"),
  });

  if (!parsed.success) redirect(withMessage("/giris", "hata", "E-posta ve şifrenizi kontrol edin."));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error?.code === "email_not_confirmed") {
    redirect(withMessage("/giris", "hata", "Giriş yapmadan önce e-posta adresinizi doğrulayın."));
  }

  if (error || !data.user) {
    redirect(withMessage("/giris", "hata", "E-posta veya şifre hatalı."));
  }

  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    redirect(withMessage("/giris", "hata", "Giriş yapmadan önce e-posta adresinizi doğrulayın."));
  }

  redirect("/hesabim");
}

export async function resendVerificationAction(formData: FormData) {
  const parsed = resetRequestSchema.safeParse({ email: value(formData, "email") });
  if (!parsed.success) redirect(withMessage("/kayit", "hata", firstError(parsed.error)));

  const supabase = await createClient();
  await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: `${getSiteUrl()}/auth/callback/signup` },
  });

  redirect(
    `/kayit/eposta-gonderildi?email=${encodeURIComponent(parsed.data.email)}&bildirim=${encodeURIComponent("Doğrulama e-postası yeniden istendi.")}`,
  );
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(withMessage("/giris", "bildirim", "Oturumunuz kapatıldı."));
}

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = resetRequestSchema.safeParse({ email: value(formData, "email") });
  if (!parsed.success) redirect(withMessage("/sifremi-unuttum", "hata", firstError(parsed.error)));

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getSiteUrl()}/auth/callback/recovery`,
  });

  // Hesap varlığını açığa çıkarmayan genel yanıt.
  redirect(withMessage("/sifremi-unuttum", "bildirim", "Bu adresle bir hesap varsa şifre yenileme bağlantısı gönderildi."));
}

export async function updatePasswordAction(formData: FormData) {
  const parsed = updatePasswordSchema.safeParse({
    password: value(formData, "password"),
    passwordConfirm: value(formData, "passwordConfirm"),
  });
  if (!parsed.success) redirect(withMessage("/sifre-yenile", "hata", firstError(parsed.error)));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(withMessage("/sifremi-unuttum", "hata", "Yenileme bağlantısı geçersiz veya süresi dolmuş."));

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) redirect(withMessage("/sifre-yenile", "hata", "Şifre güncellenemedi. Yeni bir bağlantı isteyin."));

  await supabase.auth.signOut();
  redirect(withMessage("/giris", "bildirim", "Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz."));
}
