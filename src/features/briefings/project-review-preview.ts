import { buildClientRuntimePayload } from "@/features/exports/services/client-runtime-payload";
import type { ProjectSourceSnapshot } from "@/features/exports/services/project-source-snapshot";
import type { PublicRendererContext } from "@/features/public-renderer/types";

export function buildProjectReviewPreview(
  snapshot: ProjectSourceSnapshot,
  checksum: string,
  businessName: string,
): PublicRendererContext {
  const payload = buildClientRuntimePayload(snapshot, checksum);
  const theme = payload.page.theme;

  return {
    previewMode: true,
    page: {
      id: snapshot.sourcePageId,
      title: payload.page.title,
      slug: payload.page.slug,
      template: { key: payload.templateKey },
      templateVariant: { key: payload.variantKey },
      theme,
      sections: payload.page.sections.map((section) => ({
        id: section.sectionKey,
        ...section,
        isVisible: true,
      })),
      forms: payload.page.forms.map((form) => ({
        id: form.key,
        gdprConsentLabel:
          form.gdprConsentLabel ?? "Li e aceito a Política de Privacidade.",
        gdprConsentRequired: form.gdprConsentRequired ?? true,
        gdprConsentVersion: form.gdprConsentVersion ?? "1.0",
        fields: form.fields.map((field) => ({
          id: field.name,
          ...field,
          isVisible: true,
        })),
      })),
    },
    site: {
      businessName,
      businessType: null,
      contactEmail: "",
      contactPhone: null,
      city: null,
      country: null,
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      accentColor: theme.accentColor,
      logoMedia: null,
    },
  };
}
