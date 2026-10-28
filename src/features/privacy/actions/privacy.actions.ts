"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { PrivacyRequestStatus, PrivacyRequestType } from "@/generated/prisma/client";
import {
  createPrivacyRequest,
  updatePrivacyRequest,
  updateRetentionPolicy,
} from "@/features/privacy/services/privacy.service";
import { privacyExtensionChannels } from "@/features/privacy/privacy-workflow";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

const policyInput = z.object({
  id: z.uuid(),
  retentionDays: z.coerce.number().int().min(1).max(3650),
  purpose: z.string().trim().min(10).max(500),
  legalBasisNote: z.string().trim().min(10).max(500),
});

export async function updateRetentionPolicyAction(formData: FormData) {
  const user = await requirePermission(permissions.adminAccess);
  const input = policyInput.parse({
    id: text(formData, "id"),
    retentionDays: text(formData, "retentionDays"),
    purpose: text(formData, "purpose"),
    legalBasisNote: text(formData, "legalBasisNote"),
  });
  await updateRetentionPolicy({ ...input, enabled: formData.has("enabled") }, user);
  revalidatePath("/privacy");
}

export async function createPrivacyRequestAction(formData: FormData) {
  const user = await requirePermission(permissions.adminAccess);
  const input = z.object({
    type: z.enum(PrivacyRequestType),
    requesterName: z.string().trim().min(1).max(160),
    requesterEmail: z.email().max(254),
    clientId: z.union([z.uuid(), z.literal("")]),
    projectId: z.union([z.uuid(), z.literal("")]),
    dueAt: z.union([z.iso.date(), z.literal("")]),
  }).parse({
    type: text(formData, "type"),
    requesterName: text(formData, "requesterName"),
    requesterEmail: text(formData, "requesterEmail"),
    clientId: text(formData, "clientId"),
    projectId: text(formData, "projectId"),
    dueAt: text(formData, "dueAt"),
  });
  await createPrivacyRequest({
    ...input,
    clientId: input.clientId || null,
    projectId: input.projectId || null,
    dueAt: input.dueAt || null,
  }, user);
  revalidatePath("/privacy");
}

export async function updatePrivacyRequestAction(formData: FormData) {
  const user = await requirePermission(permissions.adminAccess);
  const input = z.object({
    id: z.uuid(),
    status: z.enum(PrivacyRequestStatus),
    identityVerificationMethod: z.string().trim().max(160),
    decisionSummary: z.string().trim().max(1000),
    dueAt: z.union([z.iso.date(), z.literal("")]),
    extensionCommunicatedAt: z.union([z.iso.date(), z.literal("")]),
    extensionCommunicationChannel: z.union([z.enum(privacyExtensionChannels), z.literal("")]),
  }).parse({
    id: text(formData, "id"),
    status: text(formData, "status"),
    identityVerificationMethod: text(formData, "identityVerificationMethod"),
    decisionSummary: text(formData, "decisionSummary"),
    dueAt: text(formData, "dueAt"),
    extensionCommunicatedAt: text(formData, "extensionCommunicatedAt"),
    extensionCommunicationChannel: text(formData, "extensionCommunicationChannel"),
  });
  await updatePrivacyRequest({
    ...input,
    dueAt: input.dueAt || null,
    extensionCommunicatedAt: input.extensionCommunicatedAt || null,
  }, user);
  revalidatePath("/privacy");
}
