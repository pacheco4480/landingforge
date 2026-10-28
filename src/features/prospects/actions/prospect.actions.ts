"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prospectEmailTemplateSchema, prospectIdSchema, prospectSchema, prospectStatusSchema, prospectSuppressionSchema, prospectDraftSchema } from "@/features/prospects/schemas/prospect.schema";
import { convertProspectToClient, createProspect, deleteProspect, importProspects, markDraftManuallyExported, previewProspectImport, saveProspectDraft, saveProspectTemplate, setProspectStatus, suppressProspect, updateProspect } from "@/features/prospects/services/prospect.service";
import { SecurityEventType } from "@/generated/prisma/client";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";
import { assertRateLimit } from "@/lib/security/rate-limiter";
import { recordSecurityEvent } from "@/lib/security/security-event.service";
import { resolveProspectDiscoveryProvider } from "@/features/prospects/providers/discovery-provider-resolver";
import type { DiscoveryProviderResolution } from "@/features/prospects/providers/discovery-provider";
import { z } from "zod";

async function recordProspectApiRequest(userId: string, operation: string) {
  const key = `prospect:${userId}`;
  await assertRateLimit({ action: "api", key });
  await recordSecurityEvent({
    type: SecurityEventType.API_REQUEST,
    scope: "api",
    key,
    metadata: { feature: "prospects", operation },
  });
}

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

function prospectInput(formData: FormData) {
  return prospectSchema.parse({
    id: value(formData, "id") || undefined,
    businessName: value(formData, "businessName"),
    contactName: value(formData, "contactName"),
    email: value(formData, "email"),
    phone: value(formData, "phone"),
    industry: value(formData, "industry"),
    locality: value(formData, "locality"),
    website: value(formData, "website"),
    publicProfileUrl: value(formData, "publicProfileUrl"),
    sourceUrl: value(formData, "sourceUrl"),
    verifiedAt: value(formData, "verifiedAt"),
    lastMeaningfulContactAt: value(formData, "lastMeaningfulContactAt"),
    nextFollowUpAt: value(formData, "nextFollowUpAt"),
    businessSignals: formData.getAll("businessSignals").filter((item): item is string => typeof item === "string"),
    factualNotes: value(formData, "factualNotes"),
    qualificationReason: value(formData, "qualificationReason"),
    status: value(formData, "status") || "NEW",
  });
}

export async function createProspectAction(formData: FormData) {
  const user = await requirePermission(permissions.prospectsWrite);
  const prospect = await createProspect(prospectInput(formData), user.id);
  revalidatePath("/prospects");
  redirect(`/prospects/${prospect.id}`);
}

export async function updateProspectAction(formData: FormData) {
  const user = await requirePermission(permissions.prospectsWrite);
  const { id } = prospectIdSchema.parse({ id: value(formData, "id") });
  await updateProspect(id, prospectInput(formData), user.id);
  revalidatePath("/prospects");
  revalidatePath(`/prospects/${id}`);
}

export async function updateProspectStatusAction(formData: FormData) {
  const user = await requirePermission(permissions.prospectsWrite);
  const { id, status } = prospectStatusSchema.parse({ id: value(formData, "id"), status: value(formData, "status") });
  await setProspectStatus(id, status, user.id);
  revalidatePath("/prospects");
  revalidatePath(`/prospects/${id}`);
}

export async function deleteProspectAction(formData: FormData) {
  const user = await requirePermission(permissions.prospectsWrite);
  const { id } = prospectIdSchema.parse({ id: value(formData, "id") });
  await deleteProspect(id, user.id);
  revalidatePath("/prospects");
  redirect("/prospects?deleted=1");
}

export async function suppressProspectAction(formData: FormData) {
  const user = await requirePermission(permissions.prospectsWrite);
  const input = prospectSuppressionSchema.parse({ type: value(formData, "type"), value: value(formData, "value"), reason: value(formData, "reason") });
  await recordProspectApiRequest(user.id, "suppression-update");
  await suppressProspect(input, user.id);
  revalidatePath("/prospects");
  const prospectId = value(formData, "prospectId");
  if (prospectId) revalidatePath(`/prospects/${prospectId}`);
}

