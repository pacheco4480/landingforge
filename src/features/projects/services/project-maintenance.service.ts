import { randomUUID } from "node:crypto";

import {
  DemoStatus,
  FormFieldType,
  FormStatus,
  FormType,
  ProjectDeliveryMode,
  ProjectMaintenanceDestination,
  ProjectMaintenanceReleaseStatus,
  Prisma,
} from "@/generated/prisma/client";
import { buildClientRuntimeComposition } from "@/features/exports/services/client-runtime-composition";
import { assembleAuditedLandingOnlyPackage } from "@/features/exports/services/client-package-assembler";
import { listClientRuntimeMaintenanceSources } from "@/features/exports/services/client-runtime-project-assembler";
import {
  buildProjectSourceSnapshot,
  overrideProjectSourceSnapshotSlug,
  validateHistoricalProjectSourceSnapshot,
} from "@/features/exports/services/project-source-snapshot";
import { projectWhereForActor } from "@/features/projects/project-access";
import { db } from "@/lib/db";
import type { PublicRendererContext } from "@/features/public-renderer/types";
import {
  applyTemplateFieldConflict,
  parseFormConflict,
  parseFormFieldConflict,
  rebaseProjectSnapshot,
} from "@/features/projects/services/template-rebase";
import {
  assertMaintenanceCodeChangesWithinLimits,
  maintenanceCodeChanges,
  maintenanceReleaseSourceChecksum,
  sourceChecksum,
  validateMaintenanceCodeChangeInput,
} from "@/features/projects/services/maintenance-code-changes";

export type MaintenanceActor = {
  id: string;
  roles: readonly string[];
  permissions: readonly string[];
};

const pageForSnapshot = {
  template: { select: { key: true } },
  templateVariant: { select: { key: true } },
  theme: true,
  sections: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" as const } },
  forms: { where: { deletedAt: null }, include: { fields: { orderBy: { sortOrder: "asc" as const } } } },
  seoSetting: true,
};

function assertCanMaintain(actor: MaintenanceActor) {
  if (!actor.permissions.includes("projects.write")) {
    throw new Error("Não tens permissão para gerir manutenção de projetos.");
  }
}

async function getManagedProject(projectId: string, actor: MaintenanceActor) {
  assertCanMaintain(actor);
  const project = await db.project.findFirst({
    where: { id: projectId, deletedAt: null, ...projectWhereForActor(actor) },
    select: {
      id: true,
      deliveryMode: true,
      maintenancePlan: true,
      maintenanceScope: true,
      templateVersion: true,
      templateId: true,
      templateVariantId: true,
      sourceVersions: { orderBy: { version: "desc" }, take: 1, select: { id: true, sourcePageId: true, provisionedPageId: true, provisionedPage: { select: { slug: true } }, templateVersion: true, checksum: true, snapshot: true } },
    },
  });
  if (!project) throw new Error("Projeto não encontrado ou sem acesso.");
  if (project.deliveryMode !== ProjectDeliveryMode.LANDING_ONLY) {
    throw new Error("A manutenção gerida desta tarefa aplica-se apenas a projetos Landing Only.");
  }
  if (project.maintenancePlan === "NONE") {
    throw new Error("O projeto não tem manutenção contratada ou autorizada.");
  }
  return project;
}

export async function listProjectMaintenanceReleases(projectId: string, actor: MaintenanceActor) {
  await getManagedProject(projectId, actor);
  return db.projectMaintenanceRelease.findMany({
    where: { projectId },
    orderBy: { version: "desc" },
    take: 30,
    select: {
      id: true,
      version: true,
      status: true,
      candidatePageId: true,
      baseReleaseId: true,
      rollbackTargetReleaseId: true,
      rebaseReport: true,
      changeSummary: true,
      sourceChecksum: true,
      packageChecksum: true,
      packageDownloadedAt: true,
      validationReport: true,
      approvalRequired: true,
      approvedAt: true,
      destination: true,
      destinationLabel: true,
      publishedAt: true,
      deploymentVerification: true,
      failureCode: true,
      createdAt: true,
      candidatePage: { select: { title: true } },
      createdBy: { select: { name: true, email: true } },
      approvedBy: { select: { name: true, email: true } },
      publishedBy: { select: { name: true, email: true } },
      baseRelease: { select: { version: true, status: true } },
      rollbackTarget: { select: { version: true, status: true } },
    },
  });
}

