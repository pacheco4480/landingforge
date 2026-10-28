"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import {
  ProjectApprovalDecision,
  ProjectApprovalType,
  ProjectAssetKind,
  ProjectAssetStatus,
  ProjectChecklistKey,
  ProjectChecklistStatus,
  ProjectMeetingType,
  ProjectProposalStatus,
} from "@/generated/prisma/client";
import {
  applyBriefingMappedContent,
  createBriefingShare,
  createProjectAsset,
  createProjectMeeting,
  createProjectProposal,
  generateProjectAiContext,
  generateProjectSpecification,
  recordBriefingApproval,
  recordSharedBriefingApproval,
  requestBriefingReview,
  revokeBriefingShares,
  reviewProjectAsset,
  saveProjectBriefingDraft,
  submitSharedBriefing,
  updateProjectChecklistItem,
} from "@/features/briefings/briefing.service";
import { briefingApprovalTypeSchema } from "@/features/briefings/schemas/briefing-approval.schema";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";
import { assertRateLimit } from "@/lib/security/rate-limiter";

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

function requiredId(data: FormData, name = "projectId") {
  return z.string().uuid().parse(text(data, name));
}

function answerValues(data: FormData) {
  const answers: Record<string, string> = {};
  for (const [key, value] of data.entries()) {
    if (key.startsWith("answer:") && typeof value === "string")
      answers[key.slice("answer:".length)] = value;
  }
  return answers;
}

function list(data: FormData, name: string) {
  return text(data, name)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function refreshProject(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}

export async function saveProjectBriefingAction(data: FormData) {
  const user = await requirePermission(permissions.projectsWrite);
  const projectId = requiredId(data);
  const revision = await saveProjectBriefingDraft({
    projectId,
    answers: answerValues(data),
    expectedVersion: z.coerce
      .number()
      .int()
      .nonnegative()
      .parse(text(data, "expectedVersion")),
    actor: user,
  });
  refreshProject(projectId);
  return revision;
}

export async function requestBriefingReviewAction(data: FormData) {
  const user = await requirePermission(permissions.projectsWrite);
  const projectId = requiredId(data);
  await requestBriefingReview(
    projectId,
    user,
    z.coerce.number().int().positive().parse(text(data, "expectedVersion")),
  );
  refreshProject(projectId);
}

export async function recordBriefingApprovalAction(data: FormData) {
  const user = await requirePermission(permissions.projectsWrite);
  const projectId = requiredId(data);
  await recordBriefingApproval({
    projectId,
    type: briefingApprovalTypeSchema.parse(text(data, "type")),
    decision: z
      .nativeEnum(ProjectApprovalDecision)
      .parse(text(data, "decision")),
    comment: z.string().max(1500).parse(text(data, "comment")),
    actor: user,
  });
  refreshProject(projectId);
}

export async function applyBriefingMappedContentAction(data: FormData) {
  const user = await requirePermission(permissions.projectsWrite);
  const projectId = requiredId(data);
  const result = await applyBriefingMappedContent({
    projectId,
    expectedVersion: z.coerce
      .number()
      .int()
      .positive()
      .parse(text(data, "expectedVersion")),
    actor: user,
  });
  refreshProject(projectId);
  return result;
}

function projectUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.AUTH_URL;
  if (!baseUrl)
    throw new Error(
      "Configura NEXT_PUBLIC_SITE_URL ou AUTH_URL para gerar ligações partilháveis.",
    );
  const url = new URL(baseUrl);
  if (url.protocol !== "https:" && url.hostname !== "localhost")
    throw new Error("A ligação partilhável exige HTTPS.");
  return new URL(path, url).toString();
}

export async function createBriefingShareAction(data: FormData) {
  const user = await requirePermission(permissions.projectsWrite);
  const projectId = requiredId(data);
  const releaseExportId = text(data, "releaseExportId");
  const share = await createBriefingShare(
    projectId,
    user,
    releaseExportId ? z.string().uuid().parse(releaseExportId) : undefined,
  );
  refreshProject(projectId);
  return {
    url: projectUrl(`/briefing/${share.token}`),
    expiresAt: share.expiresAt.toISOString(),
    releaseChecksum: share.releaseChecksum,
  };
}

