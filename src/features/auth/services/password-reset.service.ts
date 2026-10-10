import { createHash, randomBytes } from "node:crypto";

import { emailSchema } from "@/features/auth/schemas/auth.schema";
import { hashPassword } from "@/features/auth/services/password.service";
import { recordAuthEvent } from "@/features/auth/services/auth-audit.service";
import { sendPasswordResetEmail } from "@/features/email/services/password-reset-email.service";
import { db } from "@/lib/db";

const RESET_TTL_MS = 30 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(rawEmail: string) {
  const parsedEmail = emailSchema.safeParse(rawEmail);
  if (!parsedEmail.success) return;

  const user = await db.user.findUnique({ where: { email: parsedEmail.data } });
  if (!user) return;

  const token = randomBytes(32).toString("hex");
  await db.$transaction([
    db.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    }),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) return;

  const resetUrl = new URL("/reset-password", siteUrl);
  resetUrl.searchParams.set("token", token);

  await sendPasswordResetEmail(user.email, resetUrl.toString());
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = hashToken(token);
  const passwordHash = await hashPassword(password);

  const userId = await db.$transaction(async (tx) => {
    const resetToken = await tx.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt <= new Date()
    ) {
      return null;
    }

    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: resetToken.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) return null;

    await tx.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        authorizationVersion: { increment: 1 },
      },
    });
    return resetToken.userId;
  });

  if (!userId) return false;
  await recordAuthEvent("user.password_reset", userId);
  return true;
}
