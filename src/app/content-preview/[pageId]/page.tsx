import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPageForUser } from "@/features/content/services/page.service";
import { PublicPageRenderer } from "@/features/public-renderer/components/public-page-renderer";
import type { PublicRendererContext } from "@/features/public-renderer/types";
import { permissions } from "@/features/rbac/permissions";
import { requireAuth } from "@/lib/auth/require-auth";
import { db } from "@/lib/db";

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PrivateContentPreviewPage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const user = await requireAuth();
  if (!user.permissions.includes(permissions.cmsRead) && !user.permissions.includes(permissions.projectsWrite)) {
    notFound();
  }
  const { pageId } = await params;
  let page;
  try {
    page = await getPageForUser(pageId, user.roles, user);
  } catch {
    notFound();
  }

  const [site, forms] = await Promise.all([
    db.siteSetting.findFirst({ include: { logoMedia: { select: { publicUrl: true, altText: true } } } }),
    db.form.findMany({
      where: { pageId, deletedAt: null },
      include: { fields: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);
  if (!site) notFound();

  const context: PublicRendererContext = {
    previewMode: true,
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
    page: {
      id: page.id,
      title: page.title,
      slug: page.slug,
      isDemo: page.isDemo,
      template: page.template ? { key: page.template.key } : null,
      templateVariant: page.templateVariant ? { key: page.templateVariant.key } : null,
      theme: page.theme ? {
        primaryColor: page.theme.primaryColor,
        secondaryColor: page.theme.secondaryColor,
        accentColor: page.theme.accentColor,
        backgroundColor: page.theme.backgroundColor,
        surfaceColor: page.theme.surfaceColor,
        textPrimaryColor: page.theme.textPrimaryColor,
        textSecondaryColor: page.theme.textSecondaryColor,
        headingFont: page.theme.headingFont,
        bodyFont: page.theme.bodyFont,
        borderRadius: page.theme.borderRadius,
      } : null,
      sections: page.sections,
      forms: forms.map((form) => ({
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
  };

  return <PublicPageRenderer context={context} />;
}