export async function revokeBriefingSharesAction(data: FormData) {
  const user = await requirePermission(permissions.projectsWrite);
  const projectId = requiredId(data);
  await revokeBriefingShares(projectId, user);
  refreshProject(projectId);
}

export async function createProjectMeetingAction(data: FormData) {
  const user = await requirePermission(permissions.projectsWrite);
  const projectId = requiredId(data);
  await createProjectMeeting({
    projectId,
    type: z.nativeEnum(ProjectMeetingType).parse(text(data, "type")),
    title: z.string().trim().min(2).max(160).parse(text(data, "title")),
    happenedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .transform((date) => new Date(`${date}T12:00:00.000Z`))
      .parse(text(data, "happenedAt")),
    summary: z.string().trim().min(2).max(5000).parse(text(data, "summary")),
    decisions: list(data, "decisions"),
    actionItems: list(data, "actionItems"),
    actor: user,
  });
  refreshProject(projectId);
}

export async function createProjectProposalAction(data: FormData) {
  const user = await requirePermission(permissions.projectsWrite);
  const projectId = requiredId(data);
  const amount = text(data, "amount");
  const input = {
    projectId,
    packageName: z
      .string()
      .trim()
      .min(2)
      .max(160)
      .parse(text(data, "packageName")),
    scope: z.string().trim().min(2).max(8000).parse(text(data, "scope")),
    amount: amount
      ? z
          .string()
          .regex(/^\d{1,10}(\.\d{1,2})?$/)
          .parse(amount)
      : undefined,
    currency: z
      .string()
      .length(3)
      .parse(text(data, "currency") || "EUR"),
    supportTerms: z.string().max(3000).parse(text(data, "supportTerms")),
    maintenanceTerms: z
      .string()
      .max(3000)
      .parse(text(data, "maintenanceTerms")),
    validUntil: text(data, "validUntil")
      ? z.coerce.date().parse(text(data, "validUntil"))
      : undefined,
    actor: user,
  };
  await createProjectProposal(input);
  refreshProject(projectId);
}

export async function updateProjectProposalStatusAction(data: FormData) {
  const user = await requirePermission(permissions.projectsWrite);
  const projectId = requiredId(data);
  const proposalId = z.string().uuid().parse(text(data, "proposalId"));
  const status = z
    .nativeEnum(ProjectProposalStatus)
    .parse(text(data, "status"));
  const { updateProjectProposalStatus } =
    await import("@/features/briefings/briefing.service");
  await updateProjectProposalStatus({
    projectId,
    proposalId,
    status,
    actor: user,
  });
  refreshProject(projectId);
}

export async function createProjectAssetAction(data: FormData) {
  const user = await requirePermission(permissions.projectsWrite);
  const projectId = requiredId(data);
  const sourceUrl = text(data, "sourceUrl");
  const mediaAssetId = text(data, "mediaAssetId");
  if (mediaAssetId) await requirePermission(permissions.mediaRead);
  await createProjectAsset({
    projectId,
    kind: z.nativeEnum(ProjectAssetKind).parse(text(data, "kind")),
    title: z.string().trim().min(2).max(160).parse(text(data, "title")),
    sectionKey: z.string().max(120).parse(text(data, "sectionKey")),
    content: z.string().max(8000).parse(text(data, "content")),
    sourceUrl: sourceUrl
      ? z
          .string()
          .url()
          .max(2048)
          .refine(
            (value) => /^https?:\/\//i.test(value),
            "A ligação tem de usar HTTPS ou HTTP.",
          )
          .parse(sourceUrl)
      : undefined,
    mediaAssetId: mediaAssetId
      ? z.string().uuid().parse(mediaAssetId)
      : undefined,
    actor: user,
  });
  refreshProject(projectId);
}

export async function reviewProjectAssetAction(data: FormData) {
  const user = await requirePermission(permissions.projectsWrite);
  const projectId = requiredId(data);
  await reviewProjectAsset({
    projectId,
    assetId: z.string().uuid().parse(text(data, "assetId")),
    status: z.nativeEnum(ProjectAssetStatus).parse(text(data, "status")),
    reviewNote: z.string().max(1000).parse(text(data, "reviewNote")),
    rightsConfirmed: text(data, "rightsConfirmed") === "on",
    actor: user,
  });
  refreshProject(projectId);
}

