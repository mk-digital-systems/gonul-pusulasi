"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, profileUpdateSchema } from "@/lib/validation/profile";

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item : "";
}

function message(path: string, kind: "hata" | "bildirim", text: string) {
  return `${path}?${kind}=${encodeURIComponent(text)}`;
}

export async function completeOnboardingAction(formData: FormData) {
  await requireUser();
  const parsed = onboardingSchema.safeParse({
    displayName: value(formData, "displayName"),
    dateOfBirth: value(formData, "dateOfBirth"),
    gender: value(formData, "gender"),
    cityId: value(formData, "cityId"),
    relationshipGoal: value(formData, "relationshipGoal"),
    agePreferenceMin: value(formData, "agePreferenceMin"),
    agePreferenceMax: value(formData, "agePreferenceMax"),
    birthDateConfirmed: value(formData, "birthDateConfirmed"),
  });

  if (!parsed.success) {
    redirect(message("/onboarding", "hata", parsed.error.issues[0]?.message ?? "Bilgileri kontrol edin."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_onboarding", {
    p_display_name: parsed.data.displayName,
    p_date_of_birth: parsed.data.dateOfBirth,
    p_gender: parsed.data.gender,
    p_city_id: parsed.data.cityId,
    p_relationship_goal_code: parsed.data.relationshipGoal,
    p_age_preference_min: parsed.data.agePreferenceMin,
    p_age_preference_max: parsed.data.agePreferenceMax,
  });

  if (error) {
    redirect(message("/onboarding", "hata", "Profil tamamlanamadı. Bilgileri kontrol edip yeniden deneyin."));
  }

  revalidatePath("/hesabim");
  redirect(message("/hesabim", "bildirim", "Profiliniz tamamlandı."));
}

export async function updateProfileAction(formData: FormData) {
  await requireUser();
  const parsed = profileUpdateSchema.safeParse({
    displayName: value(formData, "displayName"),
    cityId: value(formData, "cityId"),
    relationshipGoal: value(formData, "relationshipGoal"),
    agePreferenceMin: value(formData, "agePreferenceMin"),
    agePreferenceMax: value(formData, "agePreferenceMax"),
  });

  if (!parsed.success) {
    redirect(message("/profil", "hata", parsed.error.issues[0]?.message ?? "Bilgileri kontrol edin."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_my_profile", {
    p_display_name: parsed.data.displayName,
    p_city_id: parsed.data.cityId,
    p_relationship_goal_code: parsed.data.relationshipGoal,
    p_age_preference_min: parsed.data.agePreferenceMin,
    p_age_preference_max: parsed.data.agePreferenceMax,
  });

  if (error) redirect(message("/profil", "hata", "Profil güncellenemedi."));
  revalidatePath("/hesabim");
  revalidatePath("/profil");
  redirect(message("/profil", "bildirim", "Profiliniz güncellendi."));
}

export async function pauseAccountAction() {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("pause_my_account");
  if (error) redirect(message("/hesabim", "hata", "Hesap duraklatılamadı."));
  revalidatePath("/hesabim");
  redirect(message("/hesabim", "bildirim", "Hesabınız duraklatıldı."));
}

export async function resumeAccountAction() {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("resume_my_account");
  if (error) redirect(message("/hesabim", "hata", "Hesap yeniden etkinleştirilemedi."));
  revalidatePath("/hesabim");
  redirect(message("/hesabim", "bildirim", "Hesabınız yeniden etkinleştirildi."));
}

export async function requestAccountDeletionAction(formData: FormData) {
  await requireUser();
  if (value(formData, "confirmation") !== "HESABIMI SİL") {
    redirect(message("/hesabim", "hata", "Silme talebi için onay metnini eksiksiz yazın."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_my_account_deletion");
  if (error) redirect(message("/hesabim", "hata", "Hesap silme talebi oluşturulamadı."));

  await supabase.auth.signOut();
  redirect(message("/giris", "bildirim", "Hesap silme talebiniz alındı ve oturumunuz kapatıldı."));
}