export async function listProjectTemplateRebaseSources(projectId: string, actor: MaintenanceActor) {
  const project = await getManagedProject(projectId, actor);
  if (!project.templateId || !project.templateVariantId) return [];
  return db.page.findMany({
    where: {
      templateId: project.templateId,
      templateVariantId: project.templateVariantId,
      isDemo: true,
      status: "PUBLISHED",
      demoStatus: { in: [DemoStatus.READY, DemoStatus.PUBLISHED] },
      deletedAt: null,
    },
    select: { id: true, title: true, slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}

async function duplicateProjectPage(
  tx: Prisma.TransactionClient,
  projectId: string,
  sourcePageId: string,
  version: number,
) {
  const source = await tx.page.findFirst({ where: { id: sourcePageId, deletedAt: null }, include: pageForSnapshot });
  if (!source) throw new Error("Não existe uma versão-fonte disponível para esta manutenção.");
  const suffix = randomUUID().slice(0, 8);
  let themeId: string | null = null;
  if (source.theme) {
    const theme = await tx.theme.create({
      data: {
        name: `${source.theme.name} · release ${version}`,
        key: `maintenance-${projectId.slice(0, 8)}-${version}-${suffix}`,
        primaryColor: source.theme.primaryColor,
        secondaryColor: source.theme.secondaryColor,
        accentColor: source.theme.accentColor,
        backgroundColor: source.theme.backgroundColor,
        surfaceColor: source.theme.surfaceColor,
        textPrimaryColor: source.theme.textPrimaryColor,
        textSecondaryColor: source.theme.textSecondaryColor,
        headingFont: source.theme.headingFont,
        bodyFont: source.theme.bodyFont,
        borderRadius: source.theme.borderRadius,
        shadowStyle: source.theme.shadowStyle,
        settings: source.theme.settings as Prisma.InputJsonValue,
      },
    });
    themeId = theme.id;
  }
  const page = await tx.page.create({
    data: {
      title: source.title,
      slug: `maintenance-${projectId.slice(0, 8)}-${version}-${suffix}`,
      status: "DRAFT",
      pageType: source.pageType,
      isDemo: false,
      templateId: source.templateId,
      templateVariantId: source.templateVariantId,
      themeId,
    },
  });
  if (source.sections.length) {
    await tx.pageSection.createMany({ data: source.sections.map((section) => ({
      pageId: page.id,
      sectionKey: section.sectionKey,
      sectionType: section.sectionType,
      name: section.name,
      sortOrder: section.sortOrder,
      isVisible: section.isVisible,
      content: section.content as Prisma.InputJsonValue,
      settings: section.settings as Prisma.InputJsonValue,
    })) });
  }
  for (const form of source.forms) {
    const copied = await tx.form.create({
      data: {
        pageId: page.id,
        name: form.name,
        key: form.key,
        type: form.type,
        status: "DRAFT",
        description: form.description,
        successMessage: form.successMessage,
        errorMessage: form.errorMessage,
        recipientEmail: form.recipientEmail,
        redirectUrl: form.redirectUrl,
        gdprConsentRequired: form.gdprConsentRequired,
        gdprConsentLabel: form.gdprConsentLabel,
        gdprConsentVersion: form.gdprConsentVersion,
        isActive: false,
      },
    });
    if (form.fields.length) {
      await tx.formField.createMany({ data: form.fields.map((field) => ({
        formId: copied.id,
        label: field.label,
        name: field.name,
        type: field.type,
        placeholder: field.placeholder,
        helpText: field.helpText,
        defaultValue: field.defaultValue,
        options: field.options === null ? Prisma.DbNull : field.options as Prisma.InputJsonValue,
        validation: field.validation === null ? Prisma.DbNull : field.validation as Prisma.InputJsonValue,
        conditionalLogic: field.conditionalLogic === null ? Prisma.DbNull : field.conditionalLogic as Prisma.InputJsonValue,
        sortOrder: field.sortOrder,
        isRequired: field.isRequired,
        isVisible: field.isVisible,
      })) });
    }
  }
  if (source.seoSetting) {
    await tx.seoSetting.create({
      data: {
        pageId: page.id,
        metaTitle: source.seoSetting.metaTitle,
        metaDescription: source.seoSetting.metaDescription,
        keywords: source.seoSetting.keywords,
        ogTitle: source.seoSetting.ogTitle,
        ogDescription: source.seoSetting.ogDescription,
        twitterCardType: source.seoSetting.twitterCardType,
        robotsIndex: false,
        robotsFollow: false,
        canonicalUrl: null,
        schemaJson: Prisma.DbNull,
      },
    });
  }
  return page;
}

export async function createMaintenanceRelease(input: {
  projectId: string;
  summary: string;
  approvalRequired: boolean;
  actor: MaintenanceActor;
  rollbackToReleaseId?: string;
}) {
  const project = await getManagedProject(input.projectId, input.actor);
  const summary = input.summary.trim();
  if (!summary || summary.length > 2000) throw new Error("Descreve a alteração (máximo 2000 caracteres).");
  return db.$transaction(async (tx) => {
    const [latest, latestPublished, rollbackTarget] = await Promise.all([
      tx.projectMaintenanceRelease.findFirst({ where: { projectId: project.id }, orderBy: { version: "desc" }, select: { version: true } }),
      tx.projectMaintenanceRelease.findFirst({ where: { projectId: project.id, status: ProjectMaintenanceReleaseStatus.PUBLISHED }, orderBy: { version: "desc" }, select: { id: true, candidatePageId: true, publicSlug: true, targetTemplateVersion: true, templateBaselineSnapshot: true, templateBaselineChecksum: true, codeChanges: true } }),
      input.rollbackToReleaseId
        ? tx.projectMaintenanceRelease.findFirst({ where: { id: input.rollbackToReleaseId, projectId: project.id, status: ProjectMaintenanceReleaseStatus.PUBLISHED }, select: { id: true, candidatePageId: true, publicSlug: true, targetTemplateVersion: true, templateBaselineSnapshot: true, templateBaselineChecksum: true, codeChanges: true } })
        : Promise.resolve(null),
    ]);
    if (input.rollbackToReleaseId && !rollbackTarget) throw new Error("A versão de rollback não existe ou não está publicada.");
    const sourcePageId = rollbackTarget?.candidatePageId ?? latestPublished?.candidatePageId ?? project.sourceVersions[0]?.provisionedPageId;
    if (!sourcePageId) throw new Error("Cria primeiro a cópia privada do projeto.");
    const version = (latest?.version ?? 0) + 1;
    const page = await duplicateProjectPage(tx, project.id, sourcePageId, version);
    const inheritedCodeChanges = rollbackTarget ? rollbackTarget.codeChanges : latestPublished?.codeChanges;
    const release = await tx.projectMaintenanceRelease.create({
      data: {
        projectId: project.id,
        version,
        candidatePageId: page.id,
        baseReleaseId: latestPublished?.id ?? null,
        rollbackTargetReleaseId: rollbackTarget?.id ?? null,
        baseSourceVersionId: project.sourceVersions[0]?.id ?? null,
        publicSlug: rollbackTarget?.publicSlug ?? latestPublished?.publicSlug ?? project.sourceVersions[0]?.provisionedPage.slug ?? null,
        targetTemplateVersion: rollbackTarget?.targetTemplateVersion ?? latestPublished?.targetTemplateVersion ?? project.sourceVersions[0]?.templateVersion ?? project.templateVersion,
        templateBaselineSnapshot: (rollbackTarget?.templateBaselineSnapshot ?? latestPublished?.templateBaselineSnapshot ?? project.sourceVersions[0]?.snapshot ?? Prisma.DbNull) as Prisma.InputJsonValue,
        templateBaselineChecksum: rollbackTarget?.templateBaselineChecksum ?? latestPublished?.templateBaselineChecksum ?? project.sourceVersions[0]?.checksum ?? null,
        codeChanges: inheritedCodeChanges ? inheritedCodeChanges as Prisma.InputJsonValue : Prisma.DbNull,
        changeSummary: summary,
        approvalRequired: input.approvalRequired,
        createdByUserId: input.actor.id,
      },
      select: { id: true, version: true, candidatePageId: true },
    });
    await tx.auditLog.create({
      data: {
        userId: input.actor.id,
        action: input.rollbackToReleaseId ? "project.maintenance.rollback_candidate.create" : "project.maintenance.release.create",
        entityType: "project_maintenance_release",
        entityId: release.id,
        newValues: { projectId: project.id, version, baseReleaseId: latestPublished?.id ?? null, rollbackTargetReleaseId: rollbackTarget?.id ?? null, approvalRequired: input.approvalRequired },
      },
    });
    return release;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function createTemplateRebaseCandidate(input: {
  projectId: string;
  sourcePageId: string;
  summary: string;
  approvalRequired: boolean;
  actor: MaintenanceActor;
}) {
  const project = await getManagedProject(input.projectId, input.actor);
  if (!project.templateId || !project.templateVariantId || !project.sourceVersions[0]) {
    throw new Error("O projeto ainda não tem uma versão-fonte e uma variante de template fixadas.");
  }
  const summary = input.summary.trim();
  if (!summary || summary.length > 2000) throw new Error("Descreve a atualização do template (máximo 2000 caracteres).");

  return db.$transaction(async (tx) => {
    const targetPage = await tx.page.findFirst({
      where: {
        id: input.sourcePageId,
        templateId: project.templateId,
        templateVariantId: project.templateVariantId,
        isDemo: true,
        status: "PUBLISHED",
        demoStatus: { in: [DemoStatus.READY, DemoStatus.PUBLISHED] },
        deletedAt: null,
      },
      include: pageForSnapshot,
    });
    if (!targetPage) throw new Error("A nova versão tem de ser uma demo publicada da mesma indústria e variante.");

    const latestPublished = await tx.projectMaintenanceRelease.findFirst({
      where: { projectId: project.id, status: ProjectMaintenanceReleaseStatus.PUBLISHED },
      orderBy: { version: "desc" },
      select: { id: true, candidatePageId: true, publicSlug: true, templateBaselineSnapshot: true, templateBaselineChecksum: true, targetTemplateVersion: true, codeChanges: true },
    });
    if (maintenanceCodeChanges(latestPublished?.codeChanges).length) {
      throw new Error("Este projeto tem alterações estruturais de código publicadas. Revê-as e prepara uma migração de código antes de atualizar a versão oficial do template.");
    }
    const baselineValue = latestPublished?.templateBaselineSnapshot ?? project.sourceVersions[0].snapshot;
    const baselineChecksum = latestPublished?.templateBaselineChecksum ?? project.sourceVersions[0].checksum;
    if (!baselineValue || !baselineChecksum) throw new Error("O projeto não tem uma baseline íntegra para comparar o template.");
    const baseline = validateHistoricalProjectSourceSnapshot(baselineValue, baselineChecksum);

    const currentPageId = latestPublished?.candidatePageId ?? project.sourceVersions[0].provisionedPageId;
    const currentPage = await tx.page.findFirst({ where: { id: currentPageId, deletedAt: null }, include: pageForSnapshot });
    if (!currentPage) throw new Error("Não foi encontrada a versão publicada atual do projeto.");
    const publicSlug = latestPublished?.publicSlug ?? project.sourceVersions[0].provisionedPage.slug;
    const currentSnapshot = overrideProjectSourceSnapshotSlug(buildProjectSourceSnapshot(currentPage), publicSlug).snapshot;
    const incomingSnapshotData = buildProjectSourceSnapshot(targetPage);
    if (incomingSnapshotData.checksum === baselineChecksum) {
      throw new Error("A demo selecionada não contém alterações face à baseline já aceite pelo projeto.");
    }
    const rebased = rebaseProjectSnapshot(baseline, currentSnapshot, incomingSnapshotData.snapshot);

    const latest = await tx.projectMaintenanceRelease.findFirst({ where: { projectId: project.id }, orderBy: { version: "desc" }, select: { version: true } });
    const version = (latest?.version ?? 0) + 1;
    const candidatePage = await duplicateProjectPage(tx, project.id, targetPage.id, version);
    await tx.page.update({
      where: { id: candidatePage.id },
      data: { title: currentPage.title, themeId: currentPage.themeId ? candidatePage.themeId : null },
    });

    if (currentPage.theme && candidatePage.themeId) {
      await tx.theme.update({
        where: { id: candidatePage.themeId },
        data: {
          primaryColor: currentPage.theme.primaryColor,
          secondaryColor: currentPage.theme.secondaryColor,
          accentColor: currentPage.theme.accentColor,
          backgroundColor: currentPage.theme.backgroundColor,
          surfaceColor: currentPage.theme.surfaceColor,
          textPrimaryColor: currentPage.theme.textPrimaryColor,
          textSecondaryColor: currentPage.theme.textSecondaryColor,
          headingFont: currentPage.theme.headingFont,
          bodyFont: currentPage.theme.bodyFont,
          borderRadius: currentPage.theme.borderRadius,
          shadowStyle: currentPage.theme.shadowStyle,
          settings: currentPage.theme.settings as Prisma.InputJsonValue,
        },
      });
    } else if (candidatePage.themeId) {
      await tx.theme.delete({ where: { id: candidatePage.themeId } });
    }

    await tx.pageSection.deleteMany({ where: { pageId: candidatePage.id } });
    if (rebased.snapshot.page.sections.length) {
      await tx.pageSection.createMany({
        data: rebased.snapshot.page.sections.map((section) => ({
          pageId: candidatePage.id,
          sectionKey: section.sectionKey,
          sectionType: section.sectionType,
          name: section.name,
          sortOrder: section.sortOrder,
          isVisible: section.isVisible,
          content: section.content as Prisma.InputJsonValue,
          settings: section.settings as Prisma.InputJsonValue,
        })),
      });
    }

    await tx.formField.deleteMany({ where: { form: { pageId: candidatePage.id } } });
    await tx.form.deleteMany({ where: { pageId: candidatePage.id } });
    for (const form of rebased.snapshot.page.forms) {
      const currentForm = currentPage.forms.find((item) => item.key === form.key);
      const incomingForm = targetPage.forms.find((item) => item.key === form.key);
      const metadata = currentForm ?? incomingForm;
      if (!metadata) continue;
      const createdForm = await tx.form.create({
        data: {
          pageId: candidatePage.id,
          name: form.name,
          key: form.key,
          type: form.type as FormType,
          status: FormStatus.DRAFT,
          description: metadata.description,
          successMessage: form.successMessage,
          errorMessage: form.errorMessage,
          recipientEmail: metadata.recipientEmail,
          redirectUrl: currentForm?.redirectUrl ?? incomingForm?.redirectUrl ?? null,
          gdprConsentRequired: form.gdprConsentRequired ?? metadata.gdprConsentRequired,
          gdprConsentLabel: form.gdprConsentLabel ?? metadata.gdprConsentLabel,
          gdprConsentVersion: form.gdprConsentVersion ?? metadata.gdprConsentVersion,
          isActive: false,
        },
      });
      if (form.fields.length) {
        await tx.formField.createMany({
          data: form.fields.map((field) => ({
            formId: createdForm.id,
            name: field.name,
            label: field.label,
            type: field.type as FormFieldType,
            placeholder: field.placeholder,
            helpText: field.helpText,
            defaultValue: field.defaultValue,
            options: field.options === null ? Prisma.DbNull : field.options as Prisma.InputJsonValue,
            validation: field.validation === null ? Prisma.DbNull : field.validation as Prisma.InputJsonValue,
            conditionalLogic: field.conditionalLogic === null ? Prisma.DbNull : field.conditionalLogic as Prisma.InputJsonValue,
            sortOrder: field.sortOrder,
            isRequired: field.isRequired,
            isVisible: field.isVisible,
          })),
        });
      }
    }

    if (currentPage.seoSetting) {
      await tx.seoSetting.upsert({
        where: { pageId: candidatePage.id },
        create: {
          pageId: candidatePage.id,
          metaTitle: currentPage.seoSetting.metaTitle,
          metaDescription: currentPage.seoSetting.metaDescription,
          keywords: currentPage.seoSetting.keywords,
          ogTitle: currentPage.seoSetting.ogTitle,
          ogDescription: currentPage.seoSetting.ogDescription,
          twitterCardType: currentPage.seoSetting.twitterCardType,
          robotsIndex: false,
          robotsFollow: false,
          canonicalUrl: null,
          schemaJson: Prisma.DbNull,
        },
        update: {
          metaTitle: currentPage.seoSetting.metaTitle,
          metaDescription: currentPage.seoSetting.metaDescription,
          keywords: currentPage.seoSetting.keywords,
          ogTitle: currentPage.seoSetting.ogTitle,
          ogDescription: currentPage.seoSetting.ogDescription,
          twitterCardType: currentPage.seoSetting.twitterCardType,
          robotsIndex: false,
          robotsFollow: false,
          canonicalUrl: null,
          schemaJson: Prisma.DbNull,
        },
      });
    }

    const release = await tx.projectMaintenanceRelease.create({
      data: {
        projectId: project.id,
        version,
        candidatePageId: candidatePage.id,
        baseReleaseId: latestPublished?.id ?? null,
        baseSourceVersionId: project.sourceVersions[0].id,
        publicSlug,
        targetTemplateVersion: incomingSnapshotData.snapshot.templateVersion,
        templateBaselineSnapshot: incomingSnapshotData.snapshot as unknown as Prisma.InputJsonValue,
        templateBaselineChecksum: incomingSnapshotData.checksum,
        rebaseReport: rebased.report as unknown as Prisma.InputJsonValue,
        changeSummary: summary,
        approvalRequired: input.approvalRequired,
        createdByUserId: input.actor.id,
      },
      select: { id: true, version: true, candidatePageId: true, rebaseReport: true, targetTemplateVersion: true },
    });
    await tx.auditLog.create({
      data: {
        userId: input.actor.id,
        action: "project.maintenance.template_rebase.create",
        entityType: "project_maintenance_release",
        entityId: release.id,
        newValues: {
          projectId: project.id,
          version,
          sourceTemplateVersion: baseline.templateVersion,
          targetTemplateVersion: incomingSnapshotData.snapshot.templateVersion,
          sourcePageId: targetPage.id,
          conflictCount: rebased.report.conflicts.length,
          addedSectionCount: rebased.report.addedSections.length,
          removedSectionsPreservedCount: rebased.report.removedSectionsPreserved.length,
        },
      },
    });
    return release;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function getMaintenanceCandidateForPage(pageId: string, actor: MaintenanceActor) {
  const candidate = await db.projectMaintenanceRelease.findFirst({
    where: { candidatePageId: pageId },
    select: { id: true, projectId: true, status: true },
  });
  if (!candidate) return null;
  await getManagedProject(candidate.projectId, actor);
  if (candidate.status === ProjectMaintenanceReleaseStatus.PUBLISHED) {
    throw new Error("Uma release publicada é imutável. Cria uma nova versão de manutenção.");
  }
  return candidate;
}

export async function getMaintenanceReleasePage(projectId: string, releaseId: string, actor: MaintenanceActor) {
  await getManagedProject(projectId, actor);
  const release = await db.projectMaintenanceRelease.findFirst({
    where: { id: releaseId, projectId },
    include: { candidatePage: { include: pageForSnapshot } },
  });
  if (!release) throw new Error("Release de manutenção não encontrado.");
  return release;
}

export async function getMaintenanceCodeEditor(projectId: string, releaseId: string, actor: MaintenanceActor) {
  const release = await getMaintenanceReleasePage(projectId, releaseId, actor);
  const sources = listClientRuntimeMaintenanceSources(release.candidatePage.template?.key ?? "", release.candidatePage.templateVariant?.key ?? "");
  const changes = maintenanceCodeChanges(release.codeChanges);
  const byPath = new Map(changes.map((change) => [change.sourcePath, change]));
  const availablePaths = new Set(sources.map((source) => source.sourcePath));
  return {
    editable: release.status !== ProjectMaintenanceReleaseStatus.PUBLISHED,
    files: [
      ...sources.map((source) => ({
      ...source,
      currentContent: byPath.get(source.sourcePath)?.content ?? source.content,
      changed: byPath.has(source.sourcePath),
      stale: byPath.has(source.sourcePath) && byPath.get(source.sourcePath)?.baseChecksum !== sourceChecksum(source.content),
        orphaned: false,
      })),
      ...changes.filter((change) => !availablePaths.has(change.sourcePath)).map((change) => ({
        sourcePath: change.sourcePath,
        packagePath: change.packagePath,
        content: "",
        currentContent: change.content,
        changed: true,
        stale: true,
        orphaned: true,
      })),
    ],
  };
}

export async function saveMaintenanceCodeChange(input: {
  projectId: string;
  releaseId: string;
  sourcePath: string;
  content: string;
  actor: MaintenanceActor;
}) {
  await getManagedProject(input.projectId, input.actor);
  const release = await getMaintenanceReleasePage(input.projectId, input.releaseId, input.actor);
  if (release.status === ProjectMaintenanceReleaseStatus.PUBLISHED) throw new Error("Uma release publicada é imutável.");
  if (unresolvedRebaseConflicts(release.rebaseReport).length) throw new Error("Resolve primeiro os conflitos do rebase antes de alterar o código.");
  const sources = listClientRuntimeMaintenanceSources(release.candidatePage.template?.key ?? "", release.candidatePage.templateVariant?.key ?? "");
  const source = sources.find((item) => item.sourcePath === input.sourcePath);
  const savedChanges = maintenanceCodeChanges(release.codeChanges);
  const existingChange = savedChanges.find((item) => item.sourcePath === input.sourcePath);
  if (source) validateMaintenanceCodeChangeInput({ sourcePath: input.sourcePath, content: input.content, allowedSourcePaths: sources.map((item) => item.sourcePath) });
  else if (input.content.trim() || !existingChange) throw new Error("Só é possível remover um patch órfão que já esteja guardado.");

  const changes = savedChanges.filter((item) => item.sourcePath !== input.sourcePath);
  if (source && input.content !== source.content) {
    changes.push({
      sourcePath: source.sourcePath,
      packagePath: source.packagePath,
      content: input.content,
      baseChecksum: sourceChecksum(source.content),
      updatedByUserId: input.actor.id,
      updatedAt: new Date().toISOString(),
    });
  }
  assertMaintenanceCodeChangesWithinLimits(changes);

  await db.$transaction(async (tx) => {
    const result = await tx.projectMaintenanceRelease.updateMany({
      where: { id: release.id, projectId: input.projectId, status: { not: ProjectMaintenanceReleaseStatus.PUBLISHED } },
      data: {
        codeChanges: changes.length ? changes as unknown as Prisma.InputJsonValue : Prisma.DbNull,
        status: ProjectMaintenanceReleaseStatus.DRAFT,
        sourceChecksum: null,
        packageChecksum: null,
        packageDownloadedAt: null,
        validationReport: Prisma.DbNull,
        approvedAt: null,
        approvedByUserId: null,
        approvalReference: null,
        failureCode: null,
      },
    });
    if (!result.count) throw new Error("A release foi publicada entretanto e já não pode ser alterada.");
    await tx.auditLog.create({
      data: {
        userId: input.actor.id,
        action: "project.maintenance.code_change.save",
        entityType: "project_maintenance_release",
        entityId: release.id,
        newValues: { sourcePath: input.sourcePath, contentChecksum: input.content && source ? sourceChecksum(input.content) : null, removedOrphanedPatch: !source, changedFileCount: changes.length },
      },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

function codeOverridesForRelease(value: unknown, sources: ReturnType<typeof listClientRuntimeMaintenanceSources>) {
  const changes = maintenanceCodeChanges(value);
  assertMaintenanceCodeChangesWithinLimits(changes);
  const allowed = new Map(sources.map((source) => [source.sourcePath, source]));
  for (const change of changes) {
    const source = allowed.get(change.sourcePath);
    if (!source || source.packagePath !== change.packagePath) throw new Error("A release contém um ficheiro de código fora da allowlist da variante.");
    if (change.baseChecksum !== sourceChecksum(source.content)) throw new Error("A fonte oficial mudou desde a edição do patch. Revê e volta a guardar a alteração antes de validar.");
  }
  return Object.fromEntries(changes.map((change) => [change.packagePath, change.content]));
}

export async function getMaintenanceReleasePreview(projectId: string, releaseId: string, actor: MaintenanceActor): Promise<PublicRendererContext> {
  const release = await getMaintenanceReleasePage(projectId, releaseId, actor);
  const site = await db.siteSetting.findFirst({ include: { logoMedia: { select: { publicUrl: true, altText: true } } } });
  if (!site) throw new Error("Configura a identidade de marca do site antes de abrir a pré-visualização.");
  const page = release.candidatePage;
  return {
    previewMode: true,
    page: {
      id: page.id,
      title: page.title,
      slug: page.slug,
      template: page.template,
      templateVariant: page.templateVariant,
      theme: page.theme,
      sections: page.sections,
      forms: page.forms.map((form) => ({
        id: form.id,
        gdprConsentLabel: form.gdprConsentLabel,
        gdprConsentRequired: form.gdprConsentRequired,
        gdprConsentVersion: form.gdprConsentVersion,
        fields: form.fields.map((field) => ({
          id: field.id,
          label: field.label,
          name: field.name,
          type: field.type,
          placeholder: field.placeholder,
          helpText: field.helpText,
          defaultValue: field.defaultValue,
          options: field.options,
          conditionalLogic: field.conditionalLogic,
          isRequired: field.isRequired,
          isVisible: field.isVisible,
        })),
      })),
    },
    site: {
      businessName: site.businessName,
      businessType: site.businessType,
      contactEmail: site.contactEmail,
      contactPhone: site.contactPhone,
      city: site.city,
      country: site.country,
      primaryColor: site.primaryColor,
      secondaryColor: site.secondaryColor,
      accentColor: site.accentColor,
      logoMedia: site.logoMedia,
    },
  };
}

function unresolvedRebaseConflicts(report: unknown) {
  if (!report || typeof report !== "object" || Array.isArray(report)) return [];
  const data = report as Record<string, unknown>;
  const conflicts = Array.isArray(data.conflicts) ? data.conflicts.filter((item): item is string => typeof item === "string") : [];
  const resolved = Array.isArray(data.conflictResolutions)
    ? data.conflictResolutions
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
        .map((item) => item.path)
        .filter((path): path is string => typeof path === "string")
    : [];
  return conflicts.filter((path) => !resolved.includes(path));
}

export async function resolveTemplateRebaseConflict(input: {
  projectId: string;
  releaseId: string;
  conflictPath: string;
  decision: "CURRENT" | "TEMPLATE";
  actor: MaintenanceActor;
}) {
  await getManagedProject(input.projectId, input.actor);
  const release = await getMaintenanceReleasePage(input.projectId, input.releaseId, input.actor);
  if (release.status === ProjectMaintenanceReleaseStatus.PUBLISHED) throw new Error("Uma release publicada é imutável.");

  const report = release.rebaseReport && typeof release.rebaseReport === "object" && !Array.isArray(release.rebaseReport)
    ? release.rebaseReport as Record<string, unknown>
    : null;
  if (!report || !Array.isArray(report.conflicts) || !report.conflicts.includes(input.conflictPath)) {
    throw new Error("O conflito indicado não pertence a esta candidata.");
  }
  if (!unresolvedRebaseConflicts(report).includes(input.conflictPath)) {
    throw new Error("Este conflito já tem uma decisão registada.");
  }

  const fieldConflict = parseFormFieldConflict(input.conflictPath);
  const formConflict = fieldConflict ? null : parseFormConflict(input.conflictPath);
  if (input.decision === "TEMPLATE" && !fieldConflict && !(formConflict && (formConflict.property || formConflict.replacesWholeForm))) {
    throw new Error("A escolha da versão oficial não está disponível para este conflito.");
  }

  await db.$transaction(async (tx) => {
    if ((fieldConflict || formConflict) && input.decision === "TEMPLATE") {
      if (!release.templateBaselineSnapshot || !release.templateBaselineChecksum) {
        throw new Error("A versão oficial usada no rebase já não está disponível para comparação.");
      }
      const baseline = validateHistoricalProjectSourceSnapshot(release.templateBaselineSnapshot, release.templateBaselineChecksum);
      const templateForm = baseline.page.forms.find((form) => form.key === (fieldConflict?.formKey ?? formConflict?.formKey));
      const currentForm = release.candidatePage.forms.find((form) => form.key === (fieldConflict?.formKey ?? formConflict?.formKey));
      if (!templateForm || !currentForm) throw new Error("Não foi possível localizar o formulário do conflito na candidata e na versão oficial.");

      if (fieldConflict) {
        const templateField = templateForm.fields.find((field) => field.name === fieldConflict.fieldName);
        const currentField = currentForm.fields.find((field) => field.name === fieldConflict.fieldName);
        if (!templateField || !currentField) throw new Error("Não foi possível localizar o campo do conflito na candidata e na versão oficial.");
        const updated = applyTemplateFieldConflict(
          currentField as unknown as Record<string, unknown>,
          templateField as unknown as Record<string, unknown>,
          fieldConflict,
        );
        if (!Object.values(FormFieldType).includes(updated.type as FormFieldType)) {
          throw new Error("A versão oficial contém um tipo de campo não suportado.");
        }
        await tx.formField.update({
          where: { id: currentField.id },
          data: {
            label: updated.label as string,
            type: updated.type as FormFieldType,
            placeholder: updated.placeholder as string | null,
            helpText: updated.helpText as string | null,
            defaultValue: updated.defaultValue as string | null,
            options: updated.options === null ? Prisma.DbNull : updated.options as Prisma.InputJsonValue,
            validation: updated.validation === null ? Prisma.DbNull : updated.validation as Prisma.InputJsonValue,
            conditionalLogic: updated.conditionalLogic === null ? Prisma.DbNull : updated.conditionalLogic as Prisma.InputJsonValue,
            sortOrder: updated.sortOrder as number,
            isRequired: updated.isRequired as boolean,
            isVisible: updated.isVisible as boolean,
          },
        });
      } else if (formConflict) {
        const shouldReplaceForm = formConflict.replacesWholeForm;
        const shouldReplaceFields = shouldReplaceForm || formConflict.property === "fields";
        const formUpdate: Prisma.FormUpdateInput = {};
        if (shouldReplaceForm || formConflict.property === "name") formUpdate.name = templateForm.name;
        if (shouldReplaceForm || formConflict.property === "type") {
          if (!Object.values(FormType).includes(templateForm.type as FormType)) throw new Error("A versão oficial contém um tipo de formulário não suportado.");
          formUpdate.type = templateForm.type as FormType;
        }
        if (shouldReplaceForm || formConflict.property === "successMessage") formUpdate.successMessage = templateForm.successMessage;
        if (shouldReplaceForm || formConflict.property === "errorMessage") formUpdate.errorMessage = templateForm.errorMessage;
        if (shouldReplaceForm || formConflict.property === "gdprConsentRequired") formUpdate.gdprConsentRequired = templateForm.gdprConsentRequired ?? false;
        if ((shouldReplaceForm || formConflict.property === "gdprConsentLabel") && templateForm.gdprConsentLabel !== undefined) formUpdate.gdprConsentLabel = templateForm.gdprConsentLabel;
        if ((shouldReplaceForm || formConflict.property === "gdprConsentVersion") && templateForm.gdprConsentVersion !== undefined) formUpdate.gdprConsentVersion = templateForm.gdprConsentVersion;
        if (Object.keys(formUpdate).length) await tx.form.update({ where: { id: currentForm.id }, data: formUpdate });
        if (shouldReplaceFields) {
          await tx.formField.deleteMany({ where: { formId: currentForm.id } });
          if (templateForm.fields.length) {
            await tx.formField.createMany({
              data: templateForm.fields.map((field) => ({
                formId: currentForm.id,
                name: field.name,
                label: field.label,
                type: field.type as FormFieldType,
                placeholder: field.placeholder,
                helpText: field.helpText,
                defaultValue: field.defaultValue,
                options: field.options === null ? Prisma.DbNull : field.options as Prisma.InputJsonValue,
                validation: field.validation === null ? Prisma.DbNull : field.validation as Prisma.InputJsonValue,
                conditionalLogic: field.conditionalLogic === null ? Prisma.DbNull : field.conditionalLogic as Prisma.InputJsonValue,
                sortOrder: field.sortOrder,
                isRequired: field.isRequired,
                isVisible: field.isVisible,
              })),
            });
          }
        }
      }
    }

    const previousResolutions = Array.isArray(report.conflictResolutions)
      ? report.conflictResolutions.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
      : [];
    const nextReport = {
      ...report,
      conflictResolutions: [
        ...previousResolutions,
        { path: input.conflictPath, decision: input.decision, resolvedByUserId: input.actor.id, resolvedAt: new Date().toISOString() },
      ],
    };
    await tx.projectMaintenanceRelease.update({
      where: { id: release.id },
      data: {
        rebaseReport: nextReport as unknown as Prisma.InputJsonValue,
        status: ProjectMaintenanceReleaseStatus.DRAFT,
        sourceChecksum: null,
        packageChecksum: null,
        packageDownloadedAt: null,
        validationReport: Prisma.DbNull,
        approvedAt: null,
        approvedByUserId: null,
        approvalReference: null,
        failureCode: null,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: input.actor.id,
        action: "project.maintenance.template_rebase.conflict.resolve",
        entityType: "project_maintenance_release",
        entityId: release.id,
        newValues: { conflictPath: input.conflictPath, decision: input.decision },
      },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function invalidateMaintenanceCandidate(pageId: string) {
  await db.projectMaintenanceRelease.updateMany({
    where: { candidatePageId: pageId, status: { not: ProjectMaintenanceReleaseStatus.PUBLISHED } },
    data: { status: ProjectMaintenanceReleaseStatus.DRAFT, sourceChecksum: null, packageChecksum: null, packageDownloadedAt: null, validationReport: Prisma.DbNull, approvedAt: null, approvedByUserId: null, approvalReference: null, failureCode: null },
  });
}

export async function validateMaintenanceRelease(projectId: string, releaseId: string, actor: MaintenanceActor) {
  await getManagedProject(projectId, actor);
  const release = await getMaintenanceReleasePage(projectId, releaseId, actor);
  if (release.status === ProjectMaintenanceReleaseStatus.PUBLISHED) throw new Error("Uma release publicada é imutável.");
  if (unresolvedRebaseConflicts(release.rebaseReport).length) {
    throw new Error("Resolve e regista todos os conflitos do rebase antes de validar o pacote.");
  }
  await db.projectMaintenanceRelease.update({
    where: { id: releaseId },
    data: { status: ProjectMaintenanceReleaseStatus.DRAFT, packageChecksum: null, packageDownloadedAt: null, approvedAt: null, approvedByUserId: null, approvalReference: null, failureCode: null },
  });
  try {
    const builtSnapshot = overrideProjectSourceSnapshotSlug(
      buildProjectSourceSnapshot(release.candidatePage),
      release.publicSlug ?? release.candidatePage.slug,
    );
    const sources = listClientRuntimeMaintenanceSources(release.candidatePage.template?.key ?? "", release.candidatePage.templateVariant?.key ?? "");
    const codeOverrides = codeOverridesForRelease(release.codeChanges, sources);
    const releaseChecksum = maintenanceReleaseSourceChecksum(builtSnapshot.checksum, maintenanceCodeChanges(release.codeChanges));
    const composition = buildClientRuntimeComposition(builtSnapshot.snapshot, builtSnapshot.checksum, "LANDING_ONLY", undefined, {
      projectId,
      version: release.version,
      sourceChecksum: releaseChecksum,
    });
    const built = await assembleAuditedLandingOnlyPackage(composition, codeOverrides);
    const report = {
      passed: built.audit.ready,
      buildPassed: true,
      auditPassed: built.audit.ready,
      templateVersion: built.templateVersion,
      fileCount: built.fileCount,
      totalBytes: built.totalBytes,
      codeChanges: maintenanceCodeChanges(release.codeChanges).map(({ sourcePath, baseChecksum, content, updatedByUserId, updatedAt }) => ({
        sourcePath,
        baseChecksum,
        contentChecksum: sourceChecksum(content),
        updatedByUserId,
        updatedAt,
      })),
      validatedAt: new Date().toISOString(),
      findings: built.audit.findings,
    };
    const status = built.audit.ready ? ProjectMaintenanceReleaseStatus.VALIDATED : ProjectMaintenanceReleaseStatus.FAILED;
    const updated = await db.projectMaintenanceRelease.update({
      where: { id: releaseId },
      data: {
        status,
        sourceChecksum: releaseChecksum,
        packageChecksum: built.audit.ready ? built.checksum : null,
        packageDownloadedAt: null,
        validationReport: report as unknown as Prisma.InputJsonValue,
        failureCode: built.audit.ready ? null : "PACKAGE_AUDIT_BLOCKED",
        approvedAt: null,
        approvedByUserId: null,
        approvalReference: null,
      },
      select: { status: true, packageChecksum: true },
    });
    await db.auditLog.create({ data: { userId: actor.id, action: "project.maintenance.release.validate", entityType: "project_maintenance_release", entityId: releaseId, newValues: { status: updated.status, packageChecksum: updated.packageChecksum, templateVersion: built.templateVersion } } });
    if (!built.audit.ready) throw new Error("A auditoria bloqueou a release; consulta as conclusões da validação.");
    return updated;
  } catch (error) {
    await db.projectMaintenanceRelease.update({ where: { id: releaseId }, data: { status: ProjectMaintenanceReleaseStatus.FAILED, packageChecksum: null, failureCode: "RELEASE_VALIDATION_FAILED", validationReport: { passed: false, checkedAt: new Date().toISOString(), message: error instanceof Error ? error.message.slice(0, 300) : "Falha de validação." } } });
    throw error;
  }
}

export async function downloadMaintenanceRelease(projectId: string, releaseId: string, actor: MaintenanceActor) {
  const release = await getMaintenanceReleasePage(projectId, releaseId, actor);
  if (unresolvedRebaseConflicts(release.rebaseReport).length) {
    throw new Error("A release tem conflitos do rebase por resolver e não pode ser descarregada.");
  }
  if (release.status !== ProjectMaintenanceReleaseStatus.VALIDATED || !release.sourceChecksum || !release.packageChecksum) {
    throw new Error("Só é possível descarregar uma release validada.");
  }
  const current = overrideProjectSourceSnapshotSlug(
    buildProjectSourceSnapshot(release.candidatePage),
    release.publicSlug ?? release.candidatePage.slug,
  );
  const sources = listClientRuntimeMaintenanceSources(release.candidatePage.template?.key ?? "", release.candidatePage.templateVariant?.key ?? "");
  const codeChanges = maintenanceCodeChanges(release.codeChanges);
  const releaseChecksum = maintenanceReleaseSourceChecksum(current.checksum, codeChanges);
  if (releaseChecksum !== release.sourceChecksum) {
    await invalidateMaintenanceCandidate(release.candidatePageId);
    throw new Error("O conteúdo mudou depois da validação. Valida novamente antes de descarregar.");
  }
  let codeOverrides: Record<string, string>;
  try {
    codeOverrides = codeOverridesForRelease(release.codeChanges, sources);
  } catch (error) {
    await invalidateMaintenanceCandidate(release.candidatePageId);
    throw error;
  }
  const composition = buildClientRuntimeComposition(current.snapshot, current.checksum, "LANDING_ONLY", undefined, {
    projectId,
    version: release.version,
    sourceChecksum: releaseChecksum,
  });
  const built = await assembleAuditedLandingOnlyPackage(composition, codeOverrides);
  if (!built.audit.ready || built.checksum !== release.packageChecksum) {
    await db.projectMaintenanceRelease.update({ where: { id: releaseId }, data: { status: ProjectMaintenanceReleaseStatus.FAILED, packageChecksum: null, failureCode: "REGENERATED_ARTIFACT_MISMATCH" } });
    throw new Error("O artefacto regenerado diverge da versão validada; foi bloqueado por segurança.");
  }
  await db.projectMaintenanceRelease.update({ where: { id: releaseId }, data: { packageDownloadedAt: new Date() } });
  return built;
}

export async function recordMaintenanceApproval(projectId: string, releaseId: string, reference: string, actor: MaintenanceActor) {
  await getManagedProject(projectId, actor);
  const approvalReference = reference.trim();
  if (!approvalReference || approvalReference.length > 300) throw new Error("Regista uma referência breve à aprovação do cliente.");
  const release = await db.projectMaintenanceRelease.findFirstOrThrow({ where: { id: releaseId, projectId } });
  if (!release.approvalRequired || release.status !== ProjectMaintenanceReleaseStatus.VALIDATED) throw new Error("Esta release não está à espera de aprovação.");
  await db.$transaction(async (tx) => {
    await tx.projectMaintenanceRelease.update({ where: { id: releaseId }, data: { approvalReference, approvedAt: new Date(), approvedByUserId: actor.id } });
    await tx.auditLog.create({ data: { userId: actor.id, action: "project.maintenance.release.approval.record", entityType: "project_maintenance_release", entityId: releaseId, newValues: { approvalReference } } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function recordMaintenancePublication(input: {
  projectId: string;
  releaseId: string;
  destination: ProjectMaintenanceDestination;
  destinationLabel: string;
  verification: string;
  actor: MaintenanceActor;
}) {
  await getManagedProject(input.projectId, input.actor);
  const label = input.destinationLabel.trim();
  const verification = input.verification.trim();
  if (!label || label.length > 300 || !verification || verification.length > 1000) throw new Error("Indica o destino e a verificação manual pós-publicação.");
  const release = await db.projectMaintenanceRelease.findFirstOrThrow({ where: { id: input.releaseId, projectId: input.projectId } });
  if (release.status !== ProjectMaintenanceReleaseStatus.VALIDATED || !release.packageChecksum) throw new Error("Só uma release validada pode ser publicada.");
  if (!release.packageDownloadedAt) throw new Error("Descarrega primeiro o pacote validado antes de registar a publicação.");
  if (release.approvalRequired && !release.approvedAt) throw new Error("Regista a aprovação do cliente antes de publicar.");
  await db.$transaction(async (tx) => {
    const latestPublished = await tx.projectMaintenanceRelease.findFirst({
      where: { projectId: input.projectId, status: ProjectMaintenanceReleaseStatus.PUBLISHED },
      orderBy: { version: "desc" },
      select: { id: true },
    });
    if ((latestPublished?.id ?? null) !== release.baseReleaseId) {
      throw new Error("Esta candidata parte de uma versão antiga. Cria outra candidata antes de publicar.");
    }
    await tx.projectMaintenanceRelease.update({
      where: { id: release.id },
      data: { status: ProjectMaintenanceReleaseStatus.PUBLISHED, destination: input.destination, destinationLabel: label, publishedAt: new Date(), publishedByUserId: input.actor.id, deploymentVerifiedAt: new Date(), deploymentVerification: verification },
    });
    if (release.templateBaselineSnapshot && release.templateBaselineChecksum && release.targetTemplateVersion) {
      const baseline = validateHistoricalProjectSourceSnapshot(release.templateBaselineSnapshot, release.templateBaselineChecksum);
      const latestSourceVersion = await tx.projectSourceVersion.findFirst({
        where: { projectId: input.projectId },
        orderBy: { version: "desc" },
        select: { version: true, checksum: true },
      });
      if (latestSourceVersion?.checksum !== release.templateBaselineChecksum) {
        await tx.projectSourceVersion.create({
          data: {
            projectId: input.projectId,
            version: (latestSourceVersion?.version ?? 0) + 1,
            templateVersion: release.targetTemplateVersion,
            sourcePageId: baseline.sourcePageId,
            provisionedPageId: release.candidatePageId,
            checksum: release.templateBaselineChecksum,
            snapshot: baseline as unknown as Prisma.InputJsonValue,
            createdByUserId: input.actor.id,
          },
        });
        await tx.project.update({ where: { id: input.projectId }, data: { templateVersion: release.targetTemplateVersion } });
      }
    }
    await tx.auditLog.create({ data: { userId: input.actor.id, action: "project.maintenance.release.publish.record", entityType: "project_maintenance_release", entityId: release.id, newValues: { version: release.version, destination: input.destination, destinationLabel: label, packageChecksum: release.packageChecksum, verification } } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export const maintenanceReleaseStatuses = ProjectMaintenanceReleaseStatus;
export const maintenanceDestinations = ProjectMaintenanceDestination;
