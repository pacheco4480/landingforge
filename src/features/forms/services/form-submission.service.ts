import { FormStatus, LeadStatus, Prisma } from "@/generated/prisma/client";
import { sendLeadNotificationEmail } from "@/features/email/services/lead-notification-email.service";
import { validateSubmissionFields } from "@/features/forms/services/form-validation.service";
import type { SubmissionContext } from "@/features/forms/schemas/submission.schema";
import { assertSubmissionCooldown } from "@/lib/security/duplicate-submission.service";
import { assertHoneypot, honeypotFieldName } from "@/lib/security/honeypot.service";
import { assertRateLimit } from "@/lib/security/rate-limiter";
import { verifyTurnstile } from "@/lib/security/turnstile.service";
import { db } from "@/lib/db";

export class FormSubmissionValidationError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors: Record<string, string>,
  ) {
    super(message);
    this.name = "FormSubmissionValidationError";
  }
}

export async function submitForm(
  context: SubmissionContext,
  values: Record<string, unknown>,
) {
  await assertRateLimit({
    action: "form-submit",
    key: context.ipAddress ?? context.formId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
  await assertHoneypot({
    value: values[honeypotFieldName],
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
  await assertSubmissionCooldown({
    formId: context.formId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
  const turnstileOk = await verifyTurnstile({
    token: stringValue(values["cf-turnstile-response"]),
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
  });
  if (!turnstileOk) throw new Error("Não foi possível validar o formulário.");

  const form = await db.form.findUniqueOrThrow({
    where: { id: context.formId },
    include: {
      fields: { orderBy: { sortOrder: "asc" } },
      page: { select: { slug: true, title: true } },
    },
  });
  if (form.status !== FormStatus.PUBLISHED || form.deletedAt) {
    throw new Error("Este formulário não está disponível para submissões.");
  }
  const consentGiven = values.gdprConsent === "yes";
  if (form.gdprConsentRequired && !consentGiven) {
    throw new FormSubmissionValidationError(
      "Aceita a Política de Privacidade para enviar o formulário.",
      { gdprConsent: "Aceita a Política de Privacidade para enviar." },
    );
  }

  const errors = validateSubmissionFields(form.fields, values);
  if (errors.length > 0) {
    throw new FormSubmissionValidationError(
      "Verifica os campos assinalados.",
      Object.fromEntries(errors.map((error) => [error.name, error.message])),
    );
  }

  const result = await db.$transaction(async (tx) => {
    const consentGivenAt = consentGiven ? new Date() : null;
    const consentVersion =
      stringValue(values.gdprConsentVersion) ?? form.gdprConsentVersion;
    const submission = await tx.formSubmission.create({
      data: {
        formId: form.id,
        pageId: context.pageId ?? form.pageId,
        data: cleanSubmissionValues(values) as Prisma.InputJsonValue,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        referrer: context.referrer,
        consentGiven,
        consentVersion,
        consentGivenAt,
        consentSource: "public_form",
      },
    });

    const lead = await tx.lead.create({
      data: {
        formSubmissionId: submission.id,
        name: stringValue(values.name),
        email: stringValue(values.email),
        phone: stringValue(values.phone),
        company: stringValue(values.company),
        message: stringValue(values.message),
        source: form.key,
        consentGiven,
        consentVersion,
        consentGivenAt,
        consentSource: "public_form",
        status: LeadStatus.NEW,
      },
    });

    return { lead, submission };
  });

  try {
    await sendLeadNotificationEmail({
      formName: form.name,
      pageTitle: form.page?.title ?? null,
      pageSlug: form.page?.slug ?? null,
      submittedAt: result.submission.createdAt,
      to: form.recipientEmail,
      lead: {
        name: result.lead.name,
        email: result.lead.email,
        phone: result.lead.phone,
        company: result.lead.company,
        message: result.lead.message,
        source: result.lead.source,
      },
    });
  } catch {
    // Lead capture must not fail when the external email provider is unavailable.
  }

  return result.submission;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanSubmissionValues(values: Record<string, unknown>) {
  const cleaned = { ...values };
  delete cleaned[honeypotFieldName];
  delete cleaned["cf-turnstile-response"];
  delete cleaned.gdprConsent;
  delete cleaned.gdprConsentVersion;
  return cleaned;
}
