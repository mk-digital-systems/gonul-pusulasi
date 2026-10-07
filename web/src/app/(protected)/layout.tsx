import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth/user";
import { getMyStaffRole } from "@/lib/data/moderation";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requireUser();
  const staffRole = await getMyStaffRole();
  return <AppShell staffRole={staffRole}>{children}</AppShell>;
}
