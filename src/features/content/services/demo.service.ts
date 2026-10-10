import {
  DemoStatus,
  FormStatus,
  PageStatus,
  PageType,
  Prisma,
} from "@/generated/prisma/client";
import {
  demoCreateSchema,
  demoFilterSchema,
  demoIdSchema,
  demoSettingsSchema,
} from "@/features/content/schemas/demo.schema";
import { isInternalDemoModeEnabled } from "@/config/deployment";
import { hasRole } from "@/features/rbac/rbac.service";
import { db } from "@/lib/db";

function nullableId(value?: string) {
  return value && value.length > 0 ? value : null;
}

export function assertCanManageDemos(userRoles: readonly string[]) {
  if (!isInternalDemoModeEnabled() || !hasRole(userRoles, "super_admin")) {
    throw new Error("Internal Demo Mode is not available.");
  }
}

async function assertSlugAvailable(slug: string, ignoreId?: string) {
  const existing = await db.page.findFirst({
    where: { slug, deletedAt: null, ...(ignoreId ? { NOT: { id: ignoreId } } : {}) },
    select: { id: true },
  });
  if (existing) throw new Error("A page with this slug already exists.");
}

async function assertDemoKeyAvailable(demoKey: string, ignoreId?: string) {
  const existing = await db.page.findFirst({
    where: {
      demoKey,
      isDemo: true,
      deletedAt: null,
      ...(ignoreId ? { NOT: { id: ignoreId } } : {}),
    },
    select: { id: true },
  });
  if (existing) throw new Error("A demo with this key already exists.");
}

async function assertDemoPage(id: string) {
  const page = await db.page.findFirst({
    where: { id, isDemo: true, deletedAt: null },
    include: {
      sections: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      forms: { where: { deletedAt: null }, include: { fields: true } },
      seoSetting: true,
    },
  });
  if (!page) throw new Error("Demo not found.");
  return page;
}

export async function getDemoWorkspace(
  userRoles: readonly string[],
  filtersInput: unknown,
) {
  assertCanManageDemos(userRoles);
  const filters = demoFilterSchema.parse(filtersInput);
  const where: Prisma.PageWhereInput = {
    isDemo: true,
    deletedAt: null,
    ...(filters.status ? { demoStatus: filters.status } : {}),
    ...(filters.industryId
      ? { template: { is: { industryId: filters.industryId } } }
      : {}),
    ...(filters.templateId ? { templateId: filters.templateId } : {}),
    ...(filters.templateVariantId ? { templateVariantId: filters.templateVariantId } : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search } },
            { slug: { contains: filters.search } },
            { demoKey: { contains: filters.search } },
            { template: { is: { name: { contains: filters.search } } } },
            {
              template: {
                is: {
                  industry: { is: { name: { contains: filters.search } } },
                },
              },
            },
          ],
        }
      : {}),
  };

  const [demos, industries, templates, themes] = await Promise.all([
    db.page.findMany({
      where,
      orderBy: [{ portfolioOrder: "asc" }, { updatedAt: "desc" }],
      take: 80,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        demoKey: true,
        demoStatus: true,
        portfolioVisible: true,
        portfolioOrder: true,
        updatedAt: true,
        templateId: true,
        templateVariantId: true,
        themeId: true,
        template: {
          select: {
            id: true,
            key: true,
            name: true,
            industry: { select: { id: true, name: true } },
          },
        },
        templateVariant: { select: { id: true, key: true, name: true } },
        theme: { select: { id: true, key: true, name: true } },
      },
    }),
    db.industry.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.template.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        key: true,
        industryId: true,
        variants: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true, key: true },
        },
      },
    }),
    db.theme.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, key: true },
    }),
  ]);

  return { demos, industries, templates, themes, filters };
}

export async function createDemo(input: unknown, userId: string, userRoles: readonly string[]) {
  assertCanManageDemos(userRoles);
  const data = demoCreateSchema.parse(input);
  await assertSlugAvailable(data.slug);
  await assertDemoKeyAvailable(data.demoKey);

  const page = await db.page.create({
    data: {
      title: data.title,
      slug: data.slug,
      status: PageStatus.DRAFT,
      pageType: PageType.LANDING,
      isDemo: true,
      demoKey: data.demoKey,
      demoStatus: DemoStatus.DRAFT,
      templateId: nullableId(data.templateId),
      templateVariantId: nullableId(data.templateVariantId),
      themeId: nullableId(data.themeId),
    },
  });

  await db.seoSetting.create({
    data: {
      pageId: page.id,
      metaTitle: `${page.title} Demo Landing Page`,
      metaDescription: `${page.title} demo page prepared for internal LandingForge template validation and screenshots.`,
      canonicalUrl: `http://localhost:3000/${page.slug}`,
      robotsIndex: false,
      robotsFollow: false,
      twitterCardType: "summary_large_image",
    },
  });

  await auditDemo(userId, "demo.create", page.id, { title: page.title });
  return page;
}

