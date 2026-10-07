import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CompatibilityQuestionSet = {
  id: string;
  version: number;
  title: string;
};

export type CompatibilityOption = {
  id: number;
  question_code: string;
  code: string;
  label: string;
  display_order: number;
};

export type CompatibilityQuestion = {
  code: string;
  prompt: string;
  help_text: string | null;
  display_order: number;
  options: CompatibilityOption[];
};

export type SavedCompatibilityAnswer = {
  answerOptionId: number;
  importance: "not_important" | "important" | "very_important";
  acceptedOptionIds: number[];
};

export type DiscoveryCandidate = {
  user_id: string;
  display_name: string;
  age: number;
  city_name: string;
  relationship_goal: string;
  compatibility_band: string;
  shared_points: string[];
};

export type DiscoveryCandidatesResult = {
  candidates: DiscoveryCandidate[];
  errorCode: string | null;
};

export async function getCompatibilityQuestionnaire() {
  const supabase = await createClient();
  const setResult = await supabase
    .from("compatibility_question_sets")
    .select("id,version,title")
    .eq("is_active", true)
    .single();

  if (setResult.error) {
    throw new Error("Faz 2 uyum soru seti bulunamadı. 0002 migrationını kontrol edin.");
  }

  const questionSet = setResult.data as CompatibilityQuestionSet;
  const questionsResult = await supabase
    .from("compatibility_questions")
    .select("code,prompt,help_text,display_order")
    .eq("question_set_id", questionSet.id)
    .eq("is_active", true)
    .order("display_order");

  if (questionsResult.error) {
    throw new Error("Uyum soruları yüklenemedi.");
  }

  const questionRows = questionsResult.data as Omit<CompatibilityQuestion, "options">[];
  const codes = questionRows.map((question) => question.code);
  const optionsResult = await supabase
    .from("compatibility_options")
    .select("id,question_code,code,label,display_order")
    .in("question_code", codes)
    .order("display_order");

  if (optionsResult.error) {
    throw new Error("Uyum cevap seçenekleri yüklenemedi.");
  }

  const options = optionsResult.data as CompatibilityOption[];
  return {
    questionSet,
    questions: questionRows.map((question) => ({
      ...question,
      options: options.filter((option) => option.question_code === question.code),
    })),
  };
}

export async function getMyCompatibilityState() {
  const supabase = await createClient();
  const [activeSetResult, profileResult, answersResult, acceptancesResult] =
    await Promise.all([
      supabase
        .from("compatibility_question_sets")
        .select("id")
        .eq("is_active", true)
        .single(),
      supabase
        .from("compatibility_profiles")
        .select("question_set_id,completed_at")
        .maybeSingle(),
      supabase
        .from("compatibility_answers")
        .select("question_code,answer_option_id,importance"),
      supabase
        .from("compatibility_answer_acceptances")
        .select("question_code,option_id"),
    ]);

  if (
    activeSetResult.error ||
    profileResult.error ||
    answersResult.error ||
    acceptancesResult.error
  ) {
    throw new Error("Uyum cevapları yüklenemedi. 0002 migrationını kontrol edin.");
  }

  const acceptances = new Map<string, number[]>();
  for (const row of acceptancesResult.data ?? []) {
    const current = acceptances.get(row.question_code) ?? [];
    current.push(row.option_id);
    acceptances.set(row.question_code, current);
  }

  const answers = new Map<string, SavedCompatibilityAnswer>();
  for (const row of answersResult.data ?? []) {
    answers.set(row.question_code, {
      answerOptionId: row.answer_option_id,
      importance: row.importance,
      acceptedOptionIds: acceptances.get(row.question_code) ?? [],
    });
  }

  const isCurrentQuestionSet =
    profileResult.data?.question_set_id === activeSetResult.data.id;

  return {
    completedAt: isCurrentQuestionSet
      ? (profileResult.data?.completed_at ?? null)
      : null,
    questionSetId: profileResult.data?.question_set_id ?? null,
    answers,
  };
}

export async function getDiscoveryCandidates(
  limit = 10,
): Promise<DiscoveryCandidatesResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_discovery_candidates", {
    p_limit: limit,
  });

  if (error) {
    console.error("Discovery candidates RPC failed", {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
    });

    return {
      candidates: [],
      errorCode: error.code || "UNKNOWN",
    };
  }

  return {
    candidates: (data ?? []) as DiscoveryCandidate[],
    errorCode: null,
  };
}
