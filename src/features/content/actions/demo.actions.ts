"use server";

import { revalidatePath } from "next/cache";

import {
  archiveDemo,
  createDemo,
  deleteDemo,
  duplicateDemo,
  updateDemoSettings,
} from "@/features/content/services/demo.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export async function createDemoAction(formData: FormData) {
  const user = await requirePermission(permissions.cmsWrite);
  await createDemo(
    {
      title: value(formData, "title"),
      slug: value(formData, "slug"),
      demoKey: value(formData, "demoKey"),
      templateId: value(formData, "templateId"),
      templateVariantId: value(formData, "templateVariantId"),
      themeId: value(formData, "themeId"),
    },
    user.id,
    user.roles,
  );
  revalidatePath("/content");
}

export async function updateDemoSettingsAction(formData: FormData) {
  const user = await requirePermission(permissions.cmsWrite);
  await updateDemoSettings(
    {
      id: value(formData, "id"),
      title: value(formData, "title"),
      slug: value(formData, "slug"),
      demoKey: value(formData, "demoKey"),
      pageStatus: value(formData, "pageStatus"),
      demoStatus: value(formData, "demoStatus"),
      portfolioVisible: formData.has("portfolioVisible"),
      portfolioOrder: value(formData, "portfolioOrder"),
      templateId: value(formData, "templateId"),
      templateVariantId: value(formData, "templateVariantId"),
      themeId: value(formData, "themeId"),
    },
    user.id,
    user.roles,
  );
  revalidatePath("/content");
}

export async function duplicateDemoAction(formData: FormData) {
  const user = await requirePermission(permissions.cmsWrite);
  await duplicateDemo(value(formData, "id"), user.id, user.roles);
  revalidatePath("/content");
}

export async function archiveDemoAction(formData: FormData) {
  const user = await requirePermission(permissions.cmsWrite);
  await archiveDemo(value(formData, "id"), user.id, user.roles);
  revalidatePath("/content");
}

export async function deleteDemoAction(formData: FormData) {
  const user = await requirePermission(permissions.cmsWrite);
  await deleteDemo(value(formData, "id"), user.id, user.roles);
  revalidatePath("/content");
}
