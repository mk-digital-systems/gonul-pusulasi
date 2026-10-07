"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  type CompatibilityImportance,
  type CompatibilitySubmission,
  validateCompatibilitySubmissions,
} from "@/lib/compatibility-rules";
import { requireUser } from "@/lib/auth/user";
import { getCompatibilityQuestionnaire } from "@/lib/data/compatibility";
import { createClient } from "@/lib/supabase/server";

function message(path: string, kind: "hata" | "bildirim", text: string) {
  return `${path}?${kind}=${encodeURIComponent(text)}`;
}

function textValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function saveCompatibilityAnswersAction(formData: FormData) {
  await requireUser();
  const { questions } = await getCompatibilityQuestionnaire();

  const submissions: CompatibilitySubmission[] = questions.map((question) => ({
    questionCode: question.code,
    answerOptionId: Number(textValue(formData, `answer:${question.code}`)),
    importance: textValue(
      formData,
      `importance:${question.code}`,
    ) as CompatibilityImportance,
    acceptedOptionIds: formData
      .getAll(`accepted:${question.code}`)
      .map((value) => Number(value)),
  }));

  const parsed = validateCompatibilitySubmissions(
    submissions,
    questions.map((question) => ({
      code: question.code,
      optionIds: question.options.map((option) => option.id),
    })),
  );

  if (!parsed.success) {
    redirect(message("/uyum", "hata", parsed.error));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_my_compatibility_answers", {
    p_answers: parsed.data,
  });

  if (error) {
    redirect(
      message(
        "/uyum",
        "hata",
        "Uyum cevapları kaydedilemedi. Seçimlerinizi kontrol edip yeniden deneyin.",
      ),
    );
  }

  revalidatePath("/uyum");
  revalidatePath("/kesfet");
  revalidatePath("/hesabim");
  redirect(message("/kesfet", "bildirim", "Uyum profiliniz kaydedildi."));
}
