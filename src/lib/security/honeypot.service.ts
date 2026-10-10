import { SecurityEventType } from "@/generated/prisma/client";
import { recordSecurityEvent } from "@/lib/security/security-event.service";
import { getSecuritySettings } from "@/lib/security/security-settings.service";

export const honeypotFieldName = "companyWebsite";

export async function assertHoneypot(input: {
  value?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const settings = await getSecuritySettings();
  if (!settings.honeypotEnabled) return;
  if (typeof input.value === "string" && input.value.trim()) {
    await recordSecurityEvent({
      type: SecurityEventType.HONEYPOT_TRIGGERED,
      scope: "form-submit",
      key: input.ipAddress ?? "unknown",
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    throw new Error("Não foi possível validar a submissão.");
  }
}