export async function updateDemoSettings(input: unknown, userId: string, userRoles: readonly string[]) {
  assertCanManageDemos(userRoles);
  const data = demoSettingsSchema.parse(input);
  const current = await assertDemoPage(data.id);
  await assertSlugAvailable(data.slug, data.id);
  await assertDemoKeyAvailable(data.demoKey, data.id);

  const updated = await db.page.update({
    where: { id: data.id },
    data: {
      title: data.title,
      slug: data.slug,
      demoKey: data.demoKey,
      status: data.pageStatus,
      demoStatus: data.demoStatus,
      portfolioVisible: data.portfolioVisible,
      portfolioOrder: data.portfolioOrder === "" ? null : data.portfolioOrder,
      templateId: nullableId(data.templateId),
      templateVariantId: nullableId(data.templateVariantId),
      themeId: nullableId(data.themeId),
      publishedAt:
        data.pageStatus === PageStatus.PUBLISHED
          ? (current.publishedAt ?? new Date())
          : current.publishedAt,
    },
  });
  await auditDemo(userId, "demo.update", updated.id, {
    status: updated.status,
    demoStatus: updated.demoStatus,
  });
  return updated;
}

export async function duplicateDemo(idInput: unknown, userId: string, userRoles: readonly string[]) {
  assertCanManageDemos(userRoles);
  const { id } = demoIdSchema.parse({ id: idInput });
  return db.$transaction(async (tx) => {
    const source = await tx.page.findFirstOrThrow({
      where: { id, isDemo: true, deletedAt: null },
      include: {
        sections: { where: { deletedAt: null } },
        forms: { where: { deletedAt: null }, include: { fields: true } },
        seoSetting: true,
      },
    });
    const suffix = Date.now();
    const clone = await tx.page.create({
      data: {
        title: `${source.title} Copy`,
        slug: `${source.slug}-copy-${suffix}`,
        status: PageStatus.DRAFT,
        pageType: source.pageType,
        isDemo: true,
        demoKey: `${source.demoKey ?? source.slug}-copy-${suffix}`,
        demoStatus: DemoStatus.DRAFT,
        templateId: source.templateId,
        templateVariantId: source.templateVariantId,
        themeId: source.themeId,
      },
    });

    for (const section of source.sections) {
      await tx.pageSection.create({
        data: {
          pageId: clone.id,
          sectionKey: section.sectionKey,
          sectionType: section.sectionType,
          name: section.name,
          sortOrder: section.sortOrder,
          isVisible: section.isVisible,
          content: section.content as Prisma.InputJsonValue,
          settings: section.settings as Prisma.InputJsonValue,
        },
      });
    }

    if (source.seoSetting) {
      await tx.seoSetting.create({
        data: {
          pageId: clone.id,
          metaTitle: source.seoSetting.metaTitle,
          metaDescription: source.seoSetting.metaDescription,
          canonicalUrl: `http://localhost:3000/${clone.slug}`,
          robotsIndex: false,
          robotsFollow: false,
          twitterCardType: source.seoSetting.twitterCardType,
          schemaJson: source.seoSetting.schemaJson as Prisma.InputJsonValue,
        },
      });
    }

    for (const form of source.forms) {
      const cloneForm = await tx.form.create({
        data: {
          pageId: clone.id,
          name: `${form.name} Copy`,
          key: `${form.key}-copy-${suffix}`,
          type: form.type,
          status: FormStatus.DRAFT,
          successMessage: form.successMessage,
          errorMessage: form.errorMessage,
          recipientEmail: form.recipientEmail,
        },
      });
      for (const field of form.fields) {
        await tx.formField.create({
          data: {
            formId: cloneForm.id,
            label: field.label,
            name: field.name,
            type: field.type,
            placeholder: field.placeholder,
            helpText: field.helpText,
            defaultValue: field.defaultValue,
            options: field.options as Prisma.InputJsonValue,
            validation: field.validation as Prisma.InputJsonValue,
            conditionalLogic: field.conditionalLogic as Prisma.InputJsonValue,
            sortOrder: field.sortOrder,
            isRequired: field.isRequired,
            isVisible: field.isVisible,
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        userId,
        action: "demo.duplicate",
        entityType: "page",
        entityId: clone.id,
        newValues: { sourcePageId: source.id },
      },
    });
    return clone;
  });
}

export async function archiveDemo(idInput: unknown, userId: string, userRoles: readonly string[]) {
  assertCanManageDemos(userRoles);
  const { id } = demoIdSchema.parse({ id: idInput });
  await assertDemoPage(id);
  const page = await db.page.update({
    where: { id },
    data: { status: PageStatus.ARCHIVED, demoStatus: DemoStatus.ARCHIVED, portfolioVisible: false },
  });
  await auditDemo(userId, "demo.archive", page.id, {});
}

export async function deleteDemo(idInput: unknown, userId: string, userRoles: readonly string[]) {
  assertCanManageDemos(userRoles);
  const { id } = demoIdSchema.parse({ id: idInput });
  await assertDemoPage(id);
  const page = await db.page.update({
    where: { id },
    data: { deletedAt: new Date(), status: PageStatus.ARCHIVED, demoStatus: DemoStatus.ARCHIVED, portfolioVisible: false },
  });
  await auditDemo(userId, "demo.delete", page.id, { deletedAt: page.deletedAt });
}

async function auditDemo(
  userId: string,
  action: string,
  entityId: string,
  values: Record<string, unknown>,
) {
  await db.auditLog.create({
    data: {
      userId,
      action,
      entityType: "page",
      entityId,
      newValues: values as Prisma.InputJsonValue,
    },
  });
}
