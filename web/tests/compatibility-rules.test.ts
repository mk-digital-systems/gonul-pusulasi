import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_VERY_IMPORTANT_ANSWERS,
  type CompatibilitySubmission,
  validateCompatibilitySubmissions,
} from "../src/lib/compatibility-rules.ts";

const questions = [
  { code: "pace", optionIds: [1, 2, 3] },
  { code: "space", optionIds: [4, 5, 6] },
];

function validSubmissions(): CompatibilitySubmission[] {
  return [
    {
      questionCode: "pace",
      answerOptionId: 2,
      importance: "important",
      acceptedOptionIds: [1, 2],
    },
    {
      questionCode: "space",
      answerOptionId: 5,
      importance: "not_important",
      acceptedOptionIds: [4, 5, 6],
    },
  ];
}

test("eksiksiz ve geçerli uyum cevaplarını kabul eder", () => {
  const result = validateCompatibilitySubmissions(validSubmissions(), questions);
  assert.equal(result.success, true);
});

test("eksik soru veya aynı sorunun tekrarını reddeder", () => {
  assert.equal(
    validateCompatibilitySubmissions(validSubmissions().slice(0, 1), questions).success,
    false,
  );

  const duplicate = validSubmissions();
  duplicate[1] = { ...duplicate[0] };
  assert.equal(validateCompatibilitySubmissions(duplicate, questions).success, false);
});

test("geçersiz seçenek ve boş kabul listesini reddeder", () => {
  const invalidAnswer = validSubmissions();
  invalidAnswer[0].answerOptionId = 99;
  assert.equal(validateCompatibilitySubmissions(invalidAnswer, questions).success, false);

  const emptyAcceptance = validSubmissions();
  emptyAcceptance[0].acceptedOptionIds = [];
  assert.equal(validateCompatibilitySubmissions(emptyAcceptance, questions).success, false);
});

test("çok önemli seçimini beş başlıkla sınırlar", () => {
  const manyQuestions = Array.from(
    { length: MAX_VERY_IMPORTANT_ANSWERS + 1 },
    (_, index) => ({ code: `q${index}`, optionIds: [index + 1] }),
  );
  const submissions: CompatibilitySubmission[] = manyQuestions.map(
    (question, index) => ({
      questionCode: question.code,
      answerOptionId: index + 1,
      importance: "very_important",
      acceptedOptionIds: [index + 1],
    }),
  );

  const result = validateCompatibilitySubmissions(submissions, manyQuestions);
  assert.equal(result.success, false);
});
