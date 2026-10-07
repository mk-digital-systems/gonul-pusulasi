import "server-only";

import { createClient } from "@/lib/supabase/server";

export type DoorQuestion = {
  code: string;
  prompt: string;
  display_order: number;
};

export type CandidateDoorQuestion = {
  candidate_display_name: string;
  question_code: string;
  prompt: string;
  display_order: number;
};

export type IntroductionAnswer = {
  questionCode: string;
  prompt: string;
  answer: string;
  displayOrder: number;
};

export type IntroductionRequest = {
  request_id: string;
  direction: "incoming" | "outgoing";
  status: "pending" | "accepted" | "declined" | "cancelled" | "expired";
  other_user_id: string;
  other_display_name: string;
  created_at: string;
  expires_at: string;
  answers: IntroductionAnswer[];
  conversation_id: string | null;
  pre_meeting_expires_at: string | null;
};

export async function getMyDoorQuestionSettings() {
  const supabase = await createClient();
  const [catalogResult, selectedResult] = await Promise.all([
    supabase
      .from("door_question_catalog")
      .select("code,prompt,display_order")
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("user_door_questions")
      .select("question_code,display_order")
      .order("display_order"),
  ]);

  if (catalogResult.error || selectedResult.error) {
    throw new Error("Kapı soruları yüklenemedi. 0004 migrationını kontrol edin.");
  }

  return {
    catalog: (catalogResult.data ?? []) as DoorQuestion[],
    selectedCodes: (selectedResult.data ?? []).map((row) => row.question_code),
  };
}

export async function getCandidateDoorQuestions(candidateId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_candidate_door_questions", {
    p_candidate_id: candidateId,
  });

  if (error) {
    throw new Error("Adayın kapı soruları yüklenemedi.");
  }

  return (data ?? []) as CandidateDoorQuestion[];
}

export async function getMyIntroductionRequests() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_introduction_requests");

  if (error) {
    throw new Error("Tanışma başvuruları yüklenemedi. 0004 migrationını kontrol edin.");
  }

  return (data ?? []) as IntroductionRequest[];
}
