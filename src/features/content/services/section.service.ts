import {
  createDefaultSectionContent,
  createDefaultSectionSettings,
} from "@/features/content/section-types";
import type { Prisma } from "@/generated/prisma/client";
import {
  sectionCreateSchema,
  sectionUpdateSchema,
} from "@/features/content/schemas/section.schema";
import { db } from "@/lib/db";

async function getNextSortOrder(pageId: string) {
  const aggregate = await db.pageSection.aggregate({
    where: { pageId, deletedAt: null },
    _max: { sortOrder: true },
  });

  return (aggregate._max.sortOrder ?? -1) + 1;
}

export async function createSection(input: unknown, userId: string) {
  const data = sectionCreateSchema.parse(input);
  const sortOrder = await getNextSortOrder(data.pageId);

  const section = await db.pageSection.create({
    data: {
      pageId: data.pageId,
      sectionKey: `${data.sectionType}-${Date.now()}`,
      sectionType: data.sectionType,
      name: data.name,
      sortOrder,
      content: createDefaultSectionContent(
        data.sectionType,
      ) as Prisma.InputJsonValue,
      settings: createDefaultSectionSettings() as Prisma.InputJsonValue,
    },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: "section.create",
      entityType: "page_section",
      entityId: section.id,
      newValues: { pageId: section.pageId, sectionType: section.sectionType },
    },
  });

  return section;
}

export async function updateSection(input: unknown, userId: string) {
  const data = sectionUpdateSchema.parse(input);
  const existingSection = await db.pageSection.findUniqueOrThrow({
    where: { id: data.id },
  });

  const section = await db.pageSection.update({
    where: { id: data.id },
    data: {
      name: data.name,
      sectionType: data.sectionType,
      content: data.content as Prisma.InputJsonValue,
      settings: data.settings as Prisma.InputJsonValue,
    },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: "section.update",
      entityType: "page_section",
      entityId: section.id,
      oldValues: {
        name: existingSection.name,
        sectionType: existingSection.sectionType,
        content: existingSection.content,
      },
      newValues: {
        name: section.name,
        sectionType: section.sectionType,
        content: section.content,
      },
    },
  });

  return section;
}

export async function duplicateSection(id: string, userId: string) {
  const section = await db.pageSection.findUniqueOrThrow({ where: { id } });
  const sortOrder = await getNextSortOrder(section.pageId);

  const clone = await db.pageSection.create({
    data: {
      pageId: section.pageId,
      sectionKey: `${section.sectionKey}-copy-${Date.now()}`,
      sectionType: section.sectionType,
      name: `${section.name} Copy`,
      sortOrder,
      isVisible: section.isVisible,
      content: section.content as Prisma.InputJsonValue,
      settings: section.settings as Prisma.InputJsonValue,
    },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: "section.duplicate",
      entityType: "page_section",
      entityId: clone.id,
      newValues: { sourceSectionId: section.id, pageId: section.pageId },
    },
  });

  return clone;
}

export async function deleteSection(id: string, userId: string) {
  const section = await db.pageSection.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: "section.delete",
      entityType: "page_section",
      entityId: section.id,
      newValues: { deletedAt: section.deletedAt },
    },
  });
}

export async function toggleSectionVisibility(id: string, userId: string) {
  const section = await db.pageSection.findUniqueOrThrow({ where: { id } });
  const updatedSection = await db.pageSection.update({
    where: { id },
    data: { isVisible: !section.isVisible },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: "section.visibility.toggle",
      entityType: "page_section",
      entityId: section.id,
      oldValues: { isVisible: section.isVisible },
      newValues: { isVisible: updatedSection.isVisible },
    },
  });
}

export async function moveSection(
  id: string,
  direction: "up" | "down",
  userId: string,
) {
  await db.$transaction(async (tx) => {
    const section = await tx.pageSection.findUniqueOrThrow({ where: { id } });
    const sibling = await tx.pageSection.findFirst({
      where: {
        pageId: section.pageId,
        deletedAt: null,
        sortOrder:
          direction === "up"
            ? { lt: section.sortOrder }
            : { gt: section.sortOrder },
      },
      orderBy: { sortOrder: direction === "up" ? "desc" : "asc" },
    });

    if (!sibling) return;

    await tx.pageSection.update({
      where: { id: section.id },
      data: { sortOrder: sibling.sortOrder },
    });
    await tx.pageSection.update({
      where: { id: sibling.id },
      data: { sortOrder: section.sortOrder },
    });
    await tx.auditLog.create({
      data: {
        userId,
        action: "section.reorder",
        entityType: "page_section",
        entityId: section.id,
        newValues: { direction, siblingId: sibling.id },
      },
    });
  });
}
