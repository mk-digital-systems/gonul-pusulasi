"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import {
  manageStaffSchema,
  resolveReportSchema,
  restoreAccountSchema,
  reviewReportSchema,
  suspendAccountSchema,
} from "@/lib/validation/moderation";

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item : "";
}

function message(kind: "hata" | "bildirim", text: string) {
  return `/yonetim/sikayetler?${kind}=${encodeURIComponent(text)}`;
}

function staffMessage(kind: "hata" | "bildirim", text: string) {
  return `/yonetim/ekip?${kind}=${encodeURIComponent(text)}`;
}

export async function startReportReviewAction(formData: FormData) {
  await requireUser();
  const parsed = reviewReportSchema.safeParse({ reportId: value(formData, "reportId") });

  if (!parsed.success) {
    redirect(message("hata", "Şikâyet bilgisi geçersiz."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_moderation_report", {
    p_report_id: parsed.data.reportId,
    p_status: "reviewing",
    p_resolution_note: null,
  });

  if (error) {
    redirect(message("hata", "Şikâyet incelemeye alınamadı."));
  }

  revalidatePath("/yonetim/sikayetler");
  redirect(message("bildirim", "Şikâyet incelemeye alındı."));
}

export async function resolveReportAction(formData: FormData) {
  await requireUser();
  const parsed = resolveReportSchema.safeParse({
    reportId: value(formData, "reportId"),
    status: value(formData, "status"),
    note: value(formData, "note"),
  });

  if (!parsed.success) {
    redirect(message("hata", parsed.error.issues[0]?.message ?? "Moderasyon sonucunu kontrol edin."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_moderation_report", {
    p_report_id: parsed.data.reportId,
    p_status: parsed.data.status,
    p_resolution_note: parsed.data.note,
  });

  if (error) {
    redirect(message("hata", "Şikâyet sonuçlandırılamadı."));
  }

  revalidatePath("/yonetim/sikayetler");
  redirect(message("bildirim", parsed.data.status === "resolved" ? "Şikâyet çözüldü." : "Şikâyet reddedildi."));
}

export async function suspendUserForReportAction(formData: FormData) {
  await requireUser();
  const parsed = suspendAccountSchema.safeParse({
    reportId: value(formData, "reportId"),
    reason: value(formData, "reason"),
  });

  if (!parsed.success) {
    redirect(message("hata", parsed.error.issues[0]?.message ?? "Askıya alma gerekçesini kontrol edin."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("suspend_user_for_report", {
    p_report_id: parsed.data.reportId,
    p_reason: parsed.data.reason,
  });

  if (error) {
    redirect(message("hata", "Hesap askıya alınamadı. Yetki ve hesap durumunu kontrol edin."));
  }

  revalidatePath("/kesfet");
  revalidatePath("/gorusmeler");
  revalidatePath("/talepler");
  revalidatePath("/yonetim/sikayetler");
  redirect(message("bildirim", "Hesap manuel moderasyon kararıyla askıya alındı."));
}

export async function restoreSuspendedUserAction(formData: FormData) {
  await requireUser();
  const parsed = restoreAccountSchema.safeParse({
    targetUserId: value(formData, "targetUserId"),
    reason: value(formData, "reason"),
  });

  if (!parsed.success) {
    redirect(message("hata", parsed.error.issues[0]?.message ?? "Geri açma gerekçesini kontrol edin."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("restore_suspended_user", {
    p_user_id: parsed.data.targetUserId,
    p_reason: parsed.data.reason,
  });

  if (error) {
    redirect(message("hata", "Hesap geri açılamadı. Yetki ve hesap durumunu kontrol edin."));
  }

  revalidatePath("/kesfet");
  revalidatePath("/yonetim/sikayetler");
  redirect(message("bildirim", "Askıdaki hesap önceki durumuna geri açıldı."));
}

export async function manageModerationStaffAction(formData: FormData) {
  await requireUser();
  const parsed = manageStaffSchema.safeParse({
    userId: value(formData, "userId"),
    role: value(formData, "role"),
    isActive: value(formData, "isActive"),
  });

  if (!parsed.success) {
    redirect(staffMessage("hata", parsed.error.issues[0]?.message ?? "Personel bilgilerini kontrol edin."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("manage_moderation_staff", {
    p_user_id: parsed.data.userId,
    p_role: parsed.data.role,
    p_is_active: parsed.data.isActive,
  });

  if (error) {
    redirect(staffMessage("hata", "Personel yetkisi güncellenemedi. UUID, hesap durumu ve admin sınırlarını kontrol edin."));
  }

  revalidatePath("/yonetim/ekip");
  revalidatePath("/yonetim/sikayetler");
  redirect(staffMessage("bildirim", "Moderasyon personeli güncellendi."));
}
