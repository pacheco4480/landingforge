import { cookieConsentSchema } from "@/features/legal/schemas/legal.schema";
import { db } from "@/lib/db";

export async function saveCookieConsent(
  input: unknown,
  context: { ipAddress?: string; userAgent?: string },
) {
  const data = cookieConsentSchema.parse(input);
  return db.cookieConsent.upsert({
    where: { consentId: data.consentId },
    update: {
      version: data.version,
      necessary: true,
      analytics: data.analytics,
      marketing: data.marketing,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    },
    create: {
      consentId: data.consentId,
      version: data.version,
      necessary: true,
      analytics: data.analytics,
      marketing: data.marketing,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    },
  });
}
