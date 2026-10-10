import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isCmsEnabled } from "@/config/deployment";
import { CmsShell } from "@/features/cms/components/cms-shell";
import { requireAuth } from "@/lib/auth/require-auth";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isCmsEnabled()) redirect("/");

  const user = await requireAuth();
  return <CmsShell user={user}>{children}</CmsShell>;
}
