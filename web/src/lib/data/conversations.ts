import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ConversationStatus = "pre_meeting" | "decision_window" | "active" | "ended";

export type ConversationSummary = {
  conversation_id: string;
  other_user_id: string;
  other_display_name: string;
  conversation_status: ConversationStatus;
  started_at: string;
  pre_meeting_expires_at: string;
  ended_at: string | null;
  last_message_preview: string | null;
  last_message_at: string | null;
  message_count: number;
};

export type ConversationDetails = Pick<
  ConversationSummary,
  | "conversation_id"
  | "other_user_id"
  | "other_display_name"
  | "conversation_status"
  | "started_at"
  | "pre_meeting_expires_at"
  | "ended_at"
>;

export type ConversationMessage = {
  message_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type ConversationProgress = {
  conversation_id: string;
  conversation_status: ConversationStatus;
  my_confirmed: boolean;
  mutual_confirmed: boolean;
};

export type MatchCooldown = {
  conversation_id: string;
  starts_at: string;
  ends_at: string;
  reason: "active_match_ended";
};

export async function getMyMatchCooldown() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_match_cooldown");

  if (error) {
    throw new Error("Tanışma bekleme durumu yüklenemedi. 0007 migrationını kontrol edin.");
  }

  return (data?.[0] ?? null) as MatchCooldown | null;
}

export async function getMyConversations() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_conversations");

  if (error) {
    throw new Error("Görüşmeler yüklenemedi. 0005 migrationını kontrol edin.");
  }

  return (data ?? []) as ConversationSummary[];
}

export async function getConversation(conversationId: string) {
  const supabase = await createClient();
  const detailsResult = await supabase.rpc("get_conversation_details", {
    p_conversation_id: conversationId,
  });

  if (detailsResult.error) {
    throw new Error("Görüşme bilgileri yüklenemedi. 0005 migrationını kontrol edin.");
  }

  const details = (detailsResult.data?.[0] ?? null) as ConversationDetails | null;
  if (!details) return null;

  const [messagesResult, progressResult] = await Promise.all([
    supabase.rpc("get_conversation_messages", {
      p_conversation_id: conversationId,
      p_limit: 100,
    }),
    supabase.rpc("get_conversation_progress", {
      p_conversation_id: conversationId,
    }),
  ]);

  if (messagesResult.error || progressResult.error) {
    throw new Error("Görüşme mesajları veya devam durumu yüklenemedi.");
  }

  return {
    details,
    messages: (messagesResult.data ?? []) as ConversationMessage[],
    progress: (progressResult.data?.[0] ?? null) as ConversationProgress | null,
  };
}
