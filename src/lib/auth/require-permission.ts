import { redirect } from "next/navigation";

import { hasPermission } from "@/features/rbac/rbac.service";
import { requireAuth } from "@/lib/auth/require-auth";

export async function requirePermission(permission: string) {
  const user = await requireAuth();
  if (!hasPermission(user.permissions, permission)) redirect("/access-denied");
  return user;
}
