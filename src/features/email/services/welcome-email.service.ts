import { EmailType } from "@/generated/prisma/client";
import {
  getEmailBranding,
  sendEmail,
} from "@/features/email/services/email-provider.service";
import { renderWelcomeEmail } from "@/features/email/services/email-template.service";

export async function sendWelcomeEmail(to: string, dashboardUrl: string) {
  const branding = await getEmailBranding();
  const email = renderWelcomeEmail({ dashboardUrl, branding });
  return sendEmail({
    type: EmailType.WELCOME,
    to,
    ...email,
  });
}
