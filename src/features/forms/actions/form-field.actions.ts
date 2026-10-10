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

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

function jsonArray(formData: FormData, key: string) {
  const raw = value(formData, key);
  if (!raw) return [];
  return JSON.parse(raw) as unknown;
}

function jsonObject(formData: FormData, key: string) {
  const raw = value(formData, key);
  if (!raw) return {};
  return JSON.parse(raw) as unknown;
}

export async function saveFormFieldAction(formData: FormData) {
  const user = await requirePermission(permissions.formsWrite);
  const field = await saveFormField(
    {
      id: value(formData, "id") || undefined,
      formId: value(formData, "formId"),
      label: value(formData, "label"),
      name: value(formData, "name"),
      type: value(formData, "type"),
      placeholder: value(formData, "placeholder"),
      helpText: value(formData, "helpText"),
      defaultValue: value(formData, "defaultValue"),
      options: jsonArray(formData, "options"),
      validation: jsonObject(formData, "validation"),
      conditionalLogic: jsonArray(formData, "conditionalLogic"),
      isRequired: formData.get("isRequired") === "on",
      isVisible: formData.get("isVisible") === "on",
    },
    user.id,
  );
  revalidatePath("/forms");
  await revalidateFieldFormPage(field.formId);
}

export async function deleteFormFieldAction(formData: FormData) {
  const user = await requirePermission(permissions.formsWrite);
  const field = await deleteFormField(value(formData, "id"), user.id);
  revalidatePath("/forms");
  await revalidateFieldFormPage(field.formId);
}

export async function moveFormFieldAction(formData: FormData) {
  const user = await requirePermission(permissions.formsWrite);
  const field = await moveFormField(
    value(formData, "id"),
    value(formData, "direction") === "up" ? "up" : "down",
    user.id,
  );
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
