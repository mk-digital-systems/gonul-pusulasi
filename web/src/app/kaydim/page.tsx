import type { Metadata } from "next";
import { SimplePage } from "@/components/simple-page";
import { DeleteForm } from "./delete-form";

export const metadata: Metadata = {
  title: "Kaydım | Gönül Pusulası",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default async function ManagePage({ searchParams }: PageProps<"/kaydim">) {
  const { t } = await searchParams;
  return (
    <SimplePage>
      <DeleteForm token={typeof t === "string" ? t : ""} />
    </SimplePage>
  );
}
