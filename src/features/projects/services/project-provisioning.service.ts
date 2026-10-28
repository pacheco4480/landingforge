import {
  DemoStatus,
  FormStatus,
  PageStatus,
  PageType,
  Prisma,
} from "@/generated/prisma/client";
import { projectWhereForActor } from "@/features/projects/project-access";
import { buildProjectSourceSnapshot } from "@/features/exports/services/project-source-snapshot";
import { db } from "@/lib/db";

type ProjectActor = { id: string; roles: readonly string[] };

export async function provisionProjectSource(projectId: string, actor: ProjectActor) {
  return db.$transaction(async (tx) => {
    const project = await tx.project.findFirst({
      where: { id: projectId, deletedAt: null, ...projectWhereForActor(actor) },
      include: {
        client: { select: { businessName: true, email: true } },
        template: { select: { id: true, key: true, name: true, isActive: true } },
        templateVariant: { select: { id: true, key: true, name: true, isActive: true } },
        sourceVersions: {
          where: { version: 1 },
          take: 1,
          include: { provisionedPage: { select: { id: true, title: true, slug: true } } },
        },
      },
    });
    if (!project) throw new Error("Projeto não encontrado ou sem acesso.");
    if (project.sourceVersions[0]?.provisionedPage) return project.sourceVersions[0].provisionedPage;
    if (!project.template?.isActive || !project.templateVariant?.isActive) {
      throw new Error("Seleciona um template e uma variante ativos antes de provisionar.");
    }

    const sources = await tx.page.findMany({
      where: {
        templateId: project.template.id,
        templateVariantId: project.templateVariant.id,
        isDemo: true,
        status: PageStatus.PUBLISHED,
        demoStatus: { in: [DemoStatus.READY, DemoStatus.PUBLISHED] },
        deletedAt: null,
      },
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: 2,
      include: {
        template: { select: { key: true } },
        templateVariant: { select: { key: true } },
        theme: true,
        sections: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
        forms: { where: { deletedAt: null }, include: { fields: { orderBy: { sortOrder: "asc" } } } },
        seoSetting: true,
      },
    });
    if (sources.length === 0) {
      throw new Error("Não existe uma demo publicada e aprovada para este template e variante.");
    }
    if (sources.length > 1) {
      throw new Error("Existe mais do que uma demo aprovada para esta variante. Revê o catálogo antes de provisionar.");
    }

    const source = sources[0];
    if (!source.theme) {
      throw new Error("A demo aprovada não tem um tema próprio. Configura um tema antes de provisionar o projeto.");
    }
    const slug = `project-${project.id}`;
    const seoTitle = `${project.client.businessName} | ${project.templateVariant.name}`;
    const seoDescription = `Página de apresentação de ${project.client.businessName}. Conteúdo em preparação.`;
    const projectTheme = await tx.theme.create({
      data: {
        name: `${project.client.businessName} · ${source.theme.name}`,
        key: `project-${project.id}`,
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
    const page = await tx.page.create({
      data: {
        title: project.client.businessName,
        slug,
        status: PageStatus.DRAFT,
        pageType: PageType.LANDING,
        isDemo: false,
        templateId: source.templateId,
        templateVariantId: source.templateVariantId,
        themeId: projectTheme.id,
      },
    });

    if (source.sections.length) {
      await tx.pageSection.createMany({
        data: source.sections.map((section) => ({
          pageId: page.id,
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

    for (const form of source.forms) {
      const clonedForm = await tx.form.create({
        data: {
          pageId: page.id,
          name: form.name,
          key: form.key,
          type: form.type,
          status: FormStatus.DRAFT,
          description: form.description,
          successMessage: form.successMessage,
          errorMessage: form.errorMessage,
          recipientEmail: project.client.email ?? "",
          redirectUrl: null,
          gdprConsentRequired: form.gdprConsentRequired,
          gdprConsentLabel: form.gdprConsentLabel,
          gdprConsentVersion: form.gdprConsentVersion,
          isActive: false,
        },
      });
      if (form.fields.length) {
        await tx.formField.createMany({
          data: form.fields.map((field) => ({
            formId: clonedForm.id,
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
          })),
        });
      }
    }

    const seoSetting = source.seoSetting
      ? {
          metaTitle: seoTitle,
          metaDescription: seoDescription,
          keywords: source.seoSetting.keywords,
          ogTitle: null,
          ogDescription: null,
          twitterCardType: source.seoSetting.twitterCardType,
          robotsIndex: false,
          robotsFollow: false,
        }
      : null;
    if (seoSetting) {
      await tx.seoSetting.create({
        data: {
          pageId: page.id,
          ...seoSetting,
          canonicalUrl: null,
          schemaJson: Prisma.DbNull,
        },
      });
    }

    const snapshotData = buildProjectSourceSnapshot({
      ...source,
      title: page.title,
      theme: projectTheme,
      seoSetting,
    });
    await tx.projectSourceVersion.create({
      data: {
        projectId: project.id,
        version: 1,
        templateVersion: snapshotData.templateVersion,
        sourcePageId: source.id,
        provisionedPageId: page.id,
        checksum: snapshotData.checksum,
        snapshot: snapshotData.snapshot as unknown as Prisma.InputJsonValue,
        createdByUserId: actor.id,
      },
    });
    await tx.project.update({
      where: { id: project.id },
      data: { templateVersion: snapshotData.templateVersion },
    });
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: "project.provision_source",
        entityType: "project",
        entityId: project.id,
        newValues: {
          pageId: page.id,
          sourcePageId: source.id,
          version: 1,
          templateVersion: snapshotData.templateVersion,
          checksum: snapshotData.checksum,
        },
      },
    });

    return page;
  });
}
