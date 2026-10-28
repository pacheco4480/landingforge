import type { Prisma } from "@/generated/prisma/client";
import { meetsWcagAa } from "@/features/branding/services/contrast.service";
import { themeSchema } from "@/features/branding/schemas/theme.schema";
import { db } from "@/lib/db";

export async function listThemes() {
  return db.theme.findMany({
    where: { pages: { none: { maintenanceCandidate: { isNot: null } } } },
    orderBy: { name: "asc" },
  });
}

export async function createTheme(input: unknown, userId: string) {
  const data = validateTheme(input);
  const theme = await db.theme.create({
    data: {
      ...data,
      settings: {
        spacing: "medium",
        animations: "subtle",
      },
    },
  });

  await auditTheme(userId, "theme.create", theme.id, theme.name);
  return theme;
}

export async function updateTheme(input: unknown, userId: string) {
  const data = validateTheme(input);
  if (!data.id) throw new Error("Theme id is required.");
  const maintenancePage = await db.page.findFirst({
    where: { themeId: data.id, maintenanceCandidate: { isNot: null } },
    select: { id: true },
  });
  if (maintenancePage) throw new Error("O tema de uma versão de manutenção só pode ser alterado no âmbito do projeto.");

  const theme = await db.theme.update({
    where: { id: data.id },
    data: {
      ...data,
      settings: {
        spacing: "medium",
        animations: "subtle",
      },
    },
  });

  await auditTheme(userId, "theme.update", theme.id, theme.name);
  return theme;
}

export async function duplicateTheme(id: string, userId: string) {
  const source = await db.theme.findUniqueOrThrow({ where: { id } });
  const theme = await db.theme.create({
    data: {
      name: `${source.name} Copy`,
      key: `${source.key}-copy-${Date.now()}`,
      primaryColor: source.primaryColor,
      secondaryColor: source.secondaryColor,
      accentColor: source.accentColor,
      backgroundColor: source.backgroundColor,
      surfaceColor: source.surfaceColor,
      textPrimaryColor: source.textPrimaryColor,
      textSecondaryColor: source.textSecondaryColor,
      headingFont: source.headingFont,
      bodyFont: source.bodyFont,
      borderRadius: source.borderRadius,
      shadowStyle: source.shadowStyle,
      settings: source.settings as Prisma.InputJsonValue,
    },
  });

  await auditTheme(userId, "theme.duplicate", theme.id, theme.name);
  return theme;
}

export async function applyThemeToPage(
  themeId: string,
  pageId: string,
  userId: string,
) {
  const page = await db.page.update({
    where: { id: pageId },
    data: { themeId },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: "theme.apply",
      entityType: "page",
      entityId: page.id,
      newValues: { themeId },
    },
  });
}

function validateTheme(input: unknown) {
  const theme = themeSchema.parse(input);
  if (!meetsWcagAa(theme.textPrimaryColor, theme.backgroundColor)) {
    throw new Error("Primary text color does not meet WCAG AA contrast.");
  }
  if (!meetsWcagAa(theme.textSecondaryColor, theme.surfaceColor)) {
    throw new Error("Secondary text color does not meet WCAG AA contrast.");
  }
  return theme;
}

async function auditTheme(
  userId: string,
  action: string,
  themeId: string,
  themeName: string,
) {
  await db.auditLog.create({
    data: {
      userId,
      action,
      entityType: "theme",
      entityId: themeId,
      newValues: { name: themeName },
    },
  });
}
