import type { Metadata } from "next";
import { SimplePage } from "@/components/simple-page";
import { ConfirmForm } from "./confirm-form";

export const metadata: Metadata = {
  title: "E-posta doğrulama | Gönül Pusulası",
  // Adres çubuğundaki belirteç başka sitelere iletilmez
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

// Bağlantı yalnızca sayfayı açar; doğrulama düğmeye basınca yapılır. Böylece
// e-posta güvenlik tarayıcılarının bağlantıyı açması kaydı doğrulamaz.
export default async function VerifyPage({ searchParams }: PageProps<"/dogrula">) {
  const { t } = await searchParams;
  return (
    <SimplePage>
      <ConfirmForm token={typeof t === "string" ? t : ""} />
    </SimplePage>
  );
}
