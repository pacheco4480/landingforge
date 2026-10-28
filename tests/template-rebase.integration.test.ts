import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { buildProjectSourceSnapshot } from "@/features/exports/services/project-source-snapshot";
import {
  createBriefingShare,
  getBriefingByShareToken,
  recordSharedBriefingApproval,
} from "@/features/briefings/briefing.service";
import {
  createTemplateRebaseCandidate,
  resolveTemplateRebaseConflict,
  validateMaintenanceRelease,
} from "@/features/projects/services/project-maintenance.service";
import { db } from "@/lib/db";

const enabled = process.env.RUN_TEMPLATE_REBASE_DB_INTEGRATION === "1";
const databaseName = process.env.DATABASE_URL
  ? decodeURIComponent(new URL(process.env.DATABASE_URL).pathname.slice(1))
  : "";
const safeDatabase = /(?:^|[_-])test(?:[_-]|$)/i.test(databaseName);
const fixtures: { projectId?: string; pageIds: string[]; themeIds: string[]; templateId?: string; variantId?: string; industryId?: string; clientId?: string; userId?: string } = {
  pageIds: [],
  themeIds: [],
};

const actorPermissions = ["projects.write"];

async function createTheme(name: string, suffix: string) {
  const theme = await db.theme.create({
    data: {
      name,
      key: `task045-rebase-${suffix}-${randomUUID()}`,
      primaryColor: "#123456",
      secondaryColor: "#456789",
      accentColor: "#abc123",
      backgroundColor: "#ffffff",
      surfaceColor: "#f5f5f5",
      textPrimaryColor: "#111111",
      textSecondaryColor: "#555555",
      headingFont: "Arial",
      bodyFont: "Arial",
      borderRadius: "8px",
      shadowStyle: "none",
    },
    select: { id: true },
  });
  fixtures.themeIds.push(theme.id);
  return theme.id;
}

async function createPage(input: {
  title: string;
  slug: string;
  themeId: string;
  templateId: string;
  variantId: string;
  isDemo: boolean;
  content: { title: string; subtitle: string };
  fieldLabel: string;
  fieldMaxLength: number;
}) {
  const page = await db.page.create({
    data: {
      title: input.title,
      slug: input.slug,
      status: input.isDemo ? "PUBLISHED" : "DRAFT",
      pageType: "LANDING",
      isDemo: input.isDemo,
      demoStatus: input.isDemo ? "READY" : null,
      templateId: input.templateId,
      templateVariantId: input.variantId,
      themeId: input.themeId,
      sections: {
        create: {
          sectionKey: "hero",
          sectionType: "hero",
          name: "Hero",
          sortOrder: 0,
          content: input.content,
          settings: {},
        },
      },
      forms: {
        create: {
          name: "Contacto",
          key: "contact",
          type: "CONTACT",
          status: "PUBLISHED",
          successMessage: "Recebido",
          errorMessage: "Tenta novamente",
          recipientEmail: "test@example.test",
          fields: {
            create: {
              name: "email",
              label: input.fieldLabel,
              type: "EMAIL",
              validation: { maxLength: input.fieldMaxLength },
              isRequired: true,
              sortOrder: 0,
            },
          },
        },
      },
    },
    select: { id: true },
  });
  fixtures.pageIds.push(page.id);
  return page.id;
}

