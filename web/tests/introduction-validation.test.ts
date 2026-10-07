import assert from "node:assert/strict";
import test from "node:test";
import {
  doorQuestionSelectionSchema,
  validateDoorAnswers,
} from "../src/lib/validation/introduction.ts";

const candidateId = "30000000-0000-4000-8000-000000000001";
const questions = [{ code: "q_one" }, { code: "q_two" }, { code: "q_three" }];

test("tam olarak üç farklı kapı sorusu seçilir", () => {
  assert.equal(
    doorQuestionSelectionSchema.safeParse(["q_one", "q_two", "q_three"]).success,
    true,
  );
  assert.equal(doorQuestionSelectionSchema.safeParse(["q_one", "q_two"]).success, false);
  assert.equal(
    doorQuestionSelectionSchema.safeParse(["q_one", "q_one", "q_three"]).success,
    false,
  );
});

test("üç geçerli kapı cevabı kabul edilir ve boşlukları temizlenir", () => {
  const result = validateDoorAnswers(
    candidateId,
    questions.map((question) => ({
      questionCode: question.code,
      answer: "  Bu soruya kendimi anlatan yeterince uzun bir cevap veriyorum.  ",
    })),
    questions,
  );

  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data[0]?.answer.startsWith("Bu"), true);
  }
});

test("kısa, eksik veya bilinmeyen kapı cevabı reddedilir", () => {
  const valid = questions.map((question) => ({
    questionCode: question.code,
    answer: "Bu cevap yirmi karakterden daha uzun olacak şekilde yazıldı.",
  }));

  assert.equal(validateDoorAnswers(candidateId, valid.slice(0, 2), questions).success, false);
  assert.equal(
    validateDoorAnswers(candidateId, [{ ...valid[0]!, answer: "Çok kısa" }, valid[1]!, valid[2]!], questions).success,
    false,
  );
  assert.equal(
    validateDoorAnswers(candidateId, [{ ...valid[0]!, questionCode: "unknown" }, valid[1]!, valid[2]!], questions).success,
    false,
  );
});

test("geçersiz aday kimliği reddedilir", () => {
  const submissions = questions.map((question) => ({
    questionCode: question.code,
    answer: "Bu cevap yirmi karakterden daha uzun olacak şekilde yazıldı.",
  }));
  assert.equal(validateDoorAnswers("not-a-uuid", submissions, questions).success, false);
});
