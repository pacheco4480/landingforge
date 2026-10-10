"use server";

import { revalidatePath } from "next/cache";

import {
  deleteRedirect,
  upsertRedirect,
} from "@/features/seo/services/redirect.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export async function upsertRedirectAction(formData: FormData) {
  const user = await requirePermission(permissions.seoWrite);
  await upsertRedirect(
    {
      id: value(formData, "id") || undefined,
      fromPath: value(formData, "fromPath"),
      toPath: value(formData, "toPath"),
      statusCode: value(formData, "statusCode"),
    },
    user.id,
  );
  revalidatePath("/seo");
}

export async function deleteRedirectAction(formData: FormData) {
  const user = await requirePermission(permissions.seoWrite);
  await deleteRedirect(value(formData, "id"), user.id);
  revalidatePath("/seo");
}
