"use server";

import { revalidatePath } from "next/cache";

import {
  clientKnowledgeEntryIdSchema,
  clientKnowledgeEntrySchema,
} from "@/features/clients/schemas/client-knowledge.schema";
import {
  createClientKnowledgeEntry,
  deleteClientKnowledgeEntry,
  updateClientKnowledgeEntry,
} from "@/features/clients/services/client-knowledge.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function entryInput(formData: FormData) {
  return clientKnowledgeEntrySchema.parse({
    clientId: text(formData, "clientId"),
    projectId: text(formData, "projectId"),
    category: text(formData, "category"),
    title: text(formData, "title"),
    content: text(formData, "content"),
  });
}

export async function createClientKnowledgeEntryAction(formData: FormData) {
  const user = await requirePermission(permissions.clientNotesWrite);
  const input = entryInput(formData);
  await createClientKnowledgeEntry(input, user);
  revalidatePath(`/clients/${input.clientId}`);
}

export async function updateClientKnowledgeEntryAction(formData: FormData) {
  const user = await requirePermission(permissions.clientNotesWrite);
  const input = entryInput(formData);
  const { id } = clientKnowledgeEntryIdSchema.parse({
    id: text(formData, "id"),
    clientId: input.clientId,
  });
  await updateClientKnowledgeEntry(id, input, user);
  revalidatePath(`/clients/${input.clientId}`);
}

export async function deleteClientKnowledgeEntryAction(formData: FormData) {
  const user = await requirePermission(permissions.clientNotesWrite);
  const { id, clientId } = clientKnowledgeEntryIdSchema.parse({
    id: text(formData, "id"),
    clientId: text(formData, "clientId"),
  });
  await deleteClientKnowledgeEntry(id, clientId, user);
  revalidatePath(`/clients/${clientId}`);
}
