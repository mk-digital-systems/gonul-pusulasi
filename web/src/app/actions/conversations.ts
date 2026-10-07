"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";
import { conversationMessageSchema } from "@/lib/validation/conversation";

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
