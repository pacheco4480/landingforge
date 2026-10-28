import { ClientPackageExportStatus, ProjectDeliveryMode, Prisma } from "@/generated/prisma/client";
import { auditClientPackage } from "@/features/exports/services/client-package-audit";
import { buildClientRuntimeComposition } from "@/features/exports/services/client-runtime-composition";
import { assembleAuditedLandingOnlyPackage, type BuiltClientPackage } from "@/features/exports/services/client-package-assembler";
import { assembleAuditedClientCmsPackage } from "@/features/exports/services/client-cms-project-assembler";
import { verifyClientCmsTenantIsolation } from "@/features/exports/services/client-cms-isolation-verification";
import { buildProjectSourceSnapshot, validateProjectSourceSnapshot } from "@/features/exports/services/project-source-snapshot";
import { purgeExpiredClientPackageExports } from "@/features/exports/services/client-package-export-retention";
import { projectWhereForActor } from "@/features/projects/project-access";
import { db } from "@/lib/db";

const HISTORY_RETENTION_DAYS = 90;

type ProjectActor = { id: string; roles: readonly string[] };

function expiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + HISTORY_RETENTION_DAYS);
  return expiresAt;
}

function failedBuildAudit(mode: ProjectDeliveryMode, tenantIsolationPassed = false, isolatedBuildPassed = false) {
  return auditClientPackage({ mode, entries: [], isolatedBuildPassed, tenantIsolationPassed });
}

function safeFailureCode(error: unknown) {
  if (error instanceof Error && error.message.includes("versão do template")) return "TEMPLATE_VERSION_DRIFT";
  if (error instanceof Error && error.message.includes("HTTPS público")) return "ASSET_REJECTED";
  if (error instanceof Error && error.message.includes("build")) return "ISOLATED_BUILD_FAILED";
  return "PACKAGE_GENERATION_FAILED";
}

async function recordFailure(input: {
  projectId: string;
  actor: ProjectActor;
  templateVersion: string;
  code: string;
  mode: ProjectDeliveryMode;
  status?: ClientPackageExportStatus;
  audit?: ReturnType<typeof auditClientPackage>;
}) {
  const audit = input.audit ?? failedBuildAudit(input.mode);
  return db.clientPackageExport.create({
    data: {
      projectId: input.projectId,
      createdByUserId: input.actor.id,
      status: input.status ?? ClientPackageExportStatus.FAILED,
      mode: input.mode,
      templateVersion: input.templateVersion,
      auditReport: audit as unknown as Prisma.InputJsonValue,
      fileCount: 0,
      totalBytes: 0,
      failureCode: input.code,
      expiresAt: expiryDate(),
    },
    select: { id: true, status: true, createdAt: true, expiresAt: true, failureCode: true, auditReport: true },
  });
}

export async function listClientPackageExports(projectId: string, actor: ProjectActor) {
  await purgeExpiredClientPackageExports();
  const project = await db.project.findFirst({
    where: { id: projectId, deletedAt: null, ...projectWhereForActor(actor) },
    select: { id: true },
  });
  if (!project) throw new Error("Projeto não encontrado ou sem acesso.");
  return db.clientPackageExport.findMany({
    where: { projectId, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      status: true,
      mode: true,
      templateVersion: true,
      auditReport: true,
      artifactChecksum: true,
      sourceChecksum: true,
      fileCount: true,
      totalBytes: true,
      downloadStartedAt: true,
      failureCode: true,
      createdAt: true,
      expiresAt: true,
    },
  });
}

export type ClientPackageExportResult =
  | { ok: true; recordId: string; package: BuiltClientPackage }
  | { ok: false; recordId: string; code: string; audit: unknown };

