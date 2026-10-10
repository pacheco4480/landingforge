import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UserStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { status: true, authorizationVersion: true },
  });
  if (
    !user ||
    user.status !== UserStatus.ACTIVE ||
    user.authorizationVersion !== session.user.authorizationVersion
  ) {
    redirect("/login?error=session-expired");
  }

  return session.user;
}
