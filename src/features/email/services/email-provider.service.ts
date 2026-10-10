import { Resend } from "resend";

import {
  EmailType,
  SystemLogLevel,
  SystemLogSource,
} from "@/generated/prisma/client";
import { getBrandingSettings } from "@/features/branding/services/branding.service";
import { assertEmailDailyLimit } from "@/features/email/services/email-limit.service";
import {
  createEmailLog,
  markEmailFailed,
  markEmailSent,
} from "@/features/email/services/email-log.service";
import { logMonitoringEvent } from "@/features/monitoring/services/logger.service";

export async function sendEmail(input: {
  type: EmailType;
  to: string;
  subject: string;
  text: string;
  html: string;
  metadata?: Record<string, unknown>;
}) {
  await assertEmailDailyLimit();
  const log = await createEmailLog({
    type: input.type,
    recipient: input.to,
    subject: input.subject,
    metadata: input.metadata,
  });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DEFAULT_FROM_EMAIL;
  if (!apiKey || !from) {
    await markEmailFailed(log.id, "Resend não está configurado.");
    await logMonitoringEvent({
      level: SystemLogLevel.WARNING,
      source: SystemLogSource.EMAIL,
      message: "Resend não está configurado.",
      action: "email.send",
      metadata: { type: input.type, logId: log.id },
    });
    return { sent: false, logId: log.id };
  }

  try {
    const response = await new Resend(apiKey).emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    await markEmailSent(log.id, response.data?.id ?? null);
    return { sent: true, logId: log.id };
  } catch (error) {
    await markEmailFailed(log.id, error);
    await logMonitoringEvent({
      level: SystemLogLevel.ERROR,
      source: SystemLogSource.EMAIL,
      error,
      action: "email.send",
      metadata: { type: input.type, logId: log.id },
    });
    return { sent: false, logId: log.id };
  }
}

export async function getEmailBranding() {
  const settings = await getBrandingSettings();
  return {
    businessName: settings.businessName,
    siteName: settings.siteName,
    primaryColor: settings.primaryColor,
    contactEmail: settings.contactEmail,
    logoUrl: settings.logoMedia?.publicUrl ?? null,
  };
}
