"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clientSchema, clientIdSchema } from "@/features/clients/schemas/client.schema";
import {
  createClient,
  getClientForActor,
  updateClient,
} from "@/features/clients/services/client.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

function clientInput(formData: FormData, includeNotes: boolean) {
  return clientSchema.parse({
    name: value(formData, "name"),
    businessName: value(formData, "businessName"),
    industry: value(formData, "industry"),
    website: value(formData, "website"),
    email: value(formData, "email"),
    phone: value(formData, "phone"),
    address: value(formData, "address"),
    vatNumber: value(formData, "vatNumber"),
    internalNotes: includeNotes ? value(formData, "internalNotes") : undefined,
    lastMeaningfulContactAt: value(formData, "lastMeaningfulContactAt"),
    status: value(formData, "status"),
  });
}

function canManageClientNotes(user: { permissions: readonly string[] }) {
  return (
    user.permissions.includes(permissions.clientNotesRead) &&
    user.permissions.includes(permissions.clientNotesWrite)
  );
}

export async function createClientAction(formData: FormData) {
  const user = await requirePermission(permissions.clientsWrite);
  const data = clientInput(
    formData,
    canManageClientNotes(user),
  );
  const client = await createClient(data, user.id);
  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClientAction(formData: FormData) {
  const user = await requirePermission(permissions.clientsWrite);
  const { id } = clientIdSchema.parse({ id: value(formData, "id") });
  await getClientForActor(id, user, false);
  await updateClient(
    id,
    clientInput(formData, canManageClientNotes(user)),
    user.id,
    user,
    canManageClientNotes(user),
  );
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
}
