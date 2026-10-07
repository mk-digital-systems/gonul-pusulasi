"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { requireUser } from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, profileUpdateSchema } from "@/lib/validation/profile";
import { validateProfilePhotoFile } from "@/lib/validation/profile-photo";

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

export async function uploadProfilePhotoAction(formData: FormData) {
  const user = await requireUser();
  const file = formData.get("photo");

  if (!(file instanceof File)) {
    redirect(message("/profil", "hata", "Yüklenecek fotoğrafı seçin."));
  }

  const validationError = validateProfilePhotoFile(file);
  if (validationError) redirect(message("/profil", "hata", validationError));

  let processed: { data: Buffer; info: { size: number; width: number; height: number } };
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(input, {
      failOn: "error",
      limitInputPixels: 40_000_000,
    }).metadata();

    if (
      !metadata.format ||
      !["jpeg", "png", "webp"].includes(metadata.format) ||
      (metadata.pages ?? 1) !== 1 ||
      !metadata.width ||
      !metadata.height ||
      Math.min(metadata.width, metadata.height) < 400
    ) {
      redirect(message("/profil", "hata", "Fotoğraf en az 400×400 piksel ve tek kare olmalıdır."));
    }

    processed = await sharp(input, {
      failOn: "error",
      limitInputPixels: 40_000_000,
    })
      .autoOrient()
      .resize(1024, 1024, { fit: "cover", position: "centre" })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect(message("/profil", "hata", "Fotoğraf güvenli biçimde işlenemedi."));
  }

  if (processed.info.size > 2 * 1024 * 1024) {
    redirect(message("/profil", "hata", "İşlenmiş fotoğraf boyutu sınırı aşıyor."));
  }

  const supabase = await createClient();
  const { data: oldPhoto } = await supabase
    .from("profile_photos")
    .select("object_path")
    .maybeSingle();

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    redirect(message("/profil", "hata", "Fotoğraf servisi henüz yapılandırılmadı."));
  }

  const objectPath = `${user.id}/${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await admin.storage
    .from("profile-photos")
    .upload(objectPath, processed.data, {
      contentType: "image/webp",
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    redirect(message("/profil", "hata", "Fotoğraf özel depolama alanına yüklenemedi."));
  }

  const { error: submitError } = await supabase.rpc("submit_my_profile_photo", {
    p_object_path: objectPath,
    p_byte_size: processed.info.size,
    p_width: processed.info.width,
    p_height: processed.info.height,
  });

  if (submitError) {
    await admin.storage.from("profile-photos").remove([objectPath]);
    redirect(message("/profil", "hata", "Fotoğraf moderasyon kuyruğuna gönderilemedi."));
  }

  if (oldPhoto?.object_path && oldPhoto.object_path !== objectPath) {
    await admin.storage.from("profile-photos").remove([oldPhoto.object_path]);
  }

  revalidatePath("/profil");
  revalidatePath("/kesfet");
  revalidatePath("/yonetim/fotograflar");
  redirect(message("/profil", "bildirim", "Fotoğraf yüklendi ve moderasyon incelemesine gönderildi."));
}

export async function deleteProfilePhotoAction() {
  await requireUser();
  const supabase = await createClient();
  const { data: objectPath, error } = await supabase.rpc("remove_my_profile_photo");

  if (error) redirect(message("/profil", "hata", "Fotoğraf kaydı silinemedi."));

  if (typeof objectPath === "string" && objectPath) {
    try {
      const admin = createAdminClient();
      await admin.storage.from("profile-photos").remove([objectPath]);
    } catch {
      // Veritabanı kaydı silindiği için nesne artık hiçbir kullanıcıya sunulamaz.
      // Depolama temizliği teknik bakım sırasında güvenle tekrar edilebilir.
    }
  }

  revalidatePath("/profil");
  revalidatePath("/kesfet");
  revalidatePath("/yonetim/fotograflar");
  redirect(message("/profil", "bildirim", "Profil fotoğrafı kaldırıldı."));
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
