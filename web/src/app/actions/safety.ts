"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { reportUserSchema, safetyTargetSchema } from "@/lib/validation/safety";

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item : "";
}

function message(path: string, kind: "hata" | "bildirim", text: string) {
  return `${path}?${kind}=${encodeURIComponent(text)}`;
}

export async function blockUserAction(formData: FormData) {
  await requireUser();
  const parsed = safetyTargetSchema.safeParse({
    targetUserId: value(formData, "targetUserId"),
  });

  if (!parsed.success) {
    redirect(message("/gorusmeler", "hata", "Engellenecek kullanıcı bilgisi geçersiz."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("block_user", {
    p_blocked_user_id: parsed.data.targetUserId,
  });

  if (error) {
    redirect(message("/gorusmeler", "hata", "Kullanıcı engellenemedi. Lütfen tekrar deneyin."));
  }

  revalidatePath("/kesfet");
  revalidatePath("/talepler");
  revalidatePath("/gorusmeler");
  revalidatePath("/engellenenler");
  redirect(message("/gorusmeler", "bildirim", "Kullanıcı engellendi ve aranızdaki açık iletişim kapatıldı."));
}

export async function unblockUserAction(formData: FormData) {
  await requireUser();
  const parsed = safetyTargetSchema.safeParse({
    targetUserId: value(formData, "targetUserId"),
  });

  if (!parsed.success) {
    redirect(message("/engellenenler", "hata", "Engeli kaldırılacak kullanıcı bilgisi geçersiz."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("unblock_user", {
    p_blocked_user_id: parsed.data.targetUserId,
  });

  if (error) {
    redirect(message("/engellenenler", "hata", "Engel kaldırılamadı. Lütfen tekrar deneyin."));
  }

  revalidatePath("/kesfet");
  revalidatePath("/engellenenler");
  redirect(message("/engellenenler", "bildirim", "Kullanıcının engeli kaldırıldı."));
}

export async function reportUserAction(formData: FormData) {
  await requireUser();
  const conversationId = value(formData, "conversationId");
  const parsed = reportUserSchema.safeParse({
    targetUserId: value(formData, "targetUserId"),
    conversationId,
    category: value(formData, "category"),
    details: value(formData, "details"),
  });

  if (!parsed.success) {
    if (!zodUuid(conversationId)) {
      redirect(message("/gorusmeler", "hata", "Görüşme bilgisi geçersiz."));
    }
    redirect(message(
      `/gorusmeler/${conversationId}`,
      "hata",
      parsed.error.issues[0]?.message ?? "Şikâyet bilgilerini kontrol edin.",
    ));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("report_user", {
    p_reported_user_id: parsed.data.targetUserId,
    p_conversation_id: parsed.data.conversationId,
    p_category: parsed.data.category,
    p_details: parsed.data.details || null,
  });

  if (error) {
    redirect(message(
      `/gorusmeler/${parsed.data.conversationId}`,
      "hata",
      "Şikâyet kaydedilemedi. Aynı görüşme için açık bir kaydınız olabilir.",
    ));
  }

  revalidatePath(`/gorusmeler/${parsed.data.conversationId}`);
  redirect(message(
    `/gorusmeler/${parsed.data.conversationId}`,
    "bildirim",
    "Şikâyetiniz inceleme kuyruğuna alındı. Bu işlem otomatik yaptırım oluşturmaz.",
  ));
}

function zodUuid(valueToCheck: string) {
  return safetyTargetSchema.shape.targetUserId.safeParse(valueToCheck).success;
}
