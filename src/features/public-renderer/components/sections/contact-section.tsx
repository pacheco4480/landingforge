import { getSecuritySettings } from "@/lib/security/security-settings.service";
import type { PublicSectionProps } from "@/features/public-renderer/types";
import { PublicForm } from "@/features/public-renderer/components/forms/public-form";
import {
  PublicBand,
  SectionHeading,
} from "@/features/public-renderer/components/sections/basic-sections";
import { text } from "@/features/public-renderer/components/section-utils";
import { resolvePresentation } from "@/features/public-renderer/section-presentation";

export async function ContactSection({ section, context }: PublicSectionProps) {
  const form = context.page.forms[0] ?? null;
  const security = await getSecuritySettings();
  const turnstileSiteKey =
    security.turnstileSiteKey ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const variant = resolvePresentation(
    section.sectionType,
    section.settings,
    context.page.template?.key,
    context.page.templateVariant?.key,
  );
  const compact = variant === "compact";
  const editorial = variant === "editorial";

  return (
    <PublicBand id="contact">
      <div
        className={`grid gap-8 ${compact ? "mx-auto max-w-3xl" : editorial ? "lg:grid-cols-[1fr_1.1fr]" : "lg:grid-cols-[0.9fr_1.1fr]"}`}
      >
        <div
          className={
            editorial
              ? "rounded-md border-l-4 border-[var(--public-primary)] bg-[var(--public-surface)] p-6 sm:p-9"
              : compact
                ? "text-center"
                : undefined
          }
        >
          <SectionHeading
            title={text(section.content, "title", "Contacte-nos")}
            descriptionClassName="text-[var(--public-muted)]"
            description={text(
              section.content,
              "text",
              "Envie o seu pedido e entraremos em contacto.",
            )}
          />
          <dl className="mt-6 grid gap-3 text-sm text-[var(--public-muted)] sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-[var(--public-text)]">Email</dt>
              <dd>
                {text(section.content, "email", context.site.contactEmail)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--public-text)]">
                Telefone
              </dt>
              <dd>
                {text(
                  section.content,
                  "phone",
                  context.site.contactPhone ?? "",
                )}
              </dd>
            </div>
          </dl>
        </div>
        <div
          className={
            compact
              ? "public-card p-5 sm:p-6"
              : editorial
                ? "public-card p-6 sm:p-9"
                : "public-card"
          }
        >
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
              className={compact ? "gap-3" : undefined}
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
