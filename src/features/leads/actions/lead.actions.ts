"use server";

import { revalidatePath } from "next/cache";

import {
  deleteLeadNoteSchema,
  leadNoteSchema,
  updateLeadStatusSchema,
} from "@/features/leads/schemas/lead.schema";
import {
  deleteLeadNote,
  saveLeadNote,
  updateLeadStatus,
} from "@/features/leads/services/lead.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export async function updateLeadStatusAction(formData: FormData) {
  const user = await requirePermission(permissions.leadsWrite);
  const data = updateLeadStatusSchema.parse({
    id: value(formData, "id"),
    status: value(formData, "status"),
  });
  await updateLeadStatus(data.id, data.status, user.id);
  revalidatePath("/leads");
}

export async function saveLeadNoteAction(formData: FormData) {
  const user = await requirePermission(permissions.leadsWrite);
  const data = leadNoteSchema.parse({
    id: value(formData, "id") || undefined,
    leadId: value(formData, "leadId"),
    note: value(formData, "note"),
  });
  await saveLeadNote(data, user.id);
  revalidatePath("/leads");
}

export async function deleteLeadNoteAction(formData: FormData) {
  const user = await requirePermission(permissions.leadsWrite);
  const data = deleteLeadNoteSchema.parse({
    id: value(formData, "id"),
    leadId: value(formData, "leadId"),
  });
  await deleteLeadNote(data, user.id);
  revalidatePath("/leads");
}
