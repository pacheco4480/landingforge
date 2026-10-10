import { EmailType } from "@/generated/prisma/client";
import {
  getEmailBranding,
  sendEmail,
} from "@/features/email/services/email-provider.service";
import { renderLeadNotificationEmail } from "@/features/email/services/email-template.service";

export async function sendLeadNotificationEmail(input: {
  to: string;
  formName: string;
  pageTitle?: string | null;
  pageSlug?: string | null;
  submittedAt: Date;
  lead: {
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    message: string | null;
    source: string | null;
  };
}) {
  const branding = await getEmailBranding();
  const email = renderLeadNotificationEmail({ ...input, branding });

  return sendEmail({
    type: EmailType.NOTIFICATION_DIGEST,
    to: input.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
    metadata: {
      kind: "lead_notification",
      formName: input.formName,
      pageSlug: input.pageSlug,
      leadEmail: input.lead.email,
    },
  });
}
