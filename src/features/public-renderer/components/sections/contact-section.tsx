import type { PublicSectionProps } from "@/features/public-renderer/types";
import { PublicForm } from "@/features/public-renderer/components/forms/public-form";
import {
  PublicBand,
  SectionHeading,
} from "@/features/public-renderer/components/sections/basic-sections";
import { text } from "@/features/public-renderer/components/section-utils";
import { resolvePresentation } from "@/features/public-renderer/section-presentation";

export async function ContactSection({
  section,
  context,
  title,
  description,
}: PublicSectionProps & { title?: string; description?: string }) {
  const form = context.page.forms[0] ?? null;
  const variant = resolvePresentation(
    section.sectionType,
    section.settings,
    context.page.template?.key,
    context.page.templateVariant?.key,
  );
  const compact = variant === "compact";
  const editorial = variant === "editorial";
  const email = text(
    section.content,
    "email",
    context.page.isDemo ? "" : context.site.contactEmail,
  );
  const phone = text(
    section.content,
    "phone",
    context.page.isDemo ? "" : (context.site.contactPhone ?? ""),
  );

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
            title={title ?? text(section.content, "title", "Contacte-nos")}
            descriptionClassName="text-[var(--public-muted)]"
            description={
              description ??
              text(
                section.content,
                "text",
                "Envie o seu pedido e entraremos em contacto.",
              )
            }
          />
          {email || phone ? (
            <dl className="mt-6 grid gap-3 text-sm text-[var(--public-muted)] sm:grid-cols-2">
              {email ? (
                <div>
                  <dt className="font-semibold text-[var(--public-text)]">Email</dt>
                  <dd>{email}</dd>
                </div>
              ) : null}
              {phone ? (
                <div>
                  <dt className="font-semibold text-[var(--public-text)]">
                    Telefone
                  </dt>
                  <dd>{phone}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
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
          {form && context.integrations?.submitFormAction ? (
            <PublicForm
              submitAction={context.integrations.submitFormAction}
              formId={form.id}
              pageId={context.page.id}
              fields={form.fields}
              gdprConsentLabel={form.gdprConsentLabel}
              gdprConsentRequired={form.gdprConsentRequired}
              gdprConsentVersion={form.gdprConsentVersion}
              turnstileSiteKey={
                context.integrations.turnstileEnabled
                  ? context.integrations.turnstileSiteKey
                  : null
              }
              className={compact ? "gap-3" : undefined}
            />
          ) : (
            <p className="text-sm text-[var(--public-muted)]">
              Formulário temporariamente indisponível.
            </p>
          )}
        </div>
      </div>
    </PublicBand>
  );
}
