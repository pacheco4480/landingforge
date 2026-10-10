import { toCsv } from "@/features/exports/services/csv.service";
import { db } from "@/lib/db";

export async function exportPagesJson() {
  const pages = await db.page.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: {
      seoSetting: true,
      sections: { where: { deletedAt: null }, orderBy: { sortOrder: "asc" } },
      template: { select: { key: true, name: true } },
      templateVariant: { select: { key: true, name: true } },
      theme: { select: { key: true, name: true } },
    },
  });
  return JSON.stringify({ generatedAt: new Date().toISOString(), pages }, null, 2);
}

export async function exportFormsJson() {
  const forms = await db.form.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });
  return JSON.stringify({ generatedAt: new Date().toISOString(), forms }, null, 2);
}

export async function exportSettingsJson() {
  const [
    siteSettings,
    clientSettings,
    securitySettings,
    legalSettings,
    themes,
    redirects,
  ] = await Promise.all([
    db.siteSetting.findMany(),
    db.clientSetting.findMany(),
    db.securitySetting.findMany(),
    db.legalSetting.findMany(),
    db.theme.findMany(),
    db.redirect.findMany(),
  ]);

  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      clientSettings,
      legalSettings,
      redirects,
      securitySettings,
      siteSettings,
      themes,
    },
    null,
    2,
  );
}

export async function exportPagesCsv() {
  const pages = await db.page.findMany({
    where: { deletedAt: null },
    orderBy: { updatedAt: "desc" },
    include: {
      template: { select: { name: true } },
      templateVariant: { select: { name: true } },
    },
  });

  return toCsv([
    ["Titulo", "Slug", "Estado", "Tipo", "Template", "Variante", "Atualizado"],
    ...pages.map((page) => [
      page.title,
      page.slug,
      page.status,
      page.pageType,
      page.template?.name ?? "",
      page.templateVariant?.name ?? "",
      page.updatedAt,
    ]),
  ]);
}
