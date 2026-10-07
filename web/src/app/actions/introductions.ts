"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { getCandidateDoorQuestions } from "@/lib/data/introductions";
import { createClient } from "@/lib/supabase/server";
import {
  doorQuestionSelectionSchema,
  introductionActionSchema,
  validateDoorAnswers,
} from "@/lib/validation/introduction";

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item : "";
}

function message(path: string, kind: "hata" | "bildirim", text: string) {
  return `${path}?${kind}=${encodeURIComponent(text)}`;
}

export async function saveDoorQuestionsAction(formData: FormData) {
  await requireUser();
  const parsed = doorQuestionSelectionSchema.safeParse(
    formData.getAll("questionCodes").filter((item): item is string => typeof item === "string"),
  );

  if (!parsed.success) {
    redirect(message("/kapi-sorularim", "hata", parsed.error.issues[0]?.message ?? "Soruları kontrol edin."));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_my_door_questions", {
    p_question_codes: parsed.data,
  });

  if (error) {
    redirect(message("/kapi-sorularim", "hata", "Kapı soruları kaydedilemedi."));
  }

  revalidatePath("/kapi-sorularim");
  revalidatePath("/kesfet");
  redirect(message("/kapi-sorularim", "bildirim", "Kapı sorularınız kaydedildi."));
}

export async function sendIntroductionRequestAction(formData: FormData) {
  await requireUser();
  const candidateId = value(formData, "candidateId");
  const questions = await getCandidateDoorQuestions(candidateId);
  const submissions = questions.map((question) => ({
    questionCode: question.question_code,
    answer: value(formData, `answer:${question.question_code}`),
  }));
  const parsed = validateDoorAnswers(candidateId, submissions, questions.map((question) => ({ code: question.question_code })));

  if (!parsed.success) {
    redirect(message(`/tanisma-talebi/${candidateId}`, "hata", parsed.error));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("send_introduction_request", {
    p_recipient_id: candidateId,
    p_answers: parsed.data,
  });

  if (error) {
    redirect(message(`/tanisma-talebi/${candidateId}`, "hata", "Başvuru gönderilemedi. Kapasiteyi ve aday uygunluğunu kontrol edin."));
  }

  revalidatePath("/kesfet");
  revalidatePath("/talepler");
  redirect(message("/talepler", "bildirim", "Tanışma başvurunuz gönderildi."));
}

export async function respondToIntroductionRequestAction(formData: FormData) {
  await requireUser();
  const parsed = introductionActionSchema.safeParse({
    requestId: value(formData, "requestId"),
    action: value(formData, "action"),
  });

  if (!parsed.success) {
    redirect(message("/talepler", "hata", "Başvuru işlemi geçersiz."));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("respond_to_introduction_request", {
    p_request_id: parsed.data.requestId,
    p_action: parsed.data.action,
  });

  if (error) {
    redirect(message("/talepler", "hata", "Başvuru güncellenemedi. Süresi veya kapasiteyi kontrol edin."));
  }

  revalidatePath("/talepler");
  revalidatePath("/kesfet");
  revalidatePath("/gorusmeler");
  const notice = parsed.data.action === "accept"
    ? "Başvuruyu kabul ettiniz. 96 saatlik ön görüşme başladı."
    : parsed.data.action === "decline"
      ? "Başvuruyu nazikçe reddettiniz."
      : "Başvurunuzu iptal ettiniz.";
  if (parsed.data.action === "accept" && typeof data === "string") {
    redirect(message(`/gorusmeler/${data}`, "bildirim", notice));
  }
  redirect(message("/talepler", "bildirim", notice));
}
