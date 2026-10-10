import { PageStatus, PageType } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import { getContentMode } from "@/features/content/content-mode";
import {
  pageCreateSchema,
  pageUpdateSchema,
} from "@/features/content/schemas/page.schema";
import { db } from "@/lib/db";

function nullableId(value?: string) {
  return value && value.length > 0 ? value : null;
}

async function assertSlugAvailable(slug: string, ignoreId?: string) {
  const existingPage = await db.page.findFirst({
    where: {
      slug,
      deletedAt: null,
      ...(ignoreId ? { NOT: { id: ignoreId } } : {}),
    },
    select: { id: true },
  });

  if (existingPage) {
    throw new Error("A page with this slug already exists.");
  }
}

export async function listPagesForUser(userRoles: readonly string[]) {
  const mode = getContentMode(userRoles);

  return db.page.findMany({
    where: { deletedAt: null, ...mode.pageFilter },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      updatedAt: true,
      isDemo: true,
      demoKey: true,
      demoStatus: true,
      portfolioVisible: true,
      portfolioOrder: true,
      template: { select: { key: true, name: true } },
      templateVariant: { select: { key: true, name: true } },
    },
  });
}

export async function getPageForUser(id: string, userRoles: readonly string[]) {
  const mode = getContentMode(userRoles);

  const page = await db.page.findFirst({
    where: { id, deletedAt: null, ...mode.pageFilter },
    include: {
      template: true,
      templateVariant: true,
      theme: true,
      sections: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!page) {
    throw new Error("Page not found.");
  }

  return page;
}

export async function getEditablePageOptions(userRoles: readonly string[]) {
  const mode = getContentMode(userRoles);

  return db.page.findMany({
    where: { deletedAt: null, ...mode.pageFilter },
    orderBy: [{ isDemo: "desc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      isDemo: true,
      demoKey: true,
      demoStatus: true,
      portfolioVisible: true,
      portfolioOrder: true,
      template: { select: { key: true, name: true } },
      templateVariant: { select: { key: true, name: true } },
    },
  });
}

export async function listTemplatesWithVariants() {
  return db.template.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      key: true,
      name: true,
      variants: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, key: true, name: true },
      },
    },
  });
}

export async function createPage(input: unknown, userId: string) {
  const data = pageCreateSchema.parse(input);
  await assertSlugAvailable(data.slug);

  const page = await db.page.create({
    data: {
      title: data.title,
      slug: data.slug,
      status: data.status,
      pageType: data.pageType,
      templateId: nullableId(data.templateId),
      templateVariantId: nullableId(data.templateVariantId),
      publishedAt: data.status === PageStatus.PUBLISHED ? new Date() : null,
    },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: "page.create",
      entityType: "page",
      entityId: page.id,
      newValues: { title: page.title, slug: page.slug, status: page.status },
    },
  });

  return page;
}

export async function updatePage(input: unknown, userId: string) {
  const data = pageUpdateSchema.parse(input);
  await assertSlugAvailable(data.slug, data.id);

  const existingPage = await db.page.findUniqueOrThrow({
    where: { id: data.id },
  });

  const page = await db.page.update({
    where: { id: data.id },
    data: {
      title: data.title,
      slug: data.slug,
      status: data.status,
      pageType: data.pageType,
      templateId: nullableId(data.templateId),
      templateVariantId: nullableId(data.templateVariantId),
      publishedAt:
        data.status === PageStatus.PUBLISHED
          ? (existingPage.publishedAt ?? new Date())
          : existingPage.publishedAt,
    },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: "page.update",
      entityType: "page",
      entityId: page.id,
      oldValues: {
        title: existingPage.title,
        slug: existingPage.slug,
        status: existingPage.status,
      },
      newValues: { title: page.title, slug: page.slug, status: page.status },
    },
  });

  return page;
}

export async function duplicatePage(id: string, userId: string) {
  return db.$transaction(async (tx) => {
    const page = await tx.page.findUniqueOrThrow({
      where: { id },
      include: { sections: { where: { deletedAt: null } } },
    });

    const clone = await tx.page.create({
      data: {
        title: `${page.title} Copy`,
        slug: `${page.slug}-copy-${Date.now()}`,
        status: PageStatus.DRAFT,
        pageType: page.pageType,
        isDemo: page.isDemo,
        demoKey: page.demoKey ? `${page.demoKey}-copy-${Date.now()}` : null,
        templateId: page.templateId,
        templateVariantId: page.templateVariantId,
      },
    });

    for (const section of page.sections) {
      await tx.pageSection.create({
        data: {
          pageId: clone.id,
          sectionKey: `${section.sectionKey}-copy-${Date.now()}`,
          sectionType: section.sectionType,
          name: `${section.name} Copy`,
          sortOrder: section.sortOrder,
          isVisible: section.isVisible,
          content: section.content as Prisma.InputJsonValue,
          settings: section.settings as Prisma.InputJsonValue,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId,
        action: "page.duplicate",
        entityType: "page",
        entityId: clone.id,
        newValues: { sourcePageId: page.id, title: clone.title },
      },
    });

    return clone;
  });
}

export async function archivePage(id: string, userId: string) {
  const page = await db.page.update({
    where: { id },
    data: { status: PageStatus.ARCHIVED },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: "page.archive",
      entityType: "page",
      entityId: page.id,
      newValues: { status: PageStatus.ARCHIVED },
    },
  });
}

export async function deletePage(id: string, userId: string) {
  const page = await db.page.update({
    where: { id },
    data: { deletedAt: new Date(), status: PageStatus.ARCHIVED },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: "page.delete",
      entityType: "page",
      entityId: page.id,
      newValues: { deletedAt: page.deletedAt },
    },
  });
}

export const pageStatusOptions = [
  PageStatus.DRAFT,
  PageStatus.PUBLISHED,
  PageStatus.ARCHIVED,
] as const;

export const pageTypeOptions = [
  PageType.LANDING,
  PageType.LEGAL,
  PageType.THANK_YOU,
  PageType.CUSTOM,
] as const;
