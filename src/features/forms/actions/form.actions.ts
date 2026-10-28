"use server";

import { revalidatePath } from "next/cache";

import {
  archiveForm,
  createFormFromTemplate,
  deleteForm,
  duplicateForm,
  saveForm,
} from "@/features/forms/services/form.service";
import type { FormTemplateKey } from "@/features/forms/services/form-template.service";
import { revalidatePublicPage } from "@/features/public-renderer/services/public-cache.service";
import { permissions } from "@/features/rbac/permissions";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-permission";
import { getMaintenanceCandidateForPage, invalidateMaintenanceCandidate } from "@/features/projects/services/project-maintenance.service";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export async function saveFormAction(formData: FormData) {
  const user = await requirePermission(permissions.formsWrite);
  const pageId = value(formData, "pageId") || null;
  const existing = value(formData, "id")
    ? await db.form.findUnique({ where: { id: value(formData, "id") }, select: { pageId: true } })
    : null;
  if (existing?.pageId) await getMaintenanceCandidateForPage(existing.pageId, user);
  if (pageId) await getMaintenanceCandidateForPage(pageId, user);
  const form = await saveForm(
    {
      id: value(formData, "id") || undefined,
      pageId: value(formData, "pageId"),
      thankYouPageId: value(formData, "thankYouPageId"),
      name: value(formData, "name"),
      key: value(formData, "key"),
      type: value(formData, "type"),
      status: value(formData, "status"),
      description: value(formData, "description"),
      successMessage: value(formData, "successMessage"),
      errorMessage: value(formData, "errorMessage"),
      recipientEmail: value(formData, "recipientEmail"),
      redirectUrl: value(formData, "redirectUrl"),
      gdprConsentRequired: formData.has("gdprConsentRequired"),
      gdprConsentLabel: value(formData, "gdprConsentLabel"),
      gdprConsentVersion: value(formData, "gdprConsentVersion"),
    },
    user.id,
  );
  revalidatePath("/forms");
  if (existing?.pageId) await invalidateMaintenanceCandidate(existing.pageId);
  if (form.pageId) await invalidateMaintenanceCandidate(form.pageId);
  await revalidateFormPage(form.pageId);
}

export async function duplicateFormAction(formData: FormData) {
  const user = await requirePermission(permissions.formsWrite);
  const existing = await db.form.findUniqueOrThrow({ where: { id: value(formData, "id") }, select: { pageId: true } });
  if (existing.pageId) await getMaintenanceCandidateForPage(existing.pageId, user);
  const form = await duplicateForm(value(formData, "id"), user.id);
  if (form.pageId) await invalidateMaintenanceCandidate(form.pageId);
  revalidatePath("/forms");
  await revalidateFormPage(form.pageId);
}

export async function archiveFormAction(formData: FormData) {
  const user = await requirePermission(permissions.formsWrite);
  const existing = await db.form.findUniqueOrThrow({ where: { id: value(formData, "id") }, select: { pageId: true } });
  if (existing.pageId) await getMaintenanceCandidateForPage(existing.pageId, user);
  const form = await archiveForm(value(formData, "id"), user.id);
  if (form.pageId) await invalidateMaintenanceCandidate(form.pageId);
  revalidatePath("/forms");
  await revalidateFormPage(form.pageId);
}

export async function deleteFormAction(formData: FormData) {
  const user = await requirePermission(permissions.formsWrite);
  const existing = await db.form.findUniqueOrThrow({ where: { id: value(formData, "id") }, select: { pageId: true } });
  if (existing.pageId) await getMaintenanceCandidateForPage(existing.pageId, user);
  const form = await deleteForm(value(formData, "id"), user.id);
  if (form.pageId) await invalidateMaintenanceCandidate(form.pageId);
  revalidatePath("/forms");
  await revalidateFormPage(form.pageId);
}

export async function createFormFromTemplateAction(formData: FormData) {
  const user = await requirePermission(permissions.formsWrite);
  const pageId = value(formData, "pageId") || null;
  if (pageId) await getMaintenanceCandidateForPage(pageId, user);
  const form = await createFormFromTemplate(
    value(formData, "templateKey") as FormTemplateKey,
    value(formData, "pageId") || null,
    value(formData, "recipientEmail"),
    user.id,
  );
  if (form.pageId) await invalidateMaintenanceCandidate(form.pageId);
  revalidatePath("/forms");
  await revalidateFormPage(form.pageId);
}

async function revalidateFormPage(pageId: string | null) {
  if (!pageId) {
    revalidatePublicPage();
    return;
  }

  const page = await db.page.findUnique({
    where: { id: pageId },
    select: { slug: true },
  });

  revalidatePublicPage(page?.slug);
}
