import { EmailType } from "@/generated/prisma/client";
import {
  getEmailBranding,
  sendEmail,
} from "@/features/email/services/email-provider.service";
import { renderPasswordResetEmail } from "@/features/email/services/email-template.service";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const branding = await getEmailBranding();
  const email = renderPasswordResetEmail({ resetUrl, branding });
  return sendEmail({
    type: EmailType.PASSWORD_RESET,
    to,
    ...email,
  });
}
