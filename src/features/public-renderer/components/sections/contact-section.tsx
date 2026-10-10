import { getSecuritySettings } from "@/lib/security/security-settings.service";
import type { PublicSectionProps } from "@/features/public-renderer/types";
import { PublicForm } from "@/features/public-renderer/components/forms/public-form";
import {
  PublicBand,
  SectionHeading,
} from "@/features/public-renderer/components/sections/basic-sections";
import { text } from "@/features/public-renderer/components/section-utils";

export async function ContactSection({ section, context }: PublicSectionProps) {
  const form = context.page.forms[0] ?? null;
  const security = await getSecuritySettings();
  const turnstileSiteKey =
    security.turnstileSiteKey ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <PublicBand id="contact">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading
            title={text(section.content, "title", "Contacte-nos")}
            description={text(
              section.content,
              "text",
              "Envie o seu pedido e entraremos em contacto.",
            )}
          />
          <dl className="mt-6 grid gap-3 text-sm text-[var(--public-muted)]">
            <div>
              <dt className="font-semibold text-[var(--public-text)]">Email</dt>
              <dd>{text(section.content, "email", context.site.contactEmail)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--public-text)]">Telefone</dt>
              <dd>{text(section.content, "phone", context.site.contactPhone ?? "")}</dd>
            </div>
          </dl>
        </div>
        <div className="public-card">
          {form ? (
            <PublicForm
              formId={form.id}
              pageId={context.page.id}
              fields={form.fields}
              gdprConsentLabel={form.gdprConsentLabel}
              gdprConsentRequired={form.gdprConsentRequired}
              gdprConsentVersion={form.gdprConsentVersion}
              turnstileSiteKey={
                security.turnstileEnabled ? turnstileSiteKey : null
              }
            />
          ) : (
            <p className="text-sm text-[var(--public-muted)]">
              Formulário ainda não configurado.
            </p>
          )}
        </div>
      </div>
    </PublicBand>
  );
}