describe("project template rebase PostgreSQL integration", () => {
  it.skipIf(!enabled)(
    "preserves client edits, applies selected official form values and blocks unresolved conflicts",
    async () => {
      if (!safeDatabase) {
        throw new Error("O teste de rebase exige uma base de dados cujo nome contenha 'test'.");
      }

      const suffix = randomUUID();
      const user = await db.user.create({
        data: { name: "TASK 045 rebase test", email: `task045-rebase-${suffix}@example.test` },
        select: { id: true },
      });
      fixtures.userId = user.id;
      const industry = await db.industry.create({
        data: { key: `task045-rebase-${suffix}`, name: "Clínica de teste" },
        select: { id: true },
      });
      fixtures.industryId = industry.id;
      const template = await db.template.create({
        data: { industryId: industry.id, key: "clinic", name: "Clinic" },
        select: { id: true },
      });
      fixtures.templateId = template.id;
      const variant = await db.templateVariant.create({
        data: { templateId: template.id, key: "modern", name: "Modern" },
        select: { id: true },
      });
      fixtures.variantId = variant.id;
      const client = await db.client.create({
        data: { name: "Contacto de teste", businessName: "Clínica de teste" },
        select: { id: true },
      });
      fixtures.clientId = client.id;
      const themeId = await createTheme("Tema de teste", suffix);
      const basePageId = await createPage({
        title: "Demo base",
        slug: `task045-rebase-base-${suffix}`,
        themeId,
        templateId: template.id,
        variantId: variant.id,
        isDemo: true,
        content: { title: "Título base", subtitle: "Subtítulo base" },
        fieldLabel: "Email base",
        fieldMaxLength: 180,
      });
      const projectPageId = await createPage({
        title: "Clínica de teste",
        slug: `task045-rebase-project-${suffix}`,
        themeId,
        templateId: template.id,
        variantId: variant.id,
        isDemo: false,
        content: { title: "Título do cliente", subtitle: "Subtítulo base" },
        fieldLabel: "Email do cliente",
        fieldMaxLength: 180,
      });
      const incomingPageId = await createPage({
        title: "Demo atualizada",
        slug: `task045-rebase-incoming-${suffix}`,
        themeId,
        templateId: template.id,
        variantId: variant.id,
        isDemo: true,
        content: { title: "Título oficial", subtitle: "Novo subtítulo oficial" },
        fieldLabel: "Email oficial",
        fieldMaxLength: 120,
      });

      const sourcePage = await db.page.findUniqueOrThrow({
        where: { id: basePageId },
        include: {
          template: { select: { key: true } },
          templateVariant: { select: { key: true } },
          theme: true,
          sections: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
          forms: { where: { deletedAt: null }, include: { fields: { orderBy: { sortOrder: "asc" } } } },
          seoSetting: true,
        },
      });
      const sourceSnapshot = buildProjectSourceSnapshot(sourcePage);
      const project = await db.project.create({
        data: {
          clientId: client.id,
          name: "Rebase de teste",
          templateId: template.id,
          templateVariantId: variant.id,
          templateVersion: sourceSnapshot.snapshot.templateVersion,
          maintenancePlan: "CONTRACTED",
          sourceVersions: {
            create: {
              version: 1,
              templateVersion: sourceSnapshot.snapshot.templateVersion,
              sourcePageId: basePageId,
              provisionedPageId: projectPageId,
              checksum: sourceSnapshot.checksum,
              snapshot: sourceSnapshot.snapshot,
              createdByUserId: user.id,
            },
          },
        },
        select: { id: true },
      });
      fixtures.projectId = project.id;

      const release = await createTemplateRebaseCandidate({
        projectId: project.id,
        sourcePageId: incomingPageId,
        summary: "Atualização de teste do template oficial",
        approvalRequired: false,
        actor: { id: user.id, roles: ["super_admin"], permissions: actorPermissions },
      });

      const candidate = await db.page.findUniqueOrThrow({
        where: { id: release.candidatePageId },
        include: {
          sections: true,
          forms: { include: { fields: true } },
        },
      });
      const report = release.rebaseReport as { conflicts: string[] };
      expect(report.conflicts).toContain("secção.hero.content.title");
      expect(report.conflicts).toContain("formulário.contact.campo.email.label");
      expect(candidate.sections[0]?.content).toEqual({
        title: "Título do cliente",
        subtitle: "Novo subtítulo oficial",
      });
      expect(candidate.forms[0]?.fields[0]).toMatchObject({
        label: "Email do cliente",
        validation: { maxLength: 120 },
      });

      await resolveTemplateRebaseConflict({
        projectId: project.id,
        releaseId: release.id,
        conflictPath: "formulário.contact.campo.email.label",
        decision: "TEMPLATE",
        actor: { id: user.id, roles: ["super_admin"], permissions: actorPermissions },
      });
      const resolved = await db.formField.findFirstOrThrow({
        where: { form: { pageId: release.candidatePageId }, name: "email" },
        select: { label: true },
      });
      expect(resolved.label).toBe("Email oficial");
      await expect(
        validateMaintenanceRelease(project.id, release.id, {
          id: user.id,
          roles: ["super_admin"],
          permissions: actorPermissions,
        }),
      ).rejects.toThrow("Resolve e regista todos os conflitos do rebase");

      const provisionedPage = await db.page.findUniqueOrThrow({
        where: { id: projectPageId },
        include: {
          template: { select: { key: true } },
          templateVariant: { select: { key: true } },
          theme: true,
          sections: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
          forms: { where: { deletedAt: null }, include: { fields: { orderBy: { sortOrder: "asc" } } } },
          seoSetting: true,
        },
      });
      const preview = buildProjectSourceSnapshot(provisionedPage);
      await db.projectBriefing.create({
        data: {
          projectId: project.id,
          currentVersion: 1,
          revisions: {
            create: {
              version: 1,
              answers: {},
              contentHash: "d".repeat(64),
              createdByUserId: user.id,
            },
          },
        },
      });
      const artifactChecksum = "c".repeat(64);
      const exportRecord = await db.clientPackageExport.create({
        data: {
          projectId: project.id,
          createdByUserId: user.id,
          status: "READY",
          mode: "LANDING_ONLY",
          templateVersion: preview.snapshot.templateVersion,
          auditReport: { ready: true },
          artifactChecksum,
          sourceChecksum: preview.checksum,
          fileCount: 1,
          totalBytes: 128,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
        select: { id: true },
      });
      const actor = { id: user.id, roles: ["super_admin"] };
      const share = await createBriefingShare(project.id, actor, exportRecord.id);
      const sharedBriefing = await getBriefingByShareToken(share.token);
      expect(sharedBriefing?.releasePackage?.checksum).toBe(artifactChecksum);
      expect(sharedBriefing?.previewChecksum).toBe(preview.checksum);

      const approval = await recordSharedBriefingApproval({
        token: share.token,
        expectedVersion: 1,
        type: "RELEASE",
        decision: "APPROVED",
        name: "Aprovador de teste",
        expectedPreviewChecksum: preview.checksum,
        expectedReleaseChecksum: artifactChecksum,
      });
      expect(approval.artifactChecksum).toBe(artifactChecksum);
      expect(approval.decidedByName).toBe("Aprovador de teste");

      await db.pageSection.updateMany({
        where: { pageId: projectPageId, sectionKey: "hero" },
        data: { content: { title: "Landing alterada depois da aprovação" } },
      });
      await expect(
        recordSharedBriefingApproval({
          token: share.token,
          expectedVersion: 1,
          type: "RELEASE",
          decision: "APPROVED",
          name: "Aprovador de teste",
          expectedPreviewChecksum: preview.checksum,
          expectedReleaseChecksum: artifactChecksum,
        }),
      ).rejects.toThrow("A landing mudou desde a abertura do preview");
    },
  );
});

afterAll(async () => {
  if (fixtures.projectId) {
    await db.project.deleteMany({ where: { id: fixtures.projectId } });
  }
  if (fixtures.pageIds.length) {
    await db.page.deleteMany({ where: { id: { in: fixtures.pageIds } } });
  }
  if (fixtures.themeIds.length) {
    await db.theme.deleteMany({ where: { id: { in: fixtures.themeIds } } });
  }
  if (fixtures.templateId) {
    await db.template.deleteMany({ where: { id: fixtures.templateId } });
  }
  if (fixtures.industryId) {
    await db.industry.deleteMany({ where: { id: fixtures.industryId } });
  }
  if (fixtures.clientId) {
    await db.client.deleteMany({ where: { id: fixtures.clientId } });
  }
  if (fixtures.userId) {
    await db.user.update({
      where: { id: fixtures.userId },
      data: { deletedAt: new Date(), email: `removed-${fixtures.userId}@example.test` },
    });
  }
  await db.$disconnect();
});
