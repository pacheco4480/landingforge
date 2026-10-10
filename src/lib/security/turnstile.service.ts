import { SecurityEventType } from "@/generated/prisma/client";
import { getSecuritySettings } from "@/lib/security/security-settings.service";
import { recordSecurityEvent } from "@/lib/security/security-event.service";

export async function verifyTurnstile(input: {
  token?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const settings = await getSecuritySettings();
  if (!settings.turnstileEnabled) return true;

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || !input.token) {
    await recordFailure(input, "missing_token_or_secret");
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret,
          response: input.token,
          ...(input.ipAddress ? { remoteip: input.ipAddress } : {}),
        }),
      },
    );
    const data = (await response.json()) as { success?: boolean };
    if (data.success) return true;
  } catch {
    await recordFailure(input, "network_error");
    return false;
  }

  await recordFailure(input, "invalid_token");
  return false;
}

async function recordFailure(input: {
  ipAddress?: string | null;
  userAgent?: string | null;
}, reason: string) {
  await recordSecurityEvent({
    type: SecurityEventType.TURNSTILE_FAILED,
    scope: "form-submit",
    key: input.ipAddress ?? "unknown",
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    metadata: { reason },
  });
}