async function createProjectExport(projectId: string, actor: ProjectActor, mode: ProjectDeliveryMode): Promise<ClientPackageExportResult> {
  await purgeExpiredClientPackageExports();
  const project = await db.project.findFirst({
    where: { id: projectId, deletedAt: null, ...projectWhereForActor(actor) },
    select: {
      id: true,
      name: true,
      deliveryMode: true,
      siteManagementOwner: true,
      hostingOwner: true,
      domainOwner: true,
      contentOwner: true,
      publishingOwner: true,
      maintenancePlan: true,
      maintenanceScope: true,
      maintenanceChannel: true,
      maintenanceWindow: true,
      templateVersion: true,
      sourceVersions: {
        orderBy: { version: "desc" },
        take: 1,
        select: {
          templateVersion: true,
          checksum: true,
          snapshot: true,
          provisionedPage: {
            include: {
              template: { select: { key: true } },
              templateVariant: { select: { key: true } },
              theme: true,
              sections: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
              forms: { where: { deletedAt: null }, include: { fields: { orderBy: { sortOrder: "asc" } } } },
              seoSetting: true,
            },
          },
        },
      },
    },
  });
  if (!project) throw new Error("Projeto não encontrado ou sem acesso.");
  if (project.deliveryMode !== mode) {
    const record = await recordFailure({ projectId, actor, templateVersion: project.templateVersion ?? "indefinida", code: "DELIVERY_MODE_NOT_SUPPORTED", mode, status: ClientPackageExportStatus.BLOCKED });
    return { ok: false, recordId: record.id, code: "DELIVERY_MODE_NOT_SUPPORTED", audit: record.auditReport };
  }

  const version = project.sourceVersions[0];
  const page = version?.provisionedPage;
  if (!version || !page) {
    const record = await recordFailure({ projectId, actor, templateVersion: project.templateVersion ?? "indefinida", code: "PROJECT_SOURCE_NOT_PROVISIONED", mode, status: ClientPackageExportStatus.BLOCKED });
    return { ok: false, recordId: record.id, code: "PROJECT_SOURCE_NOT_PROVISIONED", audit: record.auditReport };
  }

  try {
    const pinnedSnapshot = validateProjectSourceSnapshot(version.snapshot, version.checksum);
    if (pinnedSnapshot.templateVersion !== project.templateVersion) {
      throw new Error("A versão do template no projeto diverge do snapshot provisionado.");
    }
    const snapshot = buildProjectSourceSnapshot(page);
    if (snapshot.templateVersion !== version.templateVersion || snapshot.templateVersion !== project.templateVersion) {
      throw new Error("A versão do template no projeto diverge da fonte provisionada.");
    }
    const composition = buildClientRuntimeComposition(
      snapshot.snapshot,
      snapshot.checksum,
      mode,
      projectId,
      undefined,
      {
        siteManagementOwner: project.siteManagementOwner,
        hostingOwner: project.hostingOwner,
        domainOwner: project.domainOwner,
        contentOwner: project.contentOwner,
        publishingOwner: project.publishingOwner,
        maintenancePlan: project.maintenancePlan,
        maintenanceScope: project.maintenanceScope,
        maintenanceChannel: project.maintenanceChannel,
        maintenanceWindow: project.maintenanceWindow,
      },
    );
    let tenantIsolationPassed = true;
    if (mode === ProjectDeliveryMode.LANDING_WITH_CMS) {
      const verification = verifyClientCmsTenantIsolation();
      tenantIsolationPassed = verification.passed;
      if (!tenantIsolationPassed) {
        const audit = failedBuildAudit(mode, false, false);
        const record = await recordFailure({
          projectId,
          actor,
          templateVersion: project.templateVersion ?? version.templateVersion,
          code: "TENANT_ISOLATION_NOT_VERIFIED",
          mode,
          status: ClientPackageExportStatus.BLOCKED,
          audit,
        });
        return { ok: false, recordId: record.id, code: "TENANT_ISOLATION_NOT_VERIFIED", audit: record.auditReport };
      }
    }
    const builtPackage = mode === ProjectDeliveryMode.LANDING_WITH_CMS
      ? await assembleAuditedClientCmsPackage(composition, tenantIsolationPassed)
      : await assembleAuditedLandingOnlyPackage(composition);
    const record = await db.clientPackageExport.create({
      data: {
        projectId,
        createdByUserId: actor.id,
        status: builtPackage.audit.ready ? ClientPackageExportStatus.READY : ClientPackageExportStatus.BLOCKED,
        mode,
        templateVersion: builtPackage.templateVersion,
        auditReport: builtPackage.audit as unknown as Prisma.InputJsonValue,
        artifactChecksum: builtPackage.audit.ready ? builtPackage.checksum : null,
        sourceChecksum: builtPackage.audit.ready ? snapshot.checksum : null,
        fileCount: builtPackage.fileCount,
        totalBytes: builtPackage.totalBytes,
        downloadStartedAt: builtPackage.audit.ready ? new Date() : null,
        failureCode: builtPackage.audit.ready ? null : "AUDIT_BLOCKED",
        expiresAt: expiryDate(),
      },
      select: { id: true },
    });
    if (!builtPackage.audit.ready) return { ok: false, recordId: record.id, code: "AUDIT_BLOCKED", audit: builtPackage.audit };
    return { ok: true, recordId: record.id, package: builtPackage };
  } catch (error) {
    const code = safeFailureCode(error);
    const record = await recordFailure({ projectId, actor, templateVersion: project.templateVersion ?? version.templateVersion, code, mode });
    return { ok: false, recordId: record.id, code, audit: record.auditReport };
  }
}

export async function createLandingOnlyExport(projectId: string, actor: ProjectActor) {
  return createProjectExport(projectId, actor, ProjectDeliveryMode.LANDING_ONLY);
}

export async function createLandingWithCmsExport(projectId: string, actor: ProjectActor) {
  return createProjectExport(projectId, actor, ProjectDeliveryMode.LANDING_WITH_CMS);
}