export async function previewProspectImportAction(rows: unknown) {
  const user = await requirePermission(permissions.prospectsWrite);
  if (!Array.isArray(rows)) throw new Error("A pré-visualização CSV não é válida.");
  await recordProspectApiRequest(user.id, "csv-preview");
  return previewProspectImport(rows);
}

const prospectDiscoveryQuerySchema = z.object({
  query: z.string().trim().min(2).max(100),
  locality: z.string().trim().min(2).max(120),
});

export async function searchProspectDiscoveryAction(input: unknown) {
  const user = await requirePermission(permissions.prospectsWrite);
  const query = prospectDiscoveryQuerySchema.parse(input);
  await recordProspectApiRequest(user.id, "assisted-search");

  const resolution: DiscoveryProviderResolution = resolveProspectDiscoveryProvider();
  if (!resolution.available) return { ok: false as const, reason: resolution.reason };

  try {
    const results = await resolution.provider.search(query);
    return { ok: true as const, results };
  } catch {
    return { ok: false as const, reason: "unavailable" as const };
  }
}

export async function importProspectCsvAction(formData: FormData) {
  const user = await requirePermission(permissions.prospectsWrite);
  const rawRows = value(formData, "rows");
  if (rawRows.length > 500_000) throw new Error("O conteúdo excede o limite permitido.");
  let rows: unknown;
  try { rows = JSON.parse(rawRows); } catch { throw new Error("Os dados CSV não são válidos."); }
  if (!Array.isArray(rows)) throw new Error("Os dados CSV não são válidos.");
  await recordProspectApiRequest(user.id, "csv-import");
  const result = await importProspects(rows, user.id);
  revalidatePath("/prospects");
  redirect(`/prospects?imported=${result.imported}&rejected=${result.rejected}`);
}

export async function saveProspectTemplateAction(formData: FormData) {
  const user = await requirePermission(permissions.prospectsWrite);
  const input = prospectEmailTemplateSchema.parse({
    id: value(formData, "id") || undefined,
    name: value(formData, "name"),
    industry: value(formData, "industry"),
    purpose: value(formData, "purpose"),
    locale: "pt-PT",
    subject: value(formData, "subject"),
    body: value(formData, "body"),
  });
  await recordProspectApiRequest(user.id, "template-save");
  await saveProspectTemplate(input, user.id);
  revalidatePath("/prospects/templates");
  redirect("/prospects/templates?success=1");
}

export async function saveProspectDraftAction(formData: FormData) {
  const user = await requirePermission(permissions.prospectsWrite);
  const input = prospectDraftSchema.parse({
    prospectId: value(formData, "prospectId"),
    templateId: value(formData, "templateId"),
    subject: value(formData, "subject"),
    body: value(formData, "body"),
    publicDemoSlug: value(formData, "publicDemoSlug"),
  });
  await recordProspectApiRequest(user.id, "draft-generate");
  await saveProspectDraft(input, user.id);
  revalidatePath(`/prospects/${input.prospectId}`);
  redirect(`/prospects/${input.prospectId}?draftSaved=1`);
}

export async function markProspectDraftExportedAction(formData: FormData) {
  const user = await requirePermission(permissions.prospectsWrite);
  const { id } = prospectIdSchema.parse({ id: value(formData, "draftId") });
  if (value(formData, "confirmed") !== "yes") throw new Error("Confirma a revisão do destinatário, da origem e dos factos antes de copiar.");
  await recordProspectApiRequest(user.id, "draft-copy");
  const result = await markDraftManuallyExported(id, user.id);
  if (!result.ok) return result;
  revalidatePath("/prospects");
  return result;
}

export async function convertProspectAction(formData: FormData) {
  const user = await requirePermission(permissions.prospectsWrite);
  const { id } = prospectIdSchema.parse({ id: value(formData, "id") });
  const result = await convertProspectToClient(id, user.id);
  revalidatePath("/clients");
  revalidatePath("/prospects");
  redirect(`/clients/${result.clientId}`);
}
