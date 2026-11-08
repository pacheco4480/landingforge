"use server";

import { revalidatePath } from "next/cache";

import {
  deleteFormField,
  moveFormField,
  saveFormField,
} from "@/features/forms/services/form-field.service";
import { revalidatePublicPage } from "@/features/public-renderer/services/public-cache.service";
import { permissions } from "@/features/rbac/permissions";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/require-permission";
import { getMaintenanceCandidateForPage, invalidateMaintenanceCandidate } from "@/features/projects/services/project-maintenance.service";
import { parseFormFieldFormData } from "@/features/forms/validation/form-field-form-data";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export async function saveFormFieldAction(formData: FormData) {
  const user = await requirePermission(permissions.formsWrite);
  const parsed = parseFormFieldFormData(formData);
  if (!parsed.success) return parsed;

  const formId = value(formData, "formId");
  const form = await db.form.findUniqueOrThrow({ where: { id: formId }, select: { pageId: true } });
  const existingField = value(formData, "id")
    ? await db.formField.findUnique({ where: { id: value(formData, "id") }, select: { form: { select: { pageId: true } } } })
    : null;
  if (existingField?.form.pageId) await getMaintenanceCandidateForPage(existingField.form.pageId, user);
  if (form.pageId) await getMaintenanceCandidateForPage(form.pageId, user);
  const field = await saveFormField(parsed.data, user.id);
  if (form.pageId) await invalidateMaintenanceCandidate(form.pageId);
  revalidatePath("/forms");
  await revalidateFieldFormPage(field.formId);
  return { success: true } as const;
}

export async function deleteFormFieldAction(formData: FormData) {
  const user = await requirePermission(permissions.formsWrite);
  const existing = await db.formField.findUniqueOrThrow({ where: { id: value(formData, "id") }, select: { form: { select: { pageId: true } } } });
  if (existing.form.pageId) await getMaintenanceCandidateForPage(existing.form.pageId, user);
  const field = await deleteFormField(value(formData, "id"), user.id);
  if (existing.form.pageId) await invalidateMaintenanceCandidate(existing.form.pageId);
  revalidatePath("/forms");
  await revalidateFieldFormPage(field.formId);
}

export async function moveFormFieldAction(formData: FormData) {
  const user = await requirePermission(permissions.formsWrite);
  const existing = await db.formField.findUniqueOrThrow({ where: { id: value(formData, "id") }, select: { form: { select: { pageId: true } } } });
  if (existing.form.pageId) await getMaintenanceCandidateForPage(existing.form.pageId, user);
  const field = await moveFormField(
    value(formData, "id"),
    value(formData, "direction") === "up" ? "up" : "down",
    user.id,
  );
  if (existing.form.pageId) await invalidateMaintenanceCandidate(existing.form.pageId);
  revalidatePath("/forms");
  await revalidateFieldFormPage(field.formId);
}

async function revalidateFieldFormPage(formId: string) {
  const form = await db.form.findUnique({
    where: { id: formId },
    select: { page: { select: { slug: true } } },
  });

  revalidatePublicPage(form?.page?.slug);
}
