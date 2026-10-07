export const COMPATIBILITY_IMPORTANCE_VALUES = [
  "not_important",
  "important",
  "very_important",
] as const;

export type CompatibilityImportance =
  (typeof COMPATIBILITY_IMPORTANCE_VALUES)[number];

export const MAX_VERY_IMPORTANT_ANSWERS = 5;

export type CompatibilitySubmission = {
  questionCode: string;
  answerOptionId: number;
  importance: CompatibilityImportance;
  acceptedOptionIds: number[];
};

export type CompatibilityQuestionRule = {
  code: string;
  optionIds: number[];
};

type ValidationResult =
  | { success: true; data: CompatibilitySubmission[] }
  | { success: false; error: string };

export function validateCompatibilitySubmissions(
  submissions: CompatibilitySubmission[],
  questions: CompatibilityQuestionRule[],
): ValidationResult {
  if (submissions.length !== questions.length) {
    return { success: false, error: "Bütün uyum sorularını yanıtlayın." };
  }

  const questionMap = new Map(
    questions.map((question) => [question.code, new Set(question.optionIds)]),
  );
  const seen = new Set<string>();
  let veryImportantCount = 0;

  for (const submission of submissions) {
    const optionIds = questionMap.get(submission.questionCode);
    if (!optionIds || seen.has(submission.questionCode)) {
      return { success: false, error: "Uyum sorularından biri geçersiz." };
    }
    seen.add(submission.questionCode);

    if (!optionIds.has(submission.answerOptionId)) {
      return { success: false, error: "Her soru için kendi cevabınızı seçin." };
    }

    const accepted = [...new Set(submission.acceptedOptionIds)];
    if (accepted.length === 0 || accepted.some((id) => !optionIds.has(id))) {
      return {
        success: false,
        error: "Her soru için kabul edebileceğiniz en az bir cevabı seçin.",
      };
    }
    submission.acceptedOptionIds = accepted;

    if (!COMPATIBILITY_IMPORTANCE_VALUES.includes(submission.importance)) {
      return { success: false, error: "Önem derecelerinden biri geçersiz." };
    }
    if (submission.importance === "very_important") veryImportantCount += 1;
  }

  if (veryImportantCount > MAX_VERY_IMPORTANT_ANSWERS) {
    return {
      success: false,
      error: `En fazla ${MAX_VERY_IMPORTANT_ANSWERS} soruyu Çok önemli seçebilirsiniz.`,
    };
  }

  return { success: true, data: submissions };
}
