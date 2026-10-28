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
import { requireAuth } from "@/lib/auth/require-auth";
import { hasPermission } from "@/features/rbac/rbac.service";
import { getMaintenanceCandidateForPage, invalidateMaintenanceCandidate } from "@/features/projects/services/project-maintenance.service";
import { normalizePresentationSettings } from "@/features/public-renderer/section-presentation";
import { db } from "@/lib/db";

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

async function assertSectionBelongsToPage(sectionId: string, pageId: string) {
  const section = await db.pageSection.findFirst({ where: { id: sectionId, pageId, deletedAt: null }, select: { id: true } });
  if (!section) throw new Error("A secção não pertence a esta página.");
}

async function requireEditablePage(formData: FormData) {
  const user = await requireAuth();
  const pageId = formValue(formData, "pageId");
  const candidate = await getMaintenanceCandidateForPage(pageId, user);
  if (!candidate && !hasPermission(user.permissions, permissions.cmsWrite)) {
    await requirePermission(permissions.cmsWrite);
  }
  const page = await getPageForUser(pageId, user.roles, user);
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
  await invalidateMaintenanceCandidate(pageId);

  revalidatePath(`/content/${pageId}`);
  revalidatePath(`/pages/${pageId}/edit`);
  revalidatePublicPage(page.slug);
}

export async function updateSectionAction(formData: FormData) {
  const { user, pageId, page } = await requireEditablePage(formData);
  await assertSectionBelongsToPage(formValue(formData, "id"), pageId);
  const sectionType = formValue(formData, "sectionType");
  const settings = normalizePresentationSettings(
    parseJsonObject(formValue(formData, "settings") || "{}"),
    sectionType,
    formValue(formData, "presentationVariant"),
    page.template?.key,
    page.templateVariant?.key,
  );
  await updateSection(
    {
      id: formValue(formData, "id"),
      pageId,
      name: formValue(formData, "name"),
      sectionType,
      content: parseJsonObject(formValue(formData, "content")),
      settings,
    },
    user.id,
  );
  await invalidateMaintenanceCandidate(pageId);

  revalidatePath(`/content/${pageId}`);
  revalidatePath(`/pages/${pageId}/edit`);
  revalidatePublicPage(page.slug);
}

export async function duplicateSectionAction(formData: FormData) {
  const { user, pageId, page } = await requireEditablePage(formData);
  const sectionId = formValue(formData, "id");
  await assertSectionBelongsToPage(sectionId, pageId);
  await duplicateSection(sectionId, user.id);
  await invalidateMaintenanceCandidate(pageId);
  revalidatePath(`/content/${pageId}`);
  revalidatePublicPage(page.slug);
}

export async function deleteSectionAction(formData: FormData) {
  const { user, pageId, page } = await requireEditablePage(formData);
  const sectionId = formValue(formData, "id");
  await assertSectionBelongsToPage(sectionId, pageId);
  await deleteSection(sectionId, user.id);
  await invalidateMaintenanceCandidate(pageId);
  revalidatePath(`/content/${pageId}`);
  revalidatePublicPage(page.slug);
}

export async function toggleSectionVisibilityAction(formData: FormData) {
  const { user, pageId, page } = await requireEditablePage(formData);
  const sectionId = formValue(formData, "id");
  await assertSectionBelongsToPage(sectionId, pageId);
  await toggleSectionVisibility(sectionId, user.id);
  await invalidateMaintenanceCandidate(pageId);
  revalidatePath(`/content/${pageId}`);
  revalidatePublicPage(page.slug);
}

export async function moveSectionAction(formData: FormData) {
  const { user, pageId, page } = await requireEditablePage(formData);
  const sectionId = formValue(formData, "id");
  await assertSectionBelongsToPage(sectionId, pageId);
  const direction = formValue(formData, "direction") === "down" ? "down" : "up";
  await moveSection(sectionId, direction, user.id);
  await invalidateMaintenanceCandidate(pageId);
  revalidatePath(`/content/${pageId}`);
  revalidatePublicPage(page.slug);
}
