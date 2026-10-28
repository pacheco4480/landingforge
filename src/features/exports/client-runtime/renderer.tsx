import type { ReactNode } from "react";

import { PublicBaseStyles } from "@/features/public-renderer/components/public-base-styles";
import { PublicLayout, type PublicLayoutLegalSettings } from "@/features/public-renderer/components/public-layout";
import { PublicSectionList } from "@/features/public-renderer/components/public-section-list";
import { ThemeStyle } from "@/features/public-renderer/components/theme-style";
import type { ClientRuntimePayload } from "@/features/exports/client-runtime/contracts";
import type { ClientRuntimeTemplateEntry } from "@/features/exports/client-runtime/template-entry";
import type { PublicRendererContext, PublicSiteData } from "@/features/public-renderer/types";

type ClientRuntimeFormAction = NonNullable<PublicRendererContext["integrations"]>["submitFormAction"];

export function ClientRuntimeRenderer({
  payload,
  templateEntry,
  site,
  legalSettings,
  saveConsentAction,
  submitFormAction,
  turnstileEnabled = false,
  turnstileSiteKey = null,
}: {
  payload: ClientRuntimePayload;
  templateEntry: ClientRuntimeTemplateEntry;
  site: PublicSiteData;
  legalSettings: PublicLayoutLegalSettings;
  saveConsentAction: (formData: FormData) => Promise<void>;
  submitFormAction?: ClientRuntimeFormAction;
  turnstileEnabled?: boolean;
  turnstileSiteKey?: string | null;
}) {
  const context: PublicRendererContext = {
    page: {
      id: payload.page.slug,
      title: payload.page.title,
      slug: payload.page.slug,
      template: { key: payload.templateKey },
      templateVariant: { key: payload.variantKey },
      theme: {
        primaryColor: payload.page.theme.primaryColor,
        secondaryColor: payload.page.theme.secondaryColor,
        accentColor: payload.page.theme.accentColor,
        backgroundColor: payload.page.theme.backgroundColor,
        surfaceColor: payload.page.theme.surfaceColor,
        textPrimaryColor: payload.page.theme.textPrimaryColor,
        textSecondaryColor: payload.page.theme.textSecondaryColor,
        headingFont: payload.page.theme.headingFont,
        bodyFont: payload.page.theme.bodyFont,
        borderRadius: payload.page.theme.borderRadius,
      },
      sections: payload.page.sections.map((section) => ({
        id: section.sectionKey,
        ...section,
        isVisible: true,
      })),
      forms: payload.page.forms.map((form) => ({
        id: form.key,
        gdprConsentLabel: form.gdprConsentLabel ?? "Li e aceito a Política de Privacidade.",
        gdprConsentRequired: form.gdprConsentRequired ?? true,
        gdprConsentVersion: form.gdprConsentVersion ?? "1.0",
        fields: form.fields.map((field) => ({
          id: field.name,
          ...field,
          isVisible: true,
        })),
      })),
    },
    site,
    integrations: {
      submitFormAction,
      turnstileEnabled,
      turnstileSiteKey,
    },
  };
  const sections: ReactNode = templateEntry.wrapSections(
    <PublicSectionList context={context} registry={templateEntry.sectionRegistry} />,
  );

  return (
    <>
      <ThemeStyle context={context} />
      <PublicBaseStyles />
      <PublicLayout context={context} legalSettings={legalSettings} saveConsentAction={saveConsentAction}>
        {sections}
      </PublicLayout>
    </>
  );
}
