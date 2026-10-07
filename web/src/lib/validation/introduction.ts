import { z } from "zod";

export const DOOR_QUESTION_COUNT = 3;
export const DOOR_ANSWER_MIN_LENGTH = 20;
export const DOOR_ANSWER_MAX_LENGTH = 500;

const questionCodeSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]{2,49}$/);

export const doorQuestionSelectionSchema = z
  .array(questionCodeSchema)
  .length(DOOR_QUESTION_COUNT, "Tam olarak 3 kapı sorusu seçin.")
  .refine((codes) => new Set(codes).size === DOOR_QUESTION_COUNT, {
    message: "Aynı kapı sorusu birden fazla seçilemez.",
  });

export const introductionActionSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(["accept", "decline", "cancel"]),
});

export type DoorQuestionRule = { code: string };
export type DoorAnswerSubmission = { questionCode: string; answer: string };

type DoorAnswerValidationResult =
  | { success: true; data: DoorAnswerSubmission[] }
  | { success: false; error: string };

export function validateDoorAnswers(
  candidateId: string,
  submissions: DoorAnswerSubmission[],
  questions: DoorQuestionRule[],
): DoorAnswerValidationResult {
  if (!z.string().uuid().safeParse(candidateId).success) {
    return { success: false, error: "Aday bilgisi geçersiz." };
  }

  if (
    questions.length !== DOOR_QUESTION_COUNT ||
    submissions.length !== DOOR_QUESTION_COUNT
  ) {
    return { success: false, error: "Üç kapı sorusunun tamamını yanıtlayın." };
  }

  const expectedCodes = new Set(questions.map((question) => question.code));
  const seenCodes = new Set<string>();
  const normalized: DoorAnswerSubmission[] = [];

  for (const submission of submissions) {
    const answer = submission.answer.trim();
    if (
      !expectedCodes.has(submission.questionCode) ||
      seenCodes.has(submission.questionCode)
    ) {
      return { success: false, error: "Kapı sorularından biri geçersiz." };
    }
    if (
      answer.length < DOOR_ANSWER_MIN_LENGTH ||
      answer.length > DOOR_ANSWER_MAX_LENGTH
    ) {
      return {
        success: false,
        error: `Her cevap ${DOOR_ANSWER_MIN_LENGTH}–${DOOR_ANSWER_MAX_LENGTH} karakter olmalıdır.`,
      };
    }

    seenCodes.add(submission.questionCode);
    normalized.push({ questionCode: submission.questionCode, answer });
  }

  return { success: true, data: normalized };
}
