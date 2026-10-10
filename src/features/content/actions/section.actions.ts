"use server";

import { revalidatePath } from "next/cache";

import { permissions } from "@/features/rbac/permissions";
import { getPageForUser } from "@/features/content/services/page.service";
import { revalidatePublicPage } from "@/features/public-renderer/services/public-cache.service";
import {
  createSection,
  deleteSection,
  duplicateSection,
  moveSection,
  toggleSectionVisibility,
  updateSection,
} from "@/features/content/services/section.service";
import { requirePermission } from "@/lib/auth/require-permission";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseJsonObject(value: string) {
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Expected a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

async function requireEditablePage(formData: FormData) {
  const user = await requirePermission(permissions.cmsWrite);
  const pageId = formValue(formData, "pageId");
  const page = await getPageForUser(pageId, user.roles);
  return { user, pageId, page };
}

export async function createSectionAction(formData: FormData) {
  const { user, pageId, page } = await requireEditablePage(formData);
  await createSection(
    {
      pageId,
      sectionType: formValue(formData, "sectionType"),
      name: formValue(formData, "name"),
    },
    user.id,
  );

  revalidatePath(`/content/${pageId}`);
  revalidatePath(`/pages/${pageId}/edit`);
  revalidatePublicPage(page.slug);
}

export async function updateSectionAction(formData: FormData) {
  const { user, pageId, page } = await requireEditablePage(formData);
  await updateSection(
    {
      id: formValue(formData, "id"),
      pageId,
      name: formValue(formData, "name"),
      sectionType: formValue(formData, "sectionType"),
      content: parseJsonObject(formValue(formData, "content")),
      settings: parseJsonObject(formValue(formData, "settings") || "{}"),
    },
    user.id,
  );

  revalidatePath(`/content/${pageId}`);
  revalidatePath(`/pages/${pageId}/edit`);
  revalidatePublicPage(page.slug);
}

export async function duplicateSectionAction(formData: FormData) {
  const { user, pageId, page } = await requireEditablePage(formData);
  await duplicateSection(formValue(formData, "id"), user.id);
  revalidatePath(`/content/${pageId}`);
  revalidatePublicPage(page.slug);
}

export async function deleteSectionAction(formData: FormData) {
  const { user, pageId, page } = await requireEditablePage(formData);
  await deleteSection(formValue(formData, "id"), user.id);
  revalidatePath(`/content/${pageId}`);
  revalidatePublicPage(page.slug);
}

export async function toggleSectionVisibilityAction(formData: FormData) {
  const { user, pageId, page } = await requireEditablePage(formData);
  await toggleSectionVisibility(formValue(formData, "id"), user.id);
  revalidatePath(`/content/${pageId}`);
  revalidatePublicPage(page.slug);
}

export async function moveSectionAction(formData: FormData) {
  const { user, pageId, page } = await requireEditablePage(formData);
  const direction = formValue(formData, "direction") === "down" ? "down" : "up";
  await moveSection(formValue(formData, "id"), direction, user.id);
  revalidatePath(`/content/${pageId}`);
  revalidatePublicPage(page.slug);
}
