"use server";

import { revalidatePath } from "next/cache";

import { ProjectMaintenanceDestination } from "@/generated/prisma/client";
import { permissions } from "@/features/rbac/permissions";
import {
  createMaintenanceRelease,
  createTemplateRebaseCandidate,
  recordMaintenanceApproval,
  recordMaintenancePublication,
  resolveTemplateRebaseConflict,
  saveMaintenanceCodeChange,
  validateMaintenanceRelease,
} from "@/features/projects/services/project-maintenance.service";
import { requirePermission } from "@/lib/auth/require-permission";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

function revalidateProject(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/maintenance`);
}

export async function createMaintenanceReleaseAction(formData: FormData) {
  const actor = await requirePermission(permissions.projectsWrite);
  const projectId = value(formData, "projectId");
  const rollbackToReleaseId = value(formData, "rollbackToReleaseId") || undefined;
  const release = await createMaintenanceRelease({
    projectId,
    summary: value(formData, "changeSummary"),
    approvalRequired: value(formData, "approvalRequired") === "on",
    rollbackToReleaseId,
    actor,
  });
  revalidateProject(projectId);
  revalidatePath(`/projects/${projectId}/maintenance/${release.id}`);
}

export async function createTemplateRebaseCandidateAction(formData: FormData) {
  const actor = await requirePermission(permissions.projectsWrite);
  const projectId = value(formData, "projectId");
  const release = await createTemplateRebaseCandidate({
    projectId,
    sourcePageId: value(formData, "sourcePageId"),
    summary: value(formData, "changeSummary"),
    approvalRequired: value(formData, "approvalRequired") === "on",
    actor,
  });
  revalidateProject(projectId);
  revalidatePath(`/projects/${projectId}/maintenance/${release.id}`);
}

export async function validateMaintenanceReleaseAction(formData: FormData) {
  const actor = await requirePermission(permissions.projectsWrite);
  const projectId = value(formData, "projectId");
  await validateMaintenanceRelease(projectId, value(formData, "releaseId"), actor);
  revalidateProject(projectId);
}

export async function resolveTemplateRebaseConflictAction(formData: FormData) {
  const actor = await requirePermission(permissions.projectsWrite);
  const projectId = value(formData, "projectId");
  const decision = value(formData, "decision");
  if (decision !== "CURRENT" && decision !== "TEMPLATE") throw new Error("Seleciona uma decisão válida para o conflito.");
  await resolveTemplateRebaseConflict({
    projectId,
    releaseId: value(formData, "releaseId"),
    conflictPath: value(formData, "conflictPath"),
    decision,
    actor,
  });
  revalidateProject(projectId);
  revalidatePath(`/projects/${projectId}/maintenance/${value(formData, "releaseId")}`);
}

export async function saveMaintenanceCodeChangeAction(formData: FormData) {
  const actor = await requirePermission(permissions.projectsWrite);
  const projectId = value(formData, "projectId");
  const releaseId = value(formData, "releaseId");
  await saveMaintenanceCodeChange({
    projectId,
    releaseId,
    sourcePath: value(formData, "sourcePath"),
    content: value(formData, "content"),
    actor,
  });
  revalidateProject(projectId);
  revalidatePath(`/projects/${projectId}/maintenance/${releaseId}`);
}

export async function recordMaintenanceApprovalAction(formData: FormData) {
  const actor = await requirePermission(permissions.projectsWrite);
  const projectId = value(formData, "projectId");
  await recordMaintenanceApproval(projectId, value(formData, "releaseId"), value(formData, "approvalReference"), actor);
  revalidateProject(projectId);
}

export async function recordMaintenancePublicationAction(formData: FormData) {
  const actor = await requirePermission(permissions.projectsWrite);
  const projectId = value(formData, "projectId");
  const destination = value(formData, "destination");
  if (!Object.values(ProjectMaintenanceDestination).includes(destination as ProjectMaintenanceDestination)) {
    throw new Error("Seleciona um destino de publicação válido.");
  }
  await recordMaintenancePublication({
    projectId,
    releaseId: value(formData, "releaseId"),
    destination: destination as ProjectMaintenanceDestination,
    destinationLabel: value(formData, "destinationLabel"),
    verification: value(formData, "verification"),
    actor,
  });
  revalidateProject(projectId);
}
