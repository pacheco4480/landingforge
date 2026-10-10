import { SecurityEventType } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { recordSecurityEvent } from "@/lib/security/security-event.service";
import { getSecuritySettings } from "@/lib/security/security-settings.service";

export async function assertSubmissionCooldown(input: {
  formId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const settings = await getSecuritySettings();
  const since = new Date(Date.now() - settings.duplicateCooldownSeconds * 1000);
  if (!input.ipAddress) return;
  const duplicate = await db.formSubmission.findFirst({
    where: {
      formId: input.formId,
      ipAddress: input.ipAddress,
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  if (duplicate) {
    await recordSecurityEvent({
      type: SecurityEventType.SPAM_DETECTED,
      scope: "form-submit",
      key: `${input.formId}:${input.ipAddress}`,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: { reason: "duplicate_cooldown" },
    });
    throw new Error("Aguarda alguns segundos antes de voltar a enviar.");
  }
}