export async function updateProjectChecklistAction(data: FormData) {
  const user = await requirePermission(permissions.projectsWrite);
  const projectId = requiredId(data);
  const key = z.nativeEnum(ProjectChecklistKey).parse(text(data, "key"));
  const reference = text(data, "reference");
  await updateProjectChecklistItem({
    projectId,
    key,
    status: z.nativeEnum(ProjectChecklistStatus).parse(text(data, "status")),
    note: z.string().max(1000).parse(text(data, "note")),
    reference:
      key === ProjectChecklistKey.PAYMENT
        ? z.string().max(120).parse(reference)
        : undefined,
    actor: user,
  });
  refreshProject(projectId);
}

export async function generateProjectAiContextAction(data: FormData) {
  const user = await requirePermission(permissions.projectsWrite);
  const projectId = requiredId(data);
  const selectedFields = data
    .getAll("selectedFields")
    .filter((value): value is string => typeof value === "string")
    .slice(0, 100);
  const result = await generateProjectAiContext({
    projectId,
    purpose: z.string().trim().min(3).max(500).parse(text(data, "purpose")),
    selectedFields,
    format: z.enum(["markdown", "json"]).parse(text(data, "format")),
    actor: user,
  });
  refreshProject(projectId);
  return result;
}

export async function generateProjectSpecificationAction(data: FormData) {
  const user = await requirePermission(permissions.projectsWrite);
  return generateProjectSpecification({
    projectId: requiredId(data),
    audience: z.enum(["internal", "client"]).parse(text(data, "audience")),
    format: z.enum(["markdown", "json"]).parse(text(data, "format")),
    actor: user,
  });
}

export type SharedBriefingActionState = { error?: string; success?: boolean };

function sharedInput(data: FormData) {
  return {
    token: z
      .string()
      .regex(/^[A-Za-z0-9_-]{40,60}$/)
      .parse(text(data, "token")),
    expectedVersion: z.coerce
      .number()
      .int()
      .positive()
      .parse(text(data, "expectedVersion")),
  };
}

async function rateLimitShare(token: string) {
  const shareHash = createHash("sha256").update(token).digest("hex");
  const requestHeaders = await headers();
  await assertRateLimit({
    action: "api",
    key: `briefing-share:${shareHash}`,
    ipAddress: null,
    userAgent: requestHeaders.get("user-agent"),
  });
}

export async function submitSharedBriefingAction(
  _state: SharedBriefingActionState,
  data: FormData,
): Promise<SharedBriefingActionState> {
  try {
    const { token, expectedVersion } = sharedInput(data);
    await rateLimitShare(token);
    await submitSharedBriefing({
      token,
      expectedVersion,
      submittedByName: z
        .string()
        .trim()
        .min(2)
        .max(120)
        .parse(text(data, "submittedByName")),
      answers: answerValues(data),
    });
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível enviar as respostas.",
    };
  }
}

export async function approveSharedBriefingAction(
  _state: SharedBriefingActionState,
  data: FormData,
): Promise<SharedBriefingActionState> {
  try {
    const { token, expectedVersion } = sharedInput(data);
    await rateLimitShare(token);
    await recordSharedBriefingApproval({
      token,
      expectedVersion,
      type: z
        .enum(["SCOPE", "CONTENT", "DESIGN", "RELEASE"])
        .parse(text(data, "type")) as ProjectApprovalType,
      decision: z
        .nativeEnum(ProjectApprovalDecision)
        .parse(text(data, "decision")),
      name: z.string().trim().min(2).max(120).parse(text(data, "name")),
      comment: z.string().max(1500).parse(text(data, "comment")),
      expectedPreviewChecksum: z
        .string()
        .regex(/^[a-f0-9]{64}$/i)
        .optional()
        .parse(text(data, "expectedPreviewChecksum") || undefined),
      expectedReleaseChecksum: z
        .string()
        .regex(/^[a-f0-9]{64}$/i)
        .optional()
        .parse(text(data, "expectedReleaseChecksum") || undefined),
    });
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível registar a decisão.",
    };
  }
}
