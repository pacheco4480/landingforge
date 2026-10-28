import { saveCookieConsentAction } from "@/features/legal/actions/legal.actions";
import { getPublicLegalSettings } from "@/features/legal/services/legal-settings.service";
import { submitPublicFormAction } from "@/features/public-renderer/actions/public-form.actions";
import { getSecuritySettings } from "@/lib/security/security-settings.service";
import type { PublicRendererContext } from "@/features/public-renderer/types";
import { PublicLayout } from "@/features/public-renderer/components/public-layout";
import { PublicSectionRenderer } from "@/features/public-renderer/components/public-section-renderer";
import { PublicBaseStyles } from "@/features/public-renderer/components/public-base-styles";
import { ThemeStyle } from "@/features/public-renderer/components/theme-style";

export async function PublicPageRenderer({
  context,
}: {
  context: PublicRendererContext;
}) {
  const [legalSettings, security] = await Promise.all([
    getPublicLegalSettings(),
    getSecuritySettings(),
  ]);
  const renderContext: PublicRendererContext = {
    ...context,
    integrations: {
      submitFormAction: context.previewMode
        ? async () => ({ ok: false, fieldErrors: {}, formError: "Os formulários estão desativados na pré-visualização interna." })
        : submitPublicFormAction,
      turnstileEnabled: security.turnstileEnabled,
      turnstileSiteKey:
        security.turnstileSiteKey ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    },
  };

  return (
    <>
      <ThemeStyle context={renderContext} />
      <PublicBaseStyles />
      <PublicLayout
        context={renderContext}
        legalSettings={legalSettings}
        saveConsentAction={saveCookieConsentAction}
      >
        <PublicSectionRenderer context={renderContext} />
      </PublicLayout>
    </>
  );
}
