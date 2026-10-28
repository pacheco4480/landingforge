"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { projectIdSchema, projectSchema } from "@/features/projects/schemas/project.schema";
import {
  createProject,
  updateProject,
} from "@/features/projects/services/project.service";
import { provisionProjectSource } from "@/features/projects/services/project-provisioning.service";
import { permissions } from "@/features/rbac/permissions";
import { requirePermission } from "@/lib/auth/require-permission";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

function input(formData: FormData, canAssign: boolean) {
  return projectSchema.parse({
    clientId: value(formData, "clientId"),
    name: value(formData, "name"),
    serviceType: value(formData, "serviceType"),
    status: value(formData, "status"),
    priority: value(formData, "priority"),
    industryId: value(formData, "industryId"),
    templateId: value(formData, "templateId"),
    templateVariantId: value(formData, "templateVariantId"),
    deliveryMode: value(formData, "deliveryMode"),
    siteManagementOwner: value(formData, "siteManagementOwner"),
    hostingOwner: value(formData, "hostingOwner"),
    domainOwner: value(formData, "domainOwner"),
    contentOwner: value(formData, "contentOwner"),
    publishingOwner: value(formData, "publishingOwner"),
    maintenancePlan: value(formData, "maintenancePlan"),
    maintenanceScope: value(formData, "maintenanceScope"),
    maintenanceChannel: value(formData, "maintenanceChannel"),
    maintenanceWindow: value(formData, "maintenanceWindow"),
    startDate: value(formData, "startDate"),
    deliveryDate: value(formData, "deliveryDate"),
    serviceEndedAt: value(formData, "serviceEndedAt"),
    assigneeIds: canAssign
      ? formData.getAll("assigneeIds").filter((item): item is string => typeof item === "string")
      : [],
  });
}

export async function createProjectAction(formData: FormData) {
  const user = await requirePermission(permissions.projectsWrite);
  const canAssign = user.permissions.includes(permissions.projectsAssign);
  const project = await createProject(input(formData, canAssign), user, canAssign);
  revalidatePath("/projects");
  revalidatePath("/clients");
  redirect(`/projects/${project.id}`);
}

export async function updateProjectAction(formData: FormData) {
  const user = await requirePermission(permissions.projectsWrite);
  const { id } = projectIdSchema.parse({ id: value(formData, "id") });
  const canAssign = user.permissions.includes(permissions.projectsAssign);
  await updateProject(id, input(formData, canAssign), user, canAssign);
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/clients");
}

export async function provisionProjectSourceAction(formData: FormData) {
  const user = await requirePermission(permissions.projectsWrite);
  const { id } = projectIdSchema.parse({ id: value(formData, "id") });
  await provisionProjectSource(id, user);
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects");
}
