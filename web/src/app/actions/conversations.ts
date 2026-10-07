"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import {
  conversationMessageSchema,
  conversationProgressSchema,
  endActiveConversationSchema,
} from "@/lib/validation/conversation";

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item : "";
}

function conversationPath(conversationId: string, kind: "hata" | "bildirim", text: string) {
  return `/gorusmeler/${conversationId}?${kind}=${encodeURIComponent(text)}`;
}

export async function sendConversationMessageAction(formData: FormData) {
  await requireUser();
  const parsed = conversationMessageSchema.safeParse({
    conversationId: value(formData, "conversationId"),
    body: value(formData, "body"),
  });

  if (!parsed.success) {
    const conversationId = value(formData, "conversationId");
    if (!conversationMessageSchema.shape.conversationId.safeParse(conversationId).success) {
      redirect("/gorusmeler?hata=G%C3%B6r%C3%BC%C5%9Fme+bilgisi+ge%C3%A7ersiz.");
    }
    redirect(conversationPath(
      conversationId,
      "hata",
      parsed.error.issues[0]?.message ?? "Mesajı kontrol edin.",
    ));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("send_conversation_message", {
    p_conversation_id: parsed.data.conversationId,
    p_body: parsed.data.body,
  });

  if (error) {
    redirect(conversationPath(
      parsed.data.conversationId,
      "hata",
      "Mesaj gönderilemedi. Görüşmenin süresi dolmuş veya hesaplardan biri etkin olmayabilir.",
    ));
  }

  revalidatePath("/gorusmeler");
  revalidatePath(`/gorusmeler/${parsed.data.conversationId}`);
  redirect(conversationPath(parsed.data.conversationId, "bildirim", "Mesajınız gönderildi."));
}

export async function confirmConversationProgressAction(formData: FormData) {
  await requireUser();
  const parsed = conversationProgressSchema.safeParse({
    conversationId: value(formData, "conversationId"),
  });

  if (!parsed.success) {
    redirect("/gorusmeler?hata=G%C3%B6r%C3%BC%C5%9Fme+bilgisi+ge%C3%A7ersiz.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("confirm_conversation_progress", {
    p_conversation_id: parsed.data.conversationId,
  });

  if (error) {
    redirect(conversationPath(
      parsed.data.conversationId,
      "hata",
      "Devam kararınız kaydedilemedi. Görüşmenin süresi dolmuş olabilir.",
    ));
  }

  revalidatePath("/kesfet");
  revalidatePath("/talepler");
  revalidatePath("/gorusmeler");
  revalidatePath(`/gorusmeler/${parsed.data.conversationId}`);
  const notice = data === "active"
    ? "Karşılıklı onay tamamlandı. Aktif tanışmanız başladı."
    : "Devam kararınız kaydedildi. Karşı tarafın onayı bekleniyor.";
  redirect(conversationPath(parsed.data.conversationId, "bildirim", notice));
}

export async function endActiveConversationAction(formData: FormData) {
  await requireUser();
  const parsed = endActiveConversationSchema.safeParse({
    conversationId: value(formData, "conversationId"),
  });

  if (!parsed.success) {
    redirect("/gorusmeler?hata=G%C3%B6r%C3%BC%C5%9Fme+bilgisi+ge%C3%A7ersiz.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("end_active_conversation", {
    p_conversation_id: parsed.data.conversationId,
  });

  if (error) {
    redirect(conversationPath(
      parsed.data.conversationId,
      "hata",
      "Aktif tanışma sonlandırılamadı. Görüşme durumunu yeniden kontrol edin.",
    ));
  }

  revalidatePath("/kesfet");
  revalidatePath("/talepler");
  revalidatePath("/gorusmeler");
  revalidatePath(`/gorusmeler/${parsed.data.conversationId}`);
  redirect("/gorusmeler?bildirim=Aktif+tan%C4%B1%C5%9Fma+sonland%C4%B1r%C4%B1ld%C4%B1.+24+saatlik+bekleme+ba%C5%9Flad%C4%B1.");
}
