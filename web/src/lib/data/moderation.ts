import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ReportCategory } from "@/lib/validation/safety";

export type StaffRole = "moderator" | "admin";
export type ModerationReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

export type ModerationReport = {
  report_id: string;
  reporter_user_id: string | null;
  reporter_display_name: string | null;
  reported_user_id: string | null;
  reported_display_name: string | null;
  reported_account_status: "active" | "paused" | "deletion_requested" | "suspended" | null;
  conversation_id: string | null;
  category: ReportCategory;
  details: string | null;
  report_status: ModerationReportStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
  resolution_note: string | null;
};

type ModerationReportContextRow = {
  report_id: string;
  reporter_display_name: string | null;
  reported_display_name: string | null;
  reported_account_status: ModerationReport["reported_account_status"];
  conversation_id: string | null;
  category: ReportCategory;
  details: string | null;
  report_status: ModerationReportStatus;
  created_at: string;
  reviewed_at: string | null;
  resolution_note: string | null;
  request_id: string | null;
  answering_user_id: string | null;
  answering_display_name: string | null;
  question_prompt: string | null;
  answer_text: string | null;
  answer_display_order: number | null;
};

export type ModerationReportContext = {
  report: Omit<
    ModerationReportContextRow,
    | "answering_user_id"
    | "answering_display_name"
    | "question_prompt"
    | "answer_text"
    | "answer_display_order"
  >;
  doorAnswers: Array<{
    answeringUserId: string;
    answeringDisplayName: string | null;
    prompt: string;
    answer: string;
    displayOrder: number;
  }>;
};

export type ModerationActionLogItem = {
  action_id: string;
  staff_user_id: string | null;
  staff_display_name: string | null;
  target_user_id: string | null;
  target_display_name: string | null;
  report_id: string | null;
  action: "account_suspended" | "account_restored";
  previous_status: string;
  new_status: string;
  reason: string;
  created_at: string;
};

export type ModerationStaffMember = {
  user_id: string;
  display_name: string | null;
  role: StaffRole;
  is_active: boolean;
  created_by_user_id: string | null;
  created_by_display_name: string | null;
  created_at: string;
  updated_at: string;
};

export type ModerationProfilePhoto = {
  user_id: string;
  display_name: string | null;
  object_path: string;
  byte_size: number;
  width: number;
  height: number;
  photo_status: "pending" | "approved" | "rejected";
  uploaded_at: string;
  reviewed_at: string | null;
  reviewed_by_user_id: string | null;
  moderation_note: string | null;
};

export async function getMyStaffRole() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_staff_role");

  // Yönetim migrationı henüz uygulanmadıysa kullanıcı tarafındaki sayfaları
  // kesintiye uğratma; yalnızca yönetim bağlantısını gizle.
  if (error) return null;

  return (data ?? null) as StaffRole | null;
}

export async function getModerationReports(status: ModerationReportStatus | null) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_moderation_reports", {
    p_status: status,
    p_limit: 100,
  });

  if (error) {
    throw new Error("Moderasyon kuyruğu yüklenemedi. 0011 migrationını ve personel rolünü kontrol edin.");
  }

  return (data ?? []) as ModerationReport[];
}

export async function getModerationReportContext(
  reportId: string,
): Promise<ModerationReportContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_moderation_report_context", {
    p_report_id: reportId,
  });

  if (error) {
    throw new Error("Şikâyet bağlamı yüklenemedi. 0012 migrationını ve personel rolünü kontrol edin.");
  }

  const rows = (data ?? []) as ModerationReportContextRow[];
  const first = rows[0];
  if (!first) return null;

  const report = {
    report_id: first.report_id,
    reporter_display_name: first.reporter_display_name,
    reported_display_name: first.reported_display_name,
    reported_account_status: first.reported_account_status,
    conversation_id: first.conversation_id,
    category: first.category,
    details: first.details,
    report_status: first.report_status,
    created_at: first.created_at,
    reviewed_at: first.reviewed_at,
    resolution_note: first.resolution_note,
    request_id: first.request_id,
  };

  return {
    report,
    doorAnswers: rows.flatMap((row) => {
      if (
        !row.answering_user_id ||
        !row.question_prompt ||
        !row.answer_text ||
        row.answer_display_order === null
      ) {
        return [];
      }

      return [{
        answeringUserId: row.answering_user_id,
        answeringDisplayName: row.answering_display_name,
        prompt: row.question_prompt,
        answer: row.answer_text,
        displayOrder: row.answer_display_order,
      }];
    }),
  };
}

export async function getModerationActionLog() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_moderation_action_log", {
    p_limit: 100,
  });

  if (error) {
    throw new Error("Moderasyon denetim geçmişi yüklenemedi. 0013 migrationını ve admin rolünü kontrol edin.");
  }

  return (data ?? []) as ModerationActionLogItem[];
}

export async function getModerationStaff() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_moderation_staff");

  if (error) {
    throw new Error("Moderasyon ekibi yüklenemedi. 0014 migrationını ve admin rolünü kontrol edin.");
  }

  return (data ?? []) as ModerationStaffMember[];
}

export async function getModerationProfilePhotos(
  status: ModerationProfilePhoto["photo_status"] | null,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_moderation_profile_photos", {
    p_status: status,
    p_limit: 100,
  });

  if (error) {
    throw new Error("Profil fotoğrafı moderasyon kuyruğu yüklenemedi. 0015 migrationını ve personel rolünü kontrol edin.");
  }

  return (data ?? []) as ModerationProfilePhoto[];
}
